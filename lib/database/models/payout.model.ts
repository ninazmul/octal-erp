import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPayoutDocument extends Document {
  payoutNo: string;
  instructor: mongoose.Types.ObjectId;
  settlement?: mongoose.Types.ObjectId | null;
  batchBreakdown?: Array<{
    batchId: string;
    batchName: string;
    amount: number;
  }>;
  amount: number;
  paymentMethod: string;
  transactionRef?: string;
  accountId?: mongoose.Types.ObjectId | null;
  payoutDate: Date;
  paidBy: {
    email: string;
    name?: string;
    userId?: string;
  };
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PayoutSchema: Schema = new Schema(
  {
    payoutNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    instructor: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    settlement: {
      type: Schema.Types.ObjectId,
      ref: "Settlement",
      default: null,
    },
    batchBreakdown: [
      {
        batchId: { type: String, required: true },
        batchName: { type: String, required: true },
        amount: { type: Number, required: true },
      },
    ],
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ["Cash", "Bank Transfer", "bKash", "Nagad", "Rocket", "Card", "Other"],
      default: "Cash",
    },
    transactionRef: {
      type: String,
      trim: true,
      default: "",
    },
    accountId: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      default: null,
    },
    payoutDate: {
      type: Date,
      default: Date.now,
    },
    paidBy: {
      email: { type: String, required: true },
      name: { type: String, default: "" },
      userId: { type: String, default: "" },
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

PayoutSchema.index({ payoutNo: 1 });
PayoutSchema.index({ instructor: 1 });
PayoutSchema.index({ settlement: 1 });
PayoutSchema.index({ payoutDate: -1 });

const Payout: Model<IPayoutDocument> =
  mongoose.models.Payout || mongoose.model<IPayoutDocument>("Payout", PayoutSchema);

export default Payout;

