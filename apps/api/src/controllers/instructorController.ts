import { type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { env } from "../config/env.js";
import { AppError } from "../middlewares/errorHandler.js";
import { geocodePostalCode } from "../services/geocodingService.js";
import {
  getSettings,
  updateSettings,
  updateWeeklySchedule,
  getPickupHubs,
  addPickupHub,
  deletePickupHub,
  getPackages,
  addPackage,
  updatePackage,
  deletePackage,
} from "../services/storeService.js";
import { getEventsForDate, deleteCalendarEvent } from "../services/calendarService.js";

// ── Validation Schemas ───────────────────────────────────────────────────────

export const LoginSchema = z.object({
  pin: z.string().min(1, "Passcode/PIN is required"),
});

export const HubCreateSchema = z.object({
  name:    z.string().min(2, "Hub name required"),
  address: z.string().min(5, "Street address required"),
  lat:     z.number().optional(),
  lng:     z.number().optional(),
});

export const PackageSchema = z.object({
  title:       z.string().min(2),
  description: z.string().min(5),
  basePrice:   z.number().positive(),
  badge:       z.string().optional(),
});

export const DayScheduleSchema = z.object({
  day:       z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]),
  label:     z.string(),
  startHour: z.number().int().min(0).max(23),
  endHour:   z.number().int().min(0).max(23),
  isOff:     z.boolean(),
});

export const WeeklyScheduleSchema = z.array(DayScheduleSchema);

// ── Handlers ─────────────────────────────────────────────────────────────────

export async function loginInstructor(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { pin } = req.body;
    if (pin !== env.INSTRUCTOR_PIN) {
      throw new AppError(401, "Invalid instructor passcode", "INVALID_PIN");
    }

    const token = `token-${env.INSTRUCTOR_PIN}`;
    res.json({
      success: true,
      data: { token, message: "Authenticated successfully as instructor" },
    });
  } catch (err) {
    next(err);
  }
}

export async function getInstructorSettingsHandler(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json({ success: true, data: getSettings() });
  } catch (err) {
    next(err);
  }
}

export async function updateWeeklyScheduleHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const updated = updateWeeklySchedule(req.body);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

// ── Auto-Geocoded Pickup Hubs ─────────────────────────────────────────────────

export async function listHubsHandler(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json({ success: true, data: getPickupHubs() });
  } catch (err) {
    next(err);
  }
}

export async function createHubHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, address, lat, lng } = req.body;

    let finalLat = lat;
    let finalLng = lng;

    // Auto-geocode address if lat/lng are not explicitly supplied
    if (finalLat === undefined || finalLng === undefined) {
      const geo = await geocodePostalCode(address);
      if (geo) {
        finalLat = geo.lat;
        finalLng = geo.lng;
      } else {
        // Fallback default coordinates if geocoding yields no result
        finalLat = 43.7000;
        finalLng = -79.4000;
      }
    }

    const created = addPickupHub({
      name,
      address,
      lat: finalLat,
      lng: finalLng,
    });

    res.status(201).json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
}

export async function deleteHubHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params["id"] || "");
    const deleted = deletePickupHub(id);
    if (!deleted) {
      throw new AppError(404, "Pickup hub not found", "NOT_FOUND");
    }
    res.json({ success: true, data: { message: "Pickup hub deleted successfully" } });
  } catch (err) {
    next(err);
  }
}

// ── Package CRUD Handlers ─────────────────────────────────────────────────────

export async function listPackagesPublicHandler(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json({ success: true, data: getPackages() });
  } catch (err) {
    next(err);
  }
}

export async function createPackageHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const created = addPackage(req.body);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
}

export async function updatePackageHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params["id"] || "");
    const updated = updatePackage(id, req.body);
    if (!updated) {
      throw new AppError(404, "Package not found", "NOT_FOUND");
    }
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

export async function deletePackageHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params["id"] || "");
    const deleted = deletePackage(id);
    if (!deleted) {
      throw new AppError(404, "Package not found", "NOT_FOUND");
    }
    res.json({ success: true, data: { message: "Package deleted successfully" } });
  } catch (err) {
    next(err);
  }
}

// ── Booking Handlers ─────────────────────────────────────────────────────────

export async function getInstructorBookingsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const queryDate = req.query["date"];
    const date = typeof queryDate === "string" ? queryDate : new Date().toISOString().slice(0, 10);
    const events = await getEventsForDate(date);
    res.json({ success: true, data: { date, totalEvents: events.length, bookings: events } });
  } catch (err) {
    next(err);
  }
}

export async function deleteInstructorBookingHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params["id"] || "");
    await deleteCalendarEvent(id);
    res.json({ success: true, data: { message: "Booking cancelled successfully" } });
  } catch (err) {
    next(err);
  }
}
