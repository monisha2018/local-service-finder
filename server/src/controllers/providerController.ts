import { Response } from "express";
import { ProviderProfile } from "../models/ProviderProfile";
import { User } from "../models/User";
import { Service } from "../models/Service";
import { Review } from "../models/Review";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { AuthRequest } from "../middleware/auth";

// GET /api/providers/me — the logged-in provider's own profile
export const getMyProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const profile = await ProviderProfile.findOne({ userId: req.user!.id })
    .populate("userId", "name profileImage email phone")
    .populate("categories", "name slug");
  if (!profile) throw new ApiError(404, "Provider profile not found. Complete your profile first.");
  res.json({ success: true, data: profile });
});

// GET /api/providers  (list + filter + sort)
export const listProviders = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { category, minRating, maxPrice, verifiedOnly, sort, page = "1", limit = "12" } = req.query;

  const filter: any = {};
  if (category) filter.categories = category;
  if (minRating) filter.rating = { $gte: Number(minRating) };
  if (verifiedOnly === "true") filter.verificationStatus = "VERIFIED";

  let query = ProviderProfile.find(filter).populate("userId", "name profileImage").populate("categories", "name slug");

  const sortMap: Record<string, any> = {
    rating: { rating: -1 },
    experience: { experienceYears: -1 },
    newest: { createdAt: -1 },
  };
  query = query.sort(sortMap[sort as string] || { rating: -1 });

  const pageNum = Number(page);
  const limitNum = Number(limit);
  const [providers, total] = await Promise.all([
    query.skip((pageNum - 1) * limitNum).limit(limitNum),
    ProviderProfile.countDocuments(filter),
  ]);

  res.json({ success: true, data: providers, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
});

// GET /api/providers/nearby?lat=&lng=&radiusKm=&category=
export const nearbyProviders = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { lat, lng, radiusKm = "10", category } = req.query;
  if (!lat || !lng) throw new ApiError(400, "lat and lng query params are required.");

  const filter: any = {
    location: {
      $near: {
        $geometry: { type: "Point", coordinates: [Number(lng), Number(lat)] },
        $maxDistance: Number(radiusKm) * 1000,
      },
    },
    isAvailable: true,
  };
  if (category) filter.categories = category;

  const providers = await ProviderProfile.find(filter)
    .populate("userId", "name profileImage")
    .populate("categories", "name slug")
    .limit(50);

  res.json({ success: true, data: providers });
});

// GET /api/providers/:id
export const getProvider = asyncHandler(async (req: AuthRequest, res: Response) => {
  const provider = await ProviderProfile.findById(req.params.id)
    .populate("userId", "name profileImage phone")
    .populate("categories", "name slug icon");
  if (!provider) throw new ApiError(404, "Provider not found.");

  const services = await Service.find({ providerId: provider._id, isActive: true });
  res.json({ success: true, data: { provider, services } });
});

// POST /api/providers/profile  (provider completes/creates profile)
export const createOrUpdateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user!.id);
  if (!user || user.role !== "PROVIDER") throw new ApiError(403, "Only providers can manage a provider profile.");

  const { profession, bio, experienceYears, categories, serviceArea, languages, latitude, longitude, workingHours } = req.body;

  const update: any = { profession, bio, experienceYears, categories, serviceArea, languages, workingHours };
  if (latitude && longitude) {
    update.location = { type: "Point", coordinates: [longitude, latitude] };
  }

  const profile = await ProviderProfile.findOneAndUpdate(
    { userId: user._id },
    { $set: update },
    { new: true, upsert: true }
  );

  res.json({ success: true, data: profile });
});

// PUT /api/providers/profile
export const updateProfile = createOrUpdateProfile;

// GET /api/providers/:id/reviews
export const getProviderReviews = asyncHandler(async (req: AuthRequest, res: Response) => {
  const reviews = await Review.find({ providerId: req.params.id })
    .populate("customerId", "name profileImage")
    .sort({ createdAt: -1 });

  const distribution = [1, 2, 3, 4, 5].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  res.json({ success: true, data: { reviews, distribution, total: reviews.length } });
});

// POST /api/providers/verification-docs — real file upload (multipart/form-data), saved to server disk
export const uploadVerificationDoc = asyncHandler(async (req: AuthRequest, res: Response) => {
  const file = (req as any).file;
  if (!file) throw new ApiError(400, "No file was uploaded.");

  const docType = req.body.type || "Document";
  const fileUrl = `/uploads/${file.filename}`;

  const profile = await ProviderProfile.findOneAndUpdate(
    { userId: req.user!.id },
    { $push: { verificationDocs: { type: docType, url: fileUrl, uploadedAt: new Date() } } },
    { new: true }
  );
  if (!profile) throw new ApiError(404, "Provider profile not found.");

  res.status(201).json({ success: true, data: profile });
});