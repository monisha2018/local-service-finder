import { Router } from "express";
import { listNotifications, markAsRead } from "../controllers/notificationController";
import { protect } from "../middleware/auth";

const router = Router();
router.get("/", protect, listNotifications);
router.patch("/:id/read", protect, markAsRead);

export default router;
