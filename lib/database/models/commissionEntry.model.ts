import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICommissionEntryDocument extends Document {
  payment: mongoose.Types.ObjectId;
  enrollment: mongoose.Types.ObjectId;
  batch: mongoose.Types.ObjectId;
  referrer: mongoose.Types.ObjectId;
  collectedAmount: number;
  commissionRate: number;
  commissionEarned: number;
  settlementId?: mongoose.Types.ObjectId | null;
  status:
    | "earned"
    | "awaiting_settlement"
    | "approved_payable"
    | "partially_paid"
    | "fully_paid"
    | "adjusted"
    | "disputed";
  paidAmount: number;
  remainingCommission: number;
  createdAt: Date;
  updatedAt: Date;
}

const CommissionEntrySchema: Schema = new Schema(
  {
    payment: {
      type: Schema.Types.ObjectId,
      ref: "Payment",
      required: true,
      unique: true, // Exactly one commission entry generated per payment
    },
    enrollment: {
      type: Schema.Types.ObjectId,
      ref: "Enrollment",
      required: true,
    },
    batch: {
      type: Schema.Types.ObjectId,
      ref: "Batch",
      required: true,
    },
    referrer: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    collectedAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    commissionRate: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    commissionEarned: {
      type: Number,
      required: true,
      min: 0,
    },
    settlementId: {
      type: Schema.Types.ObjectId,
      ref: "Settlement",
      default: null,
    },
    status: {
      type: String,
      enum: [
        "earned",
        "awaiting_settlement",
        "approved_payable",
        "partially_paid",
        "fully_paid",
        "adjusted",
        "disputed",
      ],
      default: "earned",
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    remainingCommission: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

CommissionEntrySchema.index({ referrer: 1, createdAt: -1 });
CommissionEntrySchema.index({ batch: 1, createdAt: -1 });
CommissionEntrySchema.index({ createdAt: -1 });
CommissionEntrySchema.index({ settlementId: 1 });
CommissionEntrySchema.index({ status: 1 });

const CommissionEntry: Model<ICommissionEntryDocument> =
  mongoose.models.CommissionEntry ||
  mongoose.model<ICommissionEntryDocument>("CommissionEntry", CommissionEntrySchema);

export default CommissionEntry;

