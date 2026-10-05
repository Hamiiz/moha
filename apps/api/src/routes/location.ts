import { Router } from "express";
import { strictLimiter } from "../middlewares/rateLimiter.js";
import { validateBody } from "../middlewares/validate.js";
import { LocationValidateSchema, validateLocation } from "../controllers/locationController.js";

const router: Router = Router();



/**
 * POST /api/v1/location/validate
 * Validates a Canadian postal code, returns lat/lng + surcharge.
 */
router.post("/validate", strictLimiter, validateBody(LocationValidateSchema), validateLocation);

export default router;
