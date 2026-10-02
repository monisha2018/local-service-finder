import { Response } from "express";
import { Review } from "../models/Review";
import { Booking } from "../models/Booking";
import { ProviderProfile } from "../models/ProviderProfile";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { AuthRequest } from "../middleware/auth";

export const createReview = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { bookingId, rating, comment } = req.body;

  const booking = await Booking.findById(bookingId);
  if (!booking) throw new ApiError(404, "Booking not found.");
  if (String(booking.customerId) !== req.user!.id) throw new ApiError(403, "You cannot review someone else's booking.");
  if (booking.status !== "COMPLETED") throw new ApiError(400, "You can only review completed bookings.");

  const existing = await Review.findOne({ bookingId });
  if (existing) throw new ApiError(409, "You have already reviewed this booking.");

  const review = await Review.create({
    bookingId,
    customerId: req.user!.id,
    providerId: booking.providerId,
    rating,
    comment,
  });

  const stats = await Review.aggregate([
    { $match: { providerId: booking.providerId } },
    { $group: { _id: "$providerId", avgRating: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  if (stats[0]) {
    await ProviderProfile.findByIdAndUpdate(booking.providerId, {
      rating: Math.round(stats[0].avgRating * 10) / 10,
      reviewCount: stats[0].count,
    });
  }

  res.status(201).json({ success: true, data: review });
});
