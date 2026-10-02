import { Response } from "express";
import { Favorite } from "../models/Favorite";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { AuthRequest } from "../middleware/auth";

export const addFavorite = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { providerId } = req.params;
  const existing = await Favorite.findOne({ customerId: req.user!.id, providerId });
  if (existing) throw new ApiError(409, "Provider is already in your favorites.");

  const favorite = await Favorite.create({ customerId: req.user!.id, providerId });
  res.status(201).json({ success: true, data: favorite });
});

export const removeFavorite = asyncHandler(async (req: AuthRequest, res: Response) => {
  await Favorite.findOneAndDelete({ customerId: req.user!.id, providerId: req.params.providerId });
  res.json({ success: true, message: "Removed from favorites." });
});

export const listFavorites = asyncHandler(async (req: AuthRequest, res: Response) => {
  const favorites = await Favorite.find({ customerId: req.user!.id }).populate({
    path: "providerId",
    populate: { path: "userId", select: "name profileImage" },
  });
  res.json({ success: true, data: favorites });
});
