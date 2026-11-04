import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICommissionEntryDocument extends Document {
  payment?: mongoose.Types.ObjectId;
  enrollment: mongoose.Types.ObjectId;
  admissionKey?: mongoose.Types.ObjectId;
  batchPayoutKey?: mongoose.Types.ObjectId;
  batch: mongoose.Types.ObjectId;
  referrer: mongoose.Types.ObjectId;
  collectedAmount: number;
  commissionRate: number;
  payoutType?: "percentage" | "fixed";
  payoutValue?: number;
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
      required: false,
    },
    enrollment: {
      type: Schema.Types.ObjectId,
      ref: "Enrollment",
      required: false,
    },
    admissionKey: {
      type: Schema.Types.ObjectId,
      default: undefined,
    },
    batchPayoutKey: {
      type: Schema.Types.ObjectId,
      default: undefined,
    },
    batch: {
      type: Schema.Types.ObjectId,
      ref: "Batch",
      required: false,
    },
    referrer: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: false,
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
    payoutType: { type: String, enum: ["percentage", "fixed"] },
    payoutValue: { type: Number, min: 0 },
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
CommissionEntrySchema.index({ admissionKey: 1 }, { unique: true, sparse: true });
CommissionEntrySchema.index({ batchPayoutKey: 1 }, { unique: true, sparse: true });

const CommissionEntry: Model<ICommissionEntryDocument> =
  mongoose.models.CommissionEntry ||
  mongoose.model<ICommissionEntryDocument>("CommissionEntry", CommissionEntrySchema);

export default CommissionEntry;

