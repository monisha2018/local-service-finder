import { Schema, model, Document, Types } from "mongoose";

export type ComplaintStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "CLOSED";

export type ComplaintPriority = "LOW" | "MEDIUM" | "HIGH";

export interface IComplaint extends Document {
  customerId: Types.ObjectId;
  bookingId: Types.ObjectId;
  subject: string;
  description: string;
  priority: ComplaintPriority;
  attachments: string[];
  status: ComplaintStatus;
  adminResponse?: string;
  createdAt: Date;
  updatedAt: Date;
}

const complaintSchema = new Schema<IComplaint>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    bookingId: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },

    subject: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH"],
      default: "MEDIUM",
    },

    attachments: [String],

    status: {
      type: String,
      enum: ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"],
      default: "OPEN",
      index: true,
    },

    adminResponse: String,
  },
  { timestamps: true }
);

export const Complaint = model<IComplaint>("Complaint", complaintSchema);