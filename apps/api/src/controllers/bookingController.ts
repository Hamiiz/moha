import { type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { checkDoubleBooking, createBooking } from "../services/calendarService.js";
import { AppError } from "../middlewares/errorHandler.js";

export const BookingSchema = z.object({
  studentName: z
    .string()
    .trim()
    .min(2,   "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters"),

  email: z.string().trim().email("Invalid email address"),

  phone: z
    .string()
    .trim()
    .regex(/^\+?[\d\s\-().]{7,20}$/, "Invalid phone number"),

  experienceLevel: z.enum(["beginner", "intermediate", "advanced"]),

  slot: z.object({
    start: z.string().datetime({ offset: true, message: "slot.start must be an ISO 8601 datetime" }),
    end:   z.string().datetime({ offset: true, message: "slot.end must be an ISO 8601 datetime" }),
  }).refine(
    (s) => new Date(s.start) < new Date(s.end),
    { message: "slot.start must be before slot.end", path: ["start"] },
  ),

  pickupAddress: z.string().trim().min(5).max(200),

  pickupLat: z.number().min(-90).max(90),
  pickupLng: z.number().min(-180).max(180),

  /** Surcharge already calculated by /location/validate (0 or 10 CAD). */
  surcharge: z.number().min(0),

  /** Base lesson price quoted to the student. */
  basePrice: z.number().positive(),
});

export type BookingBody = z.infer<typeof BookingSchema>;

export async function createBookingHandler(
  req:  Request,
  res:  Response,
  next: NextFunction,
): Promise<void> {
  try {
    const payload = req.body as BookingBody;

    // Re-verify slot availability right before confirming (race-condition guard)
    const isDoubleBooked = await checkDoubleBooking(payload.slot);
    if (isDoubleBooked) {
      throw new AppError(
        409,
        "This time slot was taken while you were booking — please select another",
        "SLOT_CONFLICT",
      );
    }

    const eventId    = await createBooking(payload);
    const totalCost  = payload.basePrice + payload.surcharge;

    res.status(201).json({
      success: true,
      data: {
        bookingId:     eventId,
        studentName:   payload.studentName,
        email:         payload.email,
        slot:          payload.slot,
        pickupAddress: payload.pickupAddress,
        mapsUrl:       `https://www.google.com/maps/dir/?api=1&destination=${payload.pickupLat},${payload.pickupLng}`,
        pricing: {
          base:      payload.basePrice,
          surcharge: payload.surcharge,
          total:     totalCost,
          currency:  "CAD",
        },
        confirmedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
}
