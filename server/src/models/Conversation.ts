import { Schema, model, Document, Types } from "mongoose";

export interface IConversation extends Document {
  customerId: Types.ObjectId;
  providerId: Types.ObjectId;
  bookingId?: Types.ObjectId;
  lastMessageAt: Date;
  createdAt: Date;
}

const conversationSchema = new Schema<IConversation>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    providerId: { type: Schema.Types.ObjectId, ref: "ProviderProfile", required: true },
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking" },
    lastMessageAt: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

conversationSchema.index({ customerId: 1, providerId: 1 }, { unique: true });

export const Conversation = model<IConversation>("Conversation", conversationSchema);
