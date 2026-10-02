import { Schema, model, Document, Types } from "mongoose";

export interface IFavorite extends Document {
  customerId: Types.ObjectId;
  providerId: Types.ObjectId;
  createdAt: Date;
}

const favoriteSchema = new Schema<IFavorite>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    providerId: { type: Schema.Types.ObjectId, ref: "ProviderProfile", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

favoriteSchema.index({ customerId: 1, providerId: 1 }, { unique: true });

export const Favorite = model<IFavorite>("Favorite", favoriteSchema);
