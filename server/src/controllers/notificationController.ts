import { Response } from "express";
import { Notification } from "../models/Notification";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthRequest } from "../middleware/auth";

export const listNotifications = asyncHandler(async (req: AuthRequest, res: Response) => {
  const notifications = await Notification.find({ userId: req.user!.id }).sort({ createdAt: -1 }).limit(50);
  const unreadCount = await Notification.countDocuments({ userId: req.user!.id, isRead: false });
  res.json({ success: true, data: notifications, unreadCount });
});

export const markAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  await Notification.findOneAndUpdate({ _id: req.params.id, userId: req.user!.id }, { isRead: true });
  res.json({ success: true });
});
