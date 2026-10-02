import { Schema, model, Document, Types } from "mongoose";

export type VerificationStatus = "PENDING" | "VERIFIED" | "REJECTED";

export interface IWorkingHours {
  day: "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";
  startTime: string; // "09:00"
  endTime: string; // "18:00"
  isWorking: boolean;
}

export interface IProviderProfile extends Document {
  userId: Types.ObjectId;
  profession: string;
  bio?: string;
  experienceYears: number;
  categories: Types.ObjectId[];
  serviceArea: string;
  location: {
    type: "Point";
    coordinates: [number, number];
  };
  languages: string[];
  verificationStatus: VerificationStatus;
  verificationDocs: { type: string; url: string; uploadedAt: Date }[];
  rating: number;
  reviewCount: number;
  workingHours: IWorkingHours[];
  unavailableDates: Date[];
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const providerProfileSchema = new Schema<IProviderProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    profession: { type: String, required: true },
    bio: String,
    experienceYears: { type: Number, default: 0 },
    categories: [{ type: Schema.Types.ObjectId, ref: "ServiceCategory" }],
    serviceArea: String,
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [0, 0] },
    },
    languages: [String],
    verificationStatus: { type: String, enum: ["PENDING", "VERIFIED", "REJECTED"], default: "PENDING", index: true },
    verificationDocs: [
      { type: { type: String }, url: String, uploadedAt: { type: Date, default: Date.now } },
    ],
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    workingHours: [
      {
        day: { type: String, enum: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] },
        startTime: String,
        endTime: String,
        isWorking: { type: Boolean, default: true },
      },
    ],
    unavailableDates: [Date],
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

providerProfileSchema.index({ location: "2dsphere" });
providerProfileSchema.index({ profession: "text", bio: "text" });

export const ProviderProfile = model<IProviderProfile>("ProviderProfile", providerProfileSchema);
