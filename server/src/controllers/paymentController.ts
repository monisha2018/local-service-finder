import { Response } from "express";
import crypto from "crypto";
import { getRazorpay } from "../config/razorpay";
import { env } from "../config/env";
import { Payment } from "../models/Payment";
import { Booking } from "../models/Booking";
import { Notification } from "../models/Notification";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { AuthRequest } from "../middleware/auth";

// POST /api/payments/create-order
export const createOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { bookingId } = req.body;
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new ApiError(404, "Booking not found.");
  if (String(booking.customerId) !== req.user!.id) throw new ApiError(403, "This is not your booking.");
  if (booking.paymentStatus === "SUCCESS") throw new ApiError(400, "This booking is already paid for.");

  const order = await getRazorpay().orders.create({
    amount: Math.round(booking.amount * 100), // paise
    currency: "INR",
    receipt: booking.bookingNumber,
    notes: { bookingId: String(booking._id) },
  });

  const payment = await Payment.create({
    bookingId: booking._id,
    customerId: booking.customerId,
    providerId: booking.providerId,
    razorpayOrderId: order.id,
    amount: booking.amount,
    currency: "INR",
    status: "PENDING",
  });

  res.json({
    success: true,
    data: { orderId: order.id, amount: order.amount, currency: order.currency, keyId: env.razorpayKeyId, paymentId: payment._id },
  });
});

// POST /api/payments/verify — the ONLY place a payment can be marked successful.
// Frontend "success" callbacks are never trusted on their own.
export const verifyPayment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const expectedSignature = crypto
    .createHmac("sha256", env.razorpayKeySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
  if (!payment) throw new ApiError(404, "Payment record not found.");

  if (expectedSignature !== razorpay_signature) {
    payment.status = "FAILED";
    await payment.save();
    throw new ApiError(400, "Payment verification failed. Signature mismatch.");
  }

  payment.razorpayPaymentId = razorpay_payment_id;
  payment.razorpaySignature = razorpay_signature;
  payment.status = "SUCCESS";
  await payment.save();

  const booking = await Booking.findById(payment.bookingId);
  if (booking) {
    booking.paymentStatus = "SUCCESS";
    if (booking.status === "PENDING" || booking.status === "ACCEPTED") {
      booking.status = "CONFIRMED";
    }
    await booking.save();

    await Notification.create({
      userId: booking.customerId,
      type: "PAYMENT_SUCCESS",
      title: "Payment successful",
      message: `Your payment for booking ${booking.bookingNumber} was successful.`,
      relatedBookingId: booking._id,
    });
  }

  res.json({ success: true, message: "Payment verified successfully.", data: payment });
});

// POST /api/payments/refund
export const refundPayment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { bookingId } = req.body;
  const payment = await Payment.findOne({ bookingId, status: "SUCCESS" });
  if (!payment) throw new ApiError(404, "No successful payment found for this booking.");

  await getRazorpay().payments.refund(payment.razorpayPaymentId!, {});
  payment.status = "REFUNDED";
  await payment.save();

  await Booking.findByIdAndUpdate(bookingId, { status: "REFUNDED", paymentStatus: "REFUNDED" });

  res.json({ success: true, message: "Refund initiated." });
});
