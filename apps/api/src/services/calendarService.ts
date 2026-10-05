import { google } from "googleapis";
import { env } from "../config/env.js";
import { calendarCache } from "../utils/cache.js";
import { logger } from "../utils/logger.js";
import { AppError } from "../middlewares/errorHandler.js";
import { getSettings, type DaySchedule } from "./storeService.js";

const LESSON_DURATION_MS = 90 * 60_000;   // 90 minutes
const BUFFER_MS          = 30 * 60_000;   // 30-minute buffer
const SLOT_STEP_MS       = 15 * 60_000;   // 15-min scan step

export interface TimeSlot {
  start: string;
  end:   string;
}

export interface CalendarEvent {
  id:          string;
  summary:     string;
  start:       string;
  end:         string;
  description?: string;
  location?:    string;
}

export interface BookingPayload {
  studentName:     string;
  email:           string;
  phone:           string;
  experienceLevel: "beginner" | "intermediate" | "advanced";
  slot:            TimeSlot;
  pickupAddress:   string;
  pickupLat:       number;
  pickupLng:       number;
  surcharge:       number;
  basePrice:       number;
}

function hasCalendarCredentials(): boolean {
  return Boolean(env.GOOGLE_CLIENT_EMAIL && env.GOOGLE_PRIVATE_KEY);
}

function buildAuthClient() {
  const email = env.GOOGLE_CLIENT_EMAIL;
  const key   = env.GOOGLE_PRIVATE_KEY;

  if (!email || !key) {
    throw new AppError(
      503,
      "Google Calendar credentials are not set.",
      "CALENDAR_NOT_CONFIGURED",
    );
  }

  return new google.auth.JWT({
    email,
    key:    key.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });
}

function getCalendar() {
  return google.calendar({ version: "v3", auth: buildAuthClient() });
}

export async function getEventsForDate(date: string): Promise<CalendarEvent[]> {
  const cached = calendarCache.get<CalendarEvent[]>(date);
  if (cached !== undefined) {
    return cached;
  }

  if (!hasCalendarCredentials()) {
    logger.warn({ date }, "Google Calendar credentials not configured — returning open schedule");
    return [];
  }

  try {
    const calendar  = getCalendar();
    const dayStart  = new Date(`${date}T00:00:00.000`);
    const dayEnd    = new Date(`${date}T23:59:59.999`);

    const res = await calendar.events.list({
      calendarId:   env.GOOGLE_CALENDAR_ID ?? "primary",
      timeMin:      dayStart.toISOString(),
      timeMax:      dayEnd.toISOString(),
      singleEvents: true,
      orderBy:      "startTime",
    });

    const events: CalendarEvent[] = (res.data.items ?? []).map((e) => ({
      id:          e.id          ?? "",
      summary:     e.summary     ?? "(no title)",
      start:       e.start?.dateTime ?? e.start?.date ?? "",
      end:         e.end?.dateTime   ?? e.end?.date   ?? "",
      description: e.description ?? "",
      location:    e.location    ?? "",
    }));

    calendarCache.set(date, events);
    return events;
  } catch (err: any) {
    logger.error({ err, date }, "Google Calendar API list events failed");
    if (err instanceof AppError) throw err;
    throw new AppError(503, "Google Calendar service unavailable: " + (err.message || "Unknown error"), "CALENDAR_ERROR");
  }
}

export function computeAvailableSlots(dateStr: string, events: CalendarEvent[]): TimeSlot[] {
  const currentSettings = getSettings();
  const dateObj = new Date(`${dateStr}T12:00:00`);
  const dayIndex = dateObj.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat

  const dayKeys: Array<DaySchedule["day"]> = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const currentDayKey = dayKeys[dayIndex];

  const dayConfig = currentSettings.weeklySchedule.find((d) => d.day === currentDayKey);

  // If instructor marked this day off, return no available slots
  if (!dayConfig || dayConfig.isOff) {
    return [];
  }

  const startHour = String(dayConfig.startHour).padStart(2, "0");
  const endHour   = String(dayConfig.endHour).padStart(2, "0");
  const workStart = new Date(`${dateStr}T${startHour}:00:00`).getTime();
  const workEnd   = new Date(`${dateStr}T${endHour}:00:00`).getTime();

  const blocked: Array<[number, number]> = events
    .filter((e) => e.start && e.end)
    .map((e) => [
      new Date(e.start).getTime() - BUFFER_MS,
      new Date(e.end).getTime()   + BUFFER_MS,
    ]);

  const slots: TimeSlot[] = [];
  let cursor = workStart;

  while (cursor + LESSON_DURATION_MS <= workEnd) {
    const slotEnd  = cursor + LESSON_DURATION_MS;
    const overlaps = blocked.some(([bs, be]) => cursor < be && slotEnd > bs);

    if (!overlaps) {
      slots.push({
        start: new Date(cursor).toISOString(),
        end:   new Date(slotEnd).toISOString(),
      });
      cursor = slotEnd;
    } else {
      cursor += SLOT_STEP_MS;
    }
  }

  return slots;
}

export async function checkDoubleBooking(slot: TimeSlot): Promise<boolean> {
  const date = slot.start.slice(0, 10);
  calendarCache.del(date);

  const events    = await getEventsForDate(date);
  const slotStart = new Date(slot.start).getTime();
  const slotEnd   = new Date(slot.end).getTime();

  return events.some((e) => {
    const es = new Date(e.start).getTime();
    const ee = new Date(e.end).getTime();
    return slotStart < ee && slotEnd > es;
  });
}

export async function createBooking(payload: BookingPayload): Promise<string> {
  if (!hasCalendarCredentials()) {
    logger.warn({ student: payload.studentName }, "Google Calendar credentials not configured — returning mock booking ID");
    return `mock-booking-${Date.now()}`;
  }

  try {
    const calendar = getCalendar();
    const total    = payload.basePrice + payload.surcharge;
    const mapsUrl  = `https://www.google.com/maps/dir/?api=1&destination=${payload.pickupLat},${payload.pickupLng}`;

    const description = [
      `━━━ Student Details ━━━`,
      `Name:   ${payload.studentName}`,
      `Email:  ${payload.email}`,
      `Phone:  ${payload.phone}`,
      `Level:  ${payload.experienceLevel}`,
      ``,
      `━━━ Pricing (CAD) ━━━`,
      `Base Lesson:  $${payload.basePrice.toFixed(2)}`,
      `Surcharge:    $${payload.surcharge.toFixed(2)}`,
      `Total:        $${total.toFixed(2)}`,
      ``,
      `━━━ Navigation ━━━`,
      `Pickup: ${payload.pickupAddress}`,
      `Directions: ${mapsUrl}`,
    ].join("\n");

    const event = await calendar.events.insert({
      calendarId: env.GOOGLE_CALENDAR_ID ?? "primary",
      requestBody: {
        summary:     `Driving Lesson: ${payload.studentName}`,
        location:    payload.pickupAddress,
        description,
        start: { dateTime: payload.slot.start, timeZone: "America/Toronto" },
        end:   { dateTime: payload.slot.end,   timeZone: "America/Toronto" },
      },
    });

    const eventId = event.data.id ?? `booking-${Date.now()}`;
    calendarCache.del(payload.slot.start.slice(0, 10));
    logger.info({ eventId, student: payload.studentName }, "booking created");
    return eventId;
  } catch (err: any) {
    logger.error({ err, student: payload.studentName }, "Google Calendar insert event failed");
    if (err instanceof AppError) throw err;
    throw new AppError(503, "Failed to create Google Calendar event: " + (err.message || "Unknown error"), "CALENDAR_INSERT_FAILED");
  }
}

export async function deleteCalendarEvent(eventId: string): Promise<void> {
  if (!hasCalendarCredentials()) return;
  try {
    const calendar = getCalendar();
    await calendar.events.delete({
      calendarId: env.GOOGLE_CALENDAR_ID ?? "primary",
      eventId,
    });
    calendarCache.flushAll();
  } catch (err: any) {
    logger.error({ err, eventId }, "Failed to delete calendar event");
    throw new AppError(500, "Failed to cancel event from Google Calendar", "CALENDAR_DELETE_FAILED");
  }
}
