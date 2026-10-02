import { Response } from "express";
import { Complaint } from "../models/Complaint";
import { Booking } from "../models/Booking";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { AuthRequest } from "../middleware/auth";

export const createComplaint = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { bookingId } = req.body;
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new ApiError(404, "Booking not found.");
  if (String(booking.customerId) !== req.user!.id) throw new ApiError(403, "You cannot file a complaint on someone else's booking.");

  const complaint = await Complaint.create({ ...req.body, customerId: req.user!.id });
  res.status(201).json({ success: true, data: complaint });
});

export const listMyComplaints = asyncHandler(async (req: AuthRequest, res: Response) => {
  const complaints = await Complaint.find({ customerId: req.user!.id }).sort({ createdAt: -1 });
  res.json({ success: true, data: complaints });
});

export const getComplaintById = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const complaint = await Complaint.findById(req.params.id)
      .populate("customerId", "name email")
      .populate("bookingId", "bookingNumber");

    if (!complaint) {
      throw new ApiError(404, "Complaint not found.");
    }

    res.json({
      success: true,
      data: complaint,
    });
  }
);

export const adminRespondToComplaint = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { adminResponse, status } = req.body;

    if (!adminResponse && !status) {
      throw new ApiError(400, "Response or status is required.");
    }

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      throw new ApiError(404, "Complaint not found.");
    }

    if (adminResponse !== undefined) {
      complaint.adminResponse = adminResponse;
    }

    if (status !== undefined) {
      complaint.status = status;
    }

    await complaint.save();

    res.json({
      success: true,
      message: "Complaint updated successfully.",
      data: complaint,
    });
  }
);