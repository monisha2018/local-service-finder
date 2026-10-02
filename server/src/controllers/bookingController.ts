import { Response } from "express";
import mongoose from "mongoose";
import { Booking, BOOKING_TRANSITIONS, BookingStatus } from "../models/Booking";
import { Service } from "../models/Service";
import { ProviderProfile } from "../models/ProviderProfile";
import { ProviderAvailability } from "../models/ProviderAvailability";
import { Notification } from "../models/Notification";
import { generateBookingNumber } from "../utils/generateBookingNumber";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { AuthRequest } from "../middleware/auth";
import { env } from "../config/env";

// POST /api/bookings — create a PENDING booking and hard-block the slot
export const createBooking = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { providerId, serviceId, categoryId, scheduledDate, scheduledTime, address, latitude, longitude, description } = req.body;

  const service = await Service.findById(serviceId);
  if (!service || !service.isActive) throw new ApiError(404, "Service not found or no longer offered.");

  const provider = await ProviderProfile.findById(providerId);
  if (!provider) throw new ApiError(404, "Provider not found.");
  if (provider.verificationStatus !== "VERIFIED") {
    throw new ApiError(400, "This provider is not yet verified and cannot accept bookings.");
  }

  const amount = service.price;
  const commissionAmount = Math.round((amount * env.commissionPercent) / 100);
  const providerAmount = amount - commissionAmount;
  const bookingNumber = await generateBookingNumber();

  const session = await mongoose.startSession();
  try {
    let booking;
    await session.withTransaction(async () => {
      // Atomically claim the slot — prevents double-booking at the DB level
      await ProviderAvailability.create(
        [{ providerId, date: new Date(scheduledDate), time: scheduledTime, isBlocked: true }],
        { session }
      );

      const created = await Booking.create(
        [
          {
            bookingNumber,
            customerId: req.user!.id,
            providerId,
            serviceId,
            categoryId,
            scheduledDate: new Date(scheduledDate),
            scheduledTime,
            address,
            location: { type: "Point", coordinates: [longitude, latitude] },
            description,
            amount,
            commissionAmount,
            providerAmount,
            status: "PENDING",
            paymentStatus: "PENDING",
          },
        ],
        { session }
      );
      booking = created[0];

      await ProviderAvailability.updateOne(
        { providerId, date: new Date(scheduledDate), time: scheduledTime },
        { $set: { bookingId: created[0]._id } },
        { session }
      );

      await Notification.create(
        [
          {
            userId: provider.userId,
            type: "NEW_BOOKING",
            title: "New booking request",
            message: `You have a new booking request (${bookingNumber}).`,
            relatedBookingId: created[0]._id,
          },
        ],
        { session }
      );
    });

    res.status(201).json({ success: true, data: booking });
  } catch (err: any) {
    if (err.code === 11000) {
      throw new ApiError(409, "This time slot was just booked by someone else. Please choose another time.");
    }
    throw err;
  } finally {
    session.endSession();
  }
});

// GET /api/bookings — role-aware: customer sees own, provider sees own, admin sees all via /admin
export const listBookings = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status } = req.query;
  const filter: any = {};
  if (status) filter.status = status;

  if (req.user!.role === "CUSTOMER") {
    filter.customerId = req.user!.id;
    } else if (req.user!.role === "PROVIDER") {
    const profile = await ProviderProfile.findOne({ userId: req.user!.id });
    if (!profile) {
      // No provider profile yet — return an empty list rather than silently
      // dropping the filter (which would otherwise return every booking).
      return res.json({ success: true, data: [] });
    }
    filter.providerId = profile._id;
  }

  const bookings = await Booking.find(filter)
    .populate("serviceId", "name price")
    .populate({ path: "providerId", populate: { path: "userId", select: "name profileImage" } })
    .populate("customerId", "name profileImage phone")
    .sort({ createdAt: -1 });

  res.json({ success: true, data: bookings });
});

export const getBooking = asyncHandler(async (req: AuthRequest, res: Response) => {
  const booking = await Booking.findById(req.params.id)
    .populate("serviceId")
    .populate({ path: "providerId", populate: { path: "userId", select: "name profileImage phone" } })
    .populate("customerId", "name profileImage phone");
  if (!booking) throw new ApiError(404, "Booking not found.");

  await assertBookingAccess(req, booking);
  res.json({ success: true, data: booking });
});

// PATCH /api/bookings/:id/status — enforces the state machine, provider-only for most transitions
export const updateBookingStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status: nextStatus } = req.body as { status: BookingStatus };
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw new ApiError(404, "Booking not found.");

  await assertBookingAccess(req, booking);

  const allowed = BOOKING_TRANSITIONS[booking.status];
  if (!allowed.includes(nextStatus)) {
    throw new ApiError(400, `Cannot move booking from ${booking.status} to ${nextStatus}.`);
  }

  booking.status = nextStatus;
  await booking.save();

  const notifyMap: Partial<Record<BookingStatus, { type: string; title: string }>> = {
    ACCEPTED: { type: "BOOKING_ACCEPTED", title: "Booking accepted" },
    REJECTED: { type: "BOOKING_REJECTED", title: "Booking rejected" },
    PROVIDER_ON_THE_WAY: { type: "PROVIDER_ON_THE_WAY", title: "Provider is on the way" },
    IN_PROGRESS: { type: "SERVICE_STARTED", title: "Service started" },
    COMPLETED: { type: "SERVICE_COMPLETED", title: "Service completed" },
  };
  const note = notifyMap[nextStatus];
  if (note) {
    await Notification.create({
      userId: booking.customerId,
      type: note.type,
      title: note.title,
      message: `Booking ${booking.bookingNumber} is now ${nextStatus}.`,
      relatedBookingId: booking._id,
    });
  }

  res.json({ success: true, data: booking });
});

// PATCH /api/bookings/:id/cancel
export const cancelBooking = asyncHandler(async (req: AuthRequest, res: Response) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw new ApiError(404, "Booking not found.");
  await assertBookingAccess(req, booking);

  if (!BOOKING_TRANSITIONS[booking.status].includes("CANCELLED")) {
    throw new ApiError(400, `Booking in status ${booking.status} cannot be cancelled.`);
  }

  booking.status = "CANCELLED";
  booking.cancelReason = req.body.reason;
  await booking.save();

  await ProviderAvailability.deleteOne({
    providerId: booking.providerId,
    date: booking.scheduledDate,
    time: booking.scheduledTime,
  });

  res.json({ success: true, data: booking });
});

async function assertBookingAccess(req: AuthRequest, booking: any) {
  if (req.user!.role === "ADMIN") return;

  // booking.customerId / booking.providerId may already be populated (full objects)
  // by the caller — always compare against the raw id, never the populated object.
  const rawCustomerId = booking.customerId?._id ? String(booking.customerId._id) : String(booking.customerId);
  const rawProviderId = booking.providerId?._id ? String(booking.providerId._id) : String(booking.providerId);

  if (req.user!.role === "CUSTOMER") {
    if (rawCustomerId !== req.user!.id) {
      throw new ApiError(403, "You cannot access another customer's booking.");
    }
    return;
  }
  if (req.user!.role === "PROVIDER") {
    const profile = await ProviderProfile.findOne({ userId: req.user!.id });
    if (!profile || rawProviderId !== String(profile._id)) {
      throw new ApiError(403, "You cannot access another provider's booking.");
    }
    return;
  }
  throw new ApiError(403, "Access denied.");
}
