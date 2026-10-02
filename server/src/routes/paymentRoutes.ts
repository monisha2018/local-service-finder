import { Router } from "express";
import { createOrder, verifyPayment, refundPayment } from "../controllers/paymentController";
import { protect, authorize } from "../middleware/auth";

const router = Router();
router.post("/create-order", protect, authorize("CUSTOMER"), createOrder);
router.post("/verify", protect, authorize("CUSTOMER"), verifyPayment);
router.post("/refund", protect, authorize("ADMIN"), refundPayment);

export default router;
