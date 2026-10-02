import { Router } from "express";
import { createBooking, listBookings, getBooking, updateBookingStatus, cancelBooking } from "../controllers/bookingController";
import { validate } from "../middleware/validate";
import { createBookingSchema } from "../utils/validators";
import { protect, authorize } from "../middleware/auth";

const router = Router();
router.post("/", protect, authorize("CUSTOMER"), validate(createBookingSchema), createBooking);
router.get("/", protect, listBookings);
router.get("/:id", protect, getBooking);
router.patch("/:id/status", protect, authorize("PROVIDER", "ADMIN"), updateBookingStatus);
router.patch("/:id/cancel", protect, cancelBooking);

export default router;
