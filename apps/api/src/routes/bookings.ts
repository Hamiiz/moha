import { Router } from "express";
import { strictLimiter } from "../middlewares/rateLimiter.js";
import { validateBody } from "../middlewares/validate.js";
import { BookingSchema, createBookingHandler } from "../controllers/bookingController.js";

const router: Router = Router();



/**
 * POST /api/v1/bookings
 * Confirms a driving lesson booking and creates a Google Calendar event.
 */
router.post("/", strictLimiter, validateBody(BookingSchema), createBookingHandler);

export default router;
