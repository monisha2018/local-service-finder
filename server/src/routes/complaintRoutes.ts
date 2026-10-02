import { Router } from "express";

import {
  createComplaint,
  listMyComplaints,
  getComplaintById,
  adminRespondToComplaint,
} from "../controllers/complaintController";

import { validate } from "../middleware/validate";

import { complaintSchema } from "../utils/validators";

import { protect, authorize } from "../middleware/auth";

const router = Router();

// Customer routes
router.post(
  "/",
  protect,
  authorize("CUSTOMER"),
  validate(complaintSchema),
  createComplaint
);

router.get(
  "/my",
  protect,
  authorize("CUSTOMER"),
  listMyComplaints
);

// Admin routes
router.get(
  "/:id",
  protect,
  authorize("ADMIN"),
  getComplaintById
);

router.patch(
  "/:id",
  protect,
  authorize("ADMIN"),
  adminRespondToComplaint
);

export default router;