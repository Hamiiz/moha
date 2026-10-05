import { Router } from "express";
import { validateQuery } from "../middlewares/validate.js";
import { AvailabilityQuerySchema, getAvailability } from "../controllers/availabilityController.js";

const router: Router = Router();



/**
 * GET /api/v1/availability?date=YYYY-MM-DD
 * Returns available 90-minute lesson slots for the given date.
 */
router.get("/", validateQuery(AvailabilityQuerySchema), getAvailability);

export default router;
