import { Response } from "express";
import { Service } from "../models/Service";
import { ServiceCategory } from "../models/ServiceCategory";
import { ProviderProfile } from "../models/ProviderProfile";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { AuthRequest } from "../middleware/auth";

export const listCategories = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const categories = await ServiceCategory.find({ isEnabled: true }).sort({ name: 1 });
  res.json({ success: true, data: categories });
});

// GET /api/services?category=&q=&providerId=
export const listServices = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { category, q, providerId } = req.query;
  const filter: any = { isActive: true };
  if (category) filter.categoryId = category;
  if (providerId) filter.providerId = providerId;
  if (q) filter.name = { $regex: q as string, $options: "i" };

  const services = await Service.find(filter).populate("categoryId", "name slug").populate({
    path: "providerId",
    select: "profession rating reviewCount userId",
    populate: { path: "userId", select: "name profileImage" },
  });

  res.json({ success: true, data: services });
});

export const createService = asyncHandler(async (req: AuthRequest, res: Response) => {
  const profile = await ProviderProfile.findOne({ userId: req.user!.id });
  if (!profile) throw new ApiError(404, "Complete your provider profile before adding services.");

  const service = await Service.create({ ...req.body, providerId: profile._id });
  res.status(201).json({ success: true, data: service });
});

export const updateService = asyncHandler(async (req: AuthRequest, res: Response) => {
  const profile = await ProviderProfile.findOne({ userId: req.user!.id });
  const service = await Service.findOne({ _id: req.params.id, providerId: profile?._id });
  if (!service) throw new ApiError(404, "Service not found or you don't have permission to edit it.");

  Object.assign(service, req.body);
  await service.save();
  res.json({ success: true, data: service });
});

export const deleteService = asyncHandler(async (req: AuthRequest, res: Response) => {
  const profile = await ProviderProfile.findOne({ userId: req.user!.id });
  const service = await Service.findOneAndDelete({ _id: req.params.id, providerId: profile?._id });
  if (!service) throw new ApiError(404, "Service not found or you don't have permission to delete it.");
  res.json({ success: true, message: "Service deleted." });
});
