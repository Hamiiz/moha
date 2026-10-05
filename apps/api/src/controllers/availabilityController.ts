import { type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { getEventsForDate, computeAvailableSlots } from "../services/calendarService.js";
import { AppError } from "../middlewares/errorHandler.js";

export const AvailabilityQuerySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "date must be in YYYY-MM-DD format"),
});

export type AvailabilityQuery = z.infer<typeof AvailabilityQuerySchema>;

export async function getAvailability(
  _req: Request,
  res:  Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { date } = res.locals["validatedQuery"] as AvailabilityQuery;

    // Reject invalid calendar dates (e.g., "2024-13-45")
    const parsed = new Date(`${date}T00:00:00`);
    if (isNaN(parsed.getTime())) {
      throw new AppError(400, "Invalid calendar date", "INVALID_DATE");
    }

    // Reject past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (parsed < today) {
      throw new AppError(400, "Cannot query availability for past dates", "PAST_DATE");
    }

    const events = await getEventsForDate(date);
    const slots  = computeAvailableSlots(date, events);

    res.json({
      success: true,
      data: {
        date,
        dayOfWeek:           parsed.toLocaleDateString("en-CA", { weekday: "long" }),
        totalAvailableSlots: slots.length,
        slots,
      },
    });
  } catch (err) {
    next(err);
  }
}
