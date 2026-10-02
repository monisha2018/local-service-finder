import { Schema, model, Document, Types } from "mongoose";

export type NotificationType =
  | "BOOKING_CREATED" | "BOOKING_ACCEPTED" | "BOOKING_REJECTED" | "PROVIDER_ON_THE_WAY"
  | "SERVICE_STARTED" | "SERVICE_COMPLETED" | "PAYMENT_SUCCESS" | "BOOKING_CANCELLED"
  | "REVIEW_REMINDER" | "NEW_BOOKING" | "NEW_REVIEW" | "PAYMENT_CONFIRMED";

export interface INotification extends Document {
  userId: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  relatedBookingId?: Types.ObjectId;
  isRead: boolean;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    relatedBookingId: { type: Schema.Types.ObjectId, ref: "Booking" },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Notification = model<INotification>("Notification", notificationSchema);
