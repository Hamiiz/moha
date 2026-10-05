import { Router } from "express";
import locationRouter     from "./location.js";
import availabilityRouter from "./availability.js";
import bookingsRouter     from "./bookings.js";
import instructorRouter   from "./instructor.js";
import { listPackagesPublicHandler } from "../controllers/instructorController.js";

const router: Router = Router();

router.get("/packages",     listPackagesPublicHandler); // Public lesson packages endpoint
router.use("/location",     locationRouter);
router.use("/availability", availabilityRouter);
router.use("/bookings",     bookingsRouter);
router.use("/instructor",   instructorRouter);

export default router;
