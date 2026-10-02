import { Schema, model, Document, Types } from "mongoose";

export type BookingStatus =
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED"
  | "CONFIRMED"
  | "PROVIDER_ON_THE_WAY"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "REFUNDED";

export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";

export interface IBooking extends Document {
  bookingNumber: string;
  customerId: Types.ObjectId;
  providerId: Types.ObjectId;
  serviceId: Types.ObjectId;
  categoryId: Types.ObjectId;
  scheduledDate: Date;
  scheduledTime: string;
  address: string;
  location: { type: "Point"; coordinates: [number, number] };
  description?: string;
  amount: number;
  commissionAmount: number;
  providerAmount: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  cancelReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    bookingNumber: { type: String, required: true, unique: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    providerId: { type: Schema.Types.ObjectId, ref: "ProviderProfile", required: true, index: true },
    serviceId: { type: Schema.Types.ObjectId, ref: "Service", required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: "ServiceCategory", required: true },
    scheduledDate: { type: Date, required: true },
    scheduledTime: { type: String, required: true },
    address: { type: String, required: true },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [0, 0] },
    },
    description: String,
    amount: { type: Number, required: true },
    commissionAmount: { type: Number, required: true },
    providerAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: [
        "PENDING", "ACCEPTED", "REJECTED", "CONFIRMED", "PROVIDER_ON_THE_WAY",
        "IN_PROGRESS", "COMPLETED", "CANCELLED", "REFUNDED",
      ],
      default: "PENDING",
      index: true,
    },
    paymentStatus: { type: String, enum: ["PENDING", "SUCCESS", "FAILED", "REFUNDED"], default: "PENDING" },
    cancelReason: String,
  },
  { timestamps: true }
);

bookingSchema.index({ createdAt: -1 });
bookingSchema.index({ providerId: 1, scheduledDate: 1, scheduledTime: 1 });

// Valid state transitions - enforced in the booking service, not just documented here
export const BOOKING_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  PENDING: ["ACCEPTED", "REJECTED", "CANCELLED"],
  ACCEPTED: ["CONFIRMED", "CANCELLED"],
  REJECTED: [],
  CONFIRMED: ["PROVIDER_ON_THE_WAY", "CANCELLED"],
  PROVIDER_ON_THE_WAY: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: ["REFUNDED"],
  REFUNDED: [],
};

export const Booking = model<IBooking>("Booking", bookingSchema);
