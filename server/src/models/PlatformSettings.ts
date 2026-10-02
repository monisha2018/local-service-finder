import { Schema, model, Document } from "mongoose";

export interface IPlatformSettings extends Document {
  commissionPercent: number;
  supportEmail: string;
  supportPhone: string;
  updatedAt: Date;
}

const platformSettingsSchema = new Schema<IPlatformSettings>(
  {
    commissionPercent: { type: Number, default: 10 },
    supportEmail: { type: String, default: "support@localservicefinder.com" },
    supportPhone: { type: String, default: "+91-9840000000" },
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

export const PlatformSettings = model<IPlatformSettings>("PlatformSettings", platformSettingsSchema);
