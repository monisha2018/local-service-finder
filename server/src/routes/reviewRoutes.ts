import { Router } from "express";
import { createReview } from "../controllers/reviewController";
import { validate } from "../middleware/validate";
import { reviewSchema } from "../utils/validators";
import { protect, authorize } from "../middleware/auth";

const router = Router();
router.post("/", protect, authorize("CUSTOMER"), validate(reviewSchema), createReview);

export default router;
