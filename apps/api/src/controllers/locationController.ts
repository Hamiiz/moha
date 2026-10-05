import { type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { geocodePostalCode, CANADIAN_POSTAL_CODE_RE } from "../services/geocodingService.js";
import { calculateSurcharge } from "../utils/haversine.js";
import { AppError } from "../middlewares/errorHandler.js";
import { env } from "../config/env.js";

export const LocationValidateSchema = z.object({
  postalCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(CANADIAN_POSTAL_CODE_RE, "Invalid Canadian postal code (expected format: A1A 1A1)"),
});

export type LocationValidateBody = z.infer<typeof LocationValidateSchema>;

export async function validateLocation(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { postalCode } = req.body as LocationValidateBody;

    const geo = await geocodePostalCode(postalCode);
    if (geo === null) {
      throw new AppError(422, "Could not geocode the provided postal code", "GEOCODE_FAILED");
    }

    const surcharge = calculateSurcharge(geo.lat, geo.lng, env.BASE_LAT, env.BASE_LNG);
    const { distanceKm, ...surchargeRest } = surcharge;

    res.json({
      success: true,
      data: {
        postalCode,
        location:   { lat: geo.lat, lng: geo.lng, displayName: geo.displayName },
        distanceKm: Math.round(distanceKm * 10) / 10,
        ...surchargeRest,
      },
    });

  } catch (err) {
    next(err);
  }
}
