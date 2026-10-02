import { Schema, model, Document, Types } from "mongoose";

// Denormalized slot-blocking table used to prevent double-booking at the DB level.
export interface IProviderAvailability extends Document {
  providerId: Types.ObjectId;
  date: Date;
  time: string;
  bookingId?: Types.ObjectId;
  isBlocked: boolean;
}

const providerAvailabilitySchema = new Schema<IProviderAvailability>({
  providerId: { type: Schema.Types.ObjectId, ref: "ProviderProfile", required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  bookingId: { type: Schema.Types.ObjectId, ref: "Booking" },
  isBlocked: { type: Boolean, default: true },
});

providerAvailabilitySchema.index({ providerId: 1, date: 1, time: 1 }, { unique: true });

export const ProviderAvailability = model<IProviderAvailability>(
  "ProviderAvailability",
  providerAvailabilitySchema
);
