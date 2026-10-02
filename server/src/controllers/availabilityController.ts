import { Response } from "express";
import { ProviderProfile } from "../models/ProviderProfile";
import { ProviderAvailability } from "../models/ProviderAvailability";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { AuthRequest } from "../middleware/auth";

// PUT /api/providers/availability — set weekly working hours + unavailable dates
export const setAvailability = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { workingHours, unavailableDates, isAvailable } = req.body;
  const profile = await ProviderProfile.findOneAndUpdate(
    { userId: req.user!.id },
    { $set: { workingHours, unavailableDates, isAvailable } },
    { new: true }
  );
  if (!profile) throw new ApiError(404, "Provider profile not found.");
  res.json({ success: true, data: profile });
});

// GET /api/providers/:id/booked-slots?date=YYYY-MM-DD — used by the booking flow to grey out taken slots
export const getBookedSlots = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { date } = req.query;
  if (!date) throw new ApiError(400, "date query param is required.");

  const slots = await ProviderAvailability.find({
    providerId: req.params.id,
    date: new Date(date as string),
    isBlocked: true,
  }).select("time -_id");

  res.json({ success: true, data: slots.map((s) => s.time) });
});
