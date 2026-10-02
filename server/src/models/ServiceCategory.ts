import { Schema, model, Document } from "mongoose";

export interface IServiceCategory extends Document {
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const serviceCategorySchema = new Schema<IServiceCategory>(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true, index: true },
    icon: String,
    description: String,
    isEnabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const ServiceCategory = model<IServiceCategory>("ServiceCategory", serviceCategorySchema);
