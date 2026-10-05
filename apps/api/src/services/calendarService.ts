import { google } from "googleapis";
import { env } from "../config/env.js";
import { calendarCache } from "../utils/cache.js";
import { logger } from "../utils/logger.js";

const LESSON_DURATION_MS = 90 * 60_000;   // 90 minutes
const BUFFER_MS          = 30 * 60_000;   // 30-minute travel/prep buffer
const SLOT_STEP_MS       = 15 * 60_000;   // granularity when scanning blocked windows

export interface TimeSlot {
  start: string; // ISO 8601
  end:   string; // ISO 8601
}

export interface CalendarEvent {
  id:      string;
  summary: string;
  start:   string;
  end:     string;
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

// ── Auth ─────────────────────────────────────────────────────────────────────

function buildAuthClient() {
  const email = env.GOOGLE_CLIENT_EMAIL;
  const key   = env.GOOGLE_PRIVATE_KEY;

  if (!email || !key) {
    throw new Error(
      "GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY must be set to use Calendar features.",
    );
  }

  return new google.auth.JWT({
    email,
    // Service-account keys stored in env vars use literal \\n — convert to real newlines
    key:    key.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });
}

function getCalendar() {
  return google.calendar({ version: "v3", auth: buildAuthClient() });
}

// ── Events ───────────────────────────────────────────────────────────────────

/**
 * Fetches all events for a given date (YYYY-MM-DD) from Google Calendar.
 * Results are cached for 60 seconds per date to reduce API quota usage.
 */
export async function getEventsForDate(date: string): Promise<CalendarEvent[]> {
  const cached = calendarCache.get<CalendarEvent[]>(date);
  if (cached !== undefined) {
    logger.debug({ date }, "calendar cache hit");
    return cached;
  }

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
    id:      e.id      ?? "",
    summary: e.summary ?? "(no title)",
    start:   e.start?.dateTime ?? e.start?.date ?? "",
    end:     e.end?.dateTime   ?? e.end?.date   ?? "",
  }));

  calendarCache.set(date, events);
  logger.debug({ date, count: events.length }, "fetched calendar events");
  return events;
}

// ── Slot computation ─────────────────────────────────────────────────────────

/**
 * Returns all available 90-minute booking slots for a given date.
 *
 * Algorithm:
 *   1. Build "blocked" windows = [event.start - 30 min, event.end + 30 min]
 *   2. Walk through the working day in 15-min steps
 *   3. If a 90-min window starting at `cursor` doesn't overlap any blocked window → add it
 *      and jump cursor forward by 90 min (no overlapping slots for one instructor)
 *   4. Otherwise advance cursor by 15 min and retry
 */
export function computeAvailableSlots(date: string, events: CalendarEvent[]): TimeSlot[] {
  const startHour = String(env.WORK_START_HOUR).padStart(2, "0");
  const endHour   = String(env.WORK_END_HOUR).padStart(2, "0");
  const workStart = new Date(`${date}T${startHour}:00:00`).getTime();
  const workEnd   = new Date(`${date}T${endHour}:00:00`).getTime();

  // Widen each event by the buffer on both sides
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
      cursor = slotEnd; // no overlap between suggested slots
    } else {
      cursor += SLOT_STEP_MS;
    }
  }

  return slots;
}

// ── Double-booking guard ─────────────────────────────────────────────────────

/**
 * Confirms whether the requested slot overlaps any existing calendar event.
 * Always fetches fresh data (cache is invalidated) to avoid race conditions.
 */
export async function checkDoubleBooking(slot: TimeSlot): Promise<boolean> {
  const date = slot.start.slice(0, 10);
  calendarCache.del(date); // force fresh read

  const events    = await getEventsForDate(date);
  const slotStart = new Date(slot.start).getTime();
  const slotEnd   = new Date(slot.end).getTime();

  return events.some((e) => {
    const es = new Date(e.start).getTime();
    const ee = new Date(e.end).getTime();
    return slotStart < ee && slotEnd > es;
  });
}

// ── Booking creation ─────────────────────────────────────────────────────────

/**
 * Creates a new Google Calendar event for the confirmed booking.
 * Returns the created event's ID.
 * Invalidates the calendar cache for the booking date after creation.
 */
export async function createBooking(payload: BookingPayload): Promise<string> {
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

  const eventId = event.data.id ?? "";
  calendarCache.del(payload.slot.start.slice(0, 10));
  logger.info({ eventId, student: payload.studentName }, "booking created");
  return eventId;
}
