import { Schema, model, Document, Types } from "mongoose";

export interface IService extends Document {
  providerId: Types.ObjectId;
  categoryId: Types.ObjectId;
  name: string;
  description?: string;
  price: number;
  durationMinutes: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const serviceSchema = new Schema<IService>(
  {
    providerId: { type: Schema.Types.ObjectId, ref: "ProviderProfile", required: true, index: true },
    categoryId: { type: Schema.Types.ObjectId, ref: "ServiceCategory", required: true, index: true },
    name: { type: String, required: true },
    description: String,
    price: { type: Number, required: true },
    durationMinutes: { type: Number, default: 60 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Service = model<IService>("Service", serviceSchema);
