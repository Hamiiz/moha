import { Router } from "express";
import locationRouter     from "./location.js";
import availabilityRouter from "./availability.js";
import bookingsRouter     from "./bookings.js";

const router: Router = Router();



router.use("/location",     locationRouter);
router.use("/availability", availabilityRouter);
router.use("/bookings",     bookingsRouter);

export default router;
