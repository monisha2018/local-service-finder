import { Response } from "express";
import { User } from "../models/User";
import { ProviderProfile } from "../models/ProviderProfile";
import { Booking } from "../models/Booking";
import { Payment } from "../models/Payment";
import { Review } from "../models/Review";
import { Complaint } from "../models/Complaint";
import { ServiceCategory } from "../models/ServiceCategory";
import { PlatformSettings } from "../models/PlatformSettings";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { AuthRequest } from "../middleware/auth";

export const getDashboard = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const [totalUsers, totalProviders, verifiedProviders, totalBookings, completedBookings, revenueAgg] =
    await Promise.all([
      User.countDocuments({ role: "CUSTOMER" }),
      ProviderProfile.countDocuments(),
      ProviderProfile.countDocuments({ verificationStatus: "VERIFIED" }),
      Booking.countDocuments(),
      Booking.countDocuments({ status: "COMPLETED" }),
      Payment.aggregate([
        { $match: { status: "SUCCESS" } },
        { $group: { _id: null, revenue: { $sum: "$amount" } } },
      ]),
    ]);

    const commissionAgg = await Booking.aggregate([
    { $match: { paymentStatus: "SUCCESS" } },
    { $group: { _id: null, commission: { $sum: "$commissionAmount" } } },
  ]);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthlyRevenueAgg = await Payment.aggregate([
    { $match: { status: "SUCCESS", createdAt: { $gte: monthStart } } },
    { $group: { _id: null, revenue: { $sum: "$amount" } } },
  ]);

  const monthlyBookings = await Booking.aggregate([
    { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
    { $limit: 12 },
  ]);

  const monthlyRevenueSeries = await Payment.aggregate([
    { $match: { status: "SUCCESS" } },
    { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }, revenue: { $sum: "$amount" } } },
    { $sort: { _id: 1 } },
    { $limit: 12 },
  ]);

  const popularCategories = await Booking.aggregate([
    { $lookup: { from: "servicecategories", localField: "categoryId", foreignField: "_id", as: "cat" } },
    { $unwind: "$cat" },
    { $group: { _id: "$cat.name", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 8 },
  ]);

  res.json({
    success: true,
    data: {
      totalUsers,
      totalProviders,
      verifiedProviders,
      totalBookings,
      completedBookings,
      revenue: revenueAgg[0]?.revenue || 0,
      monthlyRevenue: monthlyRevenueAgg[0]?.revenue || 0,
      commission: commissionAgg[0]?.commission || 0,
      monthlyBookings,
      monthlyRevenueSeries,
      popularCategories,
    },
  });
});

export const listUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { q, role, status } = req.query;
  const filter: any = {};
  if (role) filter.role = role;
  if (status) filter.status = status;
  if (q) filter.$or = [{ name: { $regex: q, $options: "i" } }, { email: { $regex: q, $options: "i" } }];

  const users = await User.find(filter).select("-passwordHash").sort({ createdAt: -1 });
  res.json({ success: true, data: users });
});

export const suspendUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findByIdAndUpdate(req.params.id, { status: "SUSPENDED" }, { new: true });
  if (!user) throw new ApiError(404, "User not found.");
  res.json({ success: true, data: user });
});

export const reactivateUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findByIdAndUpdate(req.params.id, { status: "ACTIVE" }, { new: true });
  if (!user) throw new ApiError(404, "User not found.");
  res.json({ success: true, data: user });
});

export const listProvidersAdmin = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { verificationStatus } = req.query;
  const filter: any = {};
  if (verificationStatus) filter.verificationStatus = verificationStatus;

  const providers = await ProviderProfile.find(filter).populate("userId", "name email phone").sort({ createdAt: -1 });
  res.json({ success: true, data: providers });
});

export const verifyProvider = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status } = req.body; // VERIFIED | REJECTED
  if (!["VERIFIED", "REJECTED"].includes(status)) throw new ApiError(400, "status must be VERIFIED or REJECTED.");

  const provider = await ProviderProfile.findByIdAndUpdate(req.params.id, { verificationStatus: status }, { new: true });
  if (!provider) throw new ApiError(404, "Provider not found.");
  res.json({ success: true, data: provider });
});

export const listBookingsAdmin = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const bookings = await Booking.find()
    .populate("customerId", "name email")
    .populate({ path: "providerId", populate: { path: "userId", select: "name" } })
    .sort({ createdAt: -1 })
    .limit(200);
  res.json({ success: true, data: bookings });
});

export const listPaymentsAdmin = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const payments = await Payment.find().populate("bookingId", "bookingNumber").sort({ createdAt: -1 }).limit(200);
  res.json({ success: true, data: payments });
});

export const listReviewsAdmin = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const reviews = await Review.find().populate("customerId", "name").sort({ createdAt: -1 }).limit(200);
  res.json({ success: true, data: reviews });
});

export const listComplaintsAdmin = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const complaints = await Complaint.find().populate("customerId", "name email").populate("bookingId", "bookingNumber").sort({ createdAt: -1 });
  res.json({ success: true, data: complaints });
});

export const updateComplaintAdmin = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status, adminResponse } = req.body;
  const complaint = await Complaint.findByIdAndUpdate(req.params.id, { status, adminResponse }, { new: true });
  if (!complaint) throw new ApiError(404, "Complaint not found.");
  res.json({ success: true, data: complaint });
});

// Categories
export const createCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const category = await ServiceCategory.create(req.body);
  res.status(201).json({ success: true, data: category });
});

export const updateCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const category = await ServiceCategory.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!category) throw new ApiError(404, "Category not found.");
  res.json({ success: true, data: category });
});

export const deleteCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
  await ServiceCategory.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: "Category deleted." });
});

// Settings
export const getSettings = asyncHandler(async (_req: AuthRequest, res: Response) => {
  let settings = await PlatformSettings.findOne();
  if (!settings) settings = await PlatformSettings.create({});
  res.json({ success: true, data: settings });
});

export const updateSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  let settings = await PlatformSettings.findOne();
  if (!settings) settings = await PlatformSettings.create(req.body);
  else {
    Object.assign(settings, req.body);
    await settings.save();
  }
  res.json({ success: true, data: settings });
});
