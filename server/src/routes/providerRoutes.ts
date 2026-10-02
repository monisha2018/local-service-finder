import { Router } from "express";
import {
  listProviders, nearbyProviders, getProvider, getMyProfile, createOrUpdateProfile, updateProfile, getProviderReviews, uploadVerificationDoc,
} from "../controllers/providerController";
import { setAvailability, getBookedSlots } from "../controllers/availabilityController";
import { upload } from "../config/Upload";
import { protect, authorize } from "../middleware/auth";

const router = Router();
router.get("/", listProviders);
router.get("/nearby", nearbyProviders);
router.get("/me", protect, authorize("PROVIDER"), getMyProfile);
router.post("/verification-docs", protect, authorize("PROVIDER"), upload.single("file"), uploadVerificationDoc);
router.put("/availability", protect, authorize("PROVIDER"), setAvailability);
router.post("/profile", protect, authorize("PROVIDER"), createOrUpdateProfile);
router.put("/profile", protect, authorize("PROVIDER"), updateProfile);
router.get("/:id", getProvider);
router.get("/:id/reviews", getProviderReviews);
router.get("/:id/booked-slots", getBookedSlots);

export default router;
