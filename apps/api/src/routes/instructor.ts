import { Router } from "express";
import { strictLimiter } from "../middlewares/rateLimiter.js";
import { validateBody } from "../middlewares/validate.js";
import { requireInstructorAuth } from "../middlewares/instructorAuth.js";
import {
  LoginSchema,
  HubCreateSchema,
  PackageSchema,
  WeeklyScheduleSchema,
  loginInstructor,
  getInstructorSettingsHandler,
  updateWeeklyScheduleHandler,
  listHubsHandler,
  createHubHandler,
  deleteHubHandler,
  createPackageHandler,
  updatePackageHandler,
  deletePackageHandler,
  getInstructorBookingsHandler,
  deleteInstructorBookingHandler,
} from "../controllers/instructorController.js";

const router: Router = Router();

// Public auth endpoint
router.post("/login", strictLimiter, validateBody(LoginSchema), loginInstructor);

// Protected Instructor Endpoints
router.use(requireInstructorAuth);

// Per-Day Weekly Schedule & Settings
router.get("/settings", getInstructorSettingsHandler);
router.put("/schedule", validateBody(WeeklyScheduleSchema), updateWeeklyScheduleHandler);

// Auto-Geocoded Pickup Hubs Management
router.get("/hubs", listHubsHandler);
router.post("/hubs", validateBody(HubCreateSchema), createHubHandler);
router.delete("/hubs/:id", deleteHubHandler);

// Lesson Packages & Pricing CRUD
router.post("/packages", validateBody(PackageSchema), createPackageHandler);
router.put("/packages/:id", validateBody(PackageSchema), updatePackageHandler);
router.delete("/packages/:id", deletePackageHandler);

// Bookings
router.get("/bookings", getInstructorBookingsHandler);
router.delete("/bookings/:id", deleteInstructorBookingHandler);

export default router;
