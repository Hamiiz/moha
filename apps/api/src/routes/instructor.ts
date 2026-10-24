import { Router } from "express";
import { strictLimiter } from "../middlewares/rateLimiter.js";
import { validateBody } from "../middlewares/validate.js";
import { requireInstructorAuth } from "../middlewares/instructorAuth.js";
import {
  LoginSchema,
  HubCreateSchema,
  PackageSchema,
  VehicleSchema,
  SettingsUpdateSchema,
  WeeklyScheduleSchema,
  loginInstructor,
  getInstructorSettingsHandler,
  updateInstructorSettingsHandler,
  updateWeeklyScheduleHandler,
  listHubsHandler,
  createHubHandler,
  deleteHubHandler,
  createPackageHandler,
  updatePackageHandler,
  deletePackageHandler,
  listFleetPublicHandler,
  createVehicleHandler,
  updateVehicleHandler,
  deleteVehicleHandler,
  getInstructorBookingsHandler,
  deleteInstructorBookingHandler,
} from "../controllers/instructorController.js";

const router: Router = Router();

// Public auth endpoint
router.post("/login", strictLimiter, validateBody(LoginSchema), loginInstructor);

// Protected Instructor Endpoints
router.use(requireInstructorAuth);

// Site Settings & Working Hours
router.get("/settings", getInstructorSettingsHandler);
router.put("/settings", validateBody(SettingsUpdateSchema), updateInstructorSettingsHandler);
router.put("/schedule", validateBody(WeeklyScheduleSchema), updateWeeklyScheduleHandler);

// Auto-Geocoded Pickup Hubs Management
router.get("/hubs", listHubsHandler);
router.post("/hubs", validateBody(HubCreateSchema), createHubHandler);
router.delete("/hubs/:id", deleteHubHandler);

// Lesson Packages & Pricing CRUD
router.post("/packages", validateBody(PackageSchema), createPackageHandler);
router.put("/packages/:id", validateBody(PackageSchema), updatePackageHandler);
router.delete("/packages/:id", deletePackageHandler);

// Vehicle Fleet Management (No image hosting needed)
router.get("/fleet", listFleetPublicHandler);
router.post("/fleet", validateBody(VehicleSchema), createVehicleHandler);
router.put("/fleet/:id", validateBody(VehicleSchema), updateVehicleHandler);
router.delete("/fleet/:id", deleteVehicleHandler);

// Bookings
router.get("/bookings", getInstructorBookingsHandler);
router.delete("/bookings/:id", deleteInstructorBookingHandler);

export default router;
