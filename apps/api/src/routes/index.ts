import { Router } from "express";
import locationRouter     from "./location.js";
import availabilityRouter from "./availability.js";
import bookingsRouter     from "./bookings.js";
import instructorRouter   from "./instructor.js";
import {
  listPackagesPublicHandler,
  getPublicSettingsHandler,
  listFleetPublicHandler,
} from "../controllers/instructorController.js";

const router: Router = Router();

// Public endpoints
router.get("/packages",     listPackagesPublicHandler);
router.get("/settings",     getPublicSettingsHandler);
router.get("/fleet",        listFleetPublicHandler);

router.use("/location",     locationRouter);
router.use("/availability", availabilityRouter);
router.use("/bookings",     bookingsRouter);
router.use("/instructor",   instructorRouter);

export default router;
