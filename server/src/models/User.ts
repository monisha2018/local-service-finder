import { Schema, model, Document, Types } from "mongoose";

export type UserRole = "CUSTOMER" | "PROVIDER" | "ADMIN";
export type UserStatus = "ACTIVE" | "SUSPENDED";

export interface IUser extends Document {
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: UserRole;
  profileImage?: string;
  location?: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
    city?: string;
    area?: string;
    address?: string;
  };
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    phone: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["CUSTOMER", "PROVIDER", "ADMIN"], default: "CUSTOMER", index: true },
    profileImage: { type: String },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [0, 0] },
      city: String,
      area: String,
      address: String,
    },
    status: { type: String, enum: ["ACTIVE", "SUSPENDED"], default: "ACTIVE" },
  },
  { timestamps: true }
);

userSchema.index({ location: "2dsphere" });

export const User = model<IUser>("User", userSchema);
