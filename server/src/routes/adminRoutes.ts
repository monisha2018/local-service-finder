import { Router } from "express";
import {
  getDashboard, listUsers, suspendUser, reactivateUser,
  listProvidersAdmin, verifyProvider,
  listBookingsAdmin, listPaymentsAdmin, listReviewsAdmin,
  listComplaintsAdmin, updateComplaintAdmin,
  createCategory, updateCategory, deleteCategory,
  getSettings, updateSettings,
} from "../controllers/adminController";
import { protect, authorize } from "../middleware/auth";

const router = Router();
router.use(protect, authorize("ADMIN"));

router.get("/dashboard", getDashboard);

router.get("/users", listUsers);
router.patch("/users/:id/suspend", suspendUser);
router.patch("/users/:id/reactivate", reactivateUser);

router.get("/providers", listProvidersAdmin);
router.patch("/providers/:id/verify", verifyProvider);

router.get("/bookings", listBookingsAdmin);
router.get("/payments", listPaymentsAdmin);
router.get("/reviews", listReviewsAdmin);

router.get("/complaints", listComplaintsAdmin);
router.patch("/complaints/:id", updateComplaintAdmin);

router.post("/categories", createCategory);
router.put("/categories/:id", updateCategory);
router.delete("/categories/:id", deleteCategory);

router.get("/settings", getSettings);
router.put("/settings", updateSettings);

export default router;
