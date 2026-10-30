import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAccountDocument extends Document {
  accountName: string;
  accountNumber?: string;
  type: "Cash" | "Bank" | "MFS";
  bankName?: string;
  openingBalance: number;
  currentBalance: number;
  isDefault: boolean;
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AccountSchema: Schema = new Schema(
  {
    accountName: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    accountNumber: {
      type: String,
      trim: true,
      default: "",
    },
    type: {
      type: String,
      required: true,
      enum: ["Cash", "Bank", "MFS"],
      default: "Cash",
    },
    bankName: {
      type: String,
      trim: true,
      default: "",
    },
    openingBalance: {
      type: Number,
      required: true,
      default: 0,
    },
    currentBalance: {
      type: Number,
      required: true,
      default: 0,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

AccountSchema.index({ type: 1 });
AccountSchema.index({ isActive: 1, isDefault: 1 });
AccountSchema.index({ isDefault: -1, accountName: 1 });

const Account: Model<IAccountDocument> =
  mongoose.models.Account || mongoose.model<IAccountDocument>("Account", AccountSchema);

export default Account;

