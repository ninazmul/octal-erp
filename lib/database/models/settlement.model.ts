import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISettlementDocument extends Document {
  settlementNo: string;
  batch: mongoose.Types.ObjectId;
  instructor: mongoose.Types.ObjectId;
  periodStart?: Date;
  periodEnd?: Date;
  eligibleCollectionsCount: number;
  totalEligibleCollections: number;
  grossCommission: number;
  deductions: number;
  netPayable: number;
  paidAmount: number;
  dueAmount: number;
  status: "Draft" | "Submitted" | "Approved" | "Disbursed";
  approvedBy?: {
    email: string;
    name?: string;
    userId?: string;
    date?: Date;
  };
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SettlementSchema: Schema = new Schema(
  {
    settlementNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    batch: {
      type: Schema.Types.ObjectId,
      ref: "Batch",
      required: true,
    },
    instructor: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    periodStart: { type: Date },
    periodEnd: { type: Date },
    eligibleCollectionsCount: {
      type: Number,
      default: 0,
    },
    totalEligibleCollections: {
      type: Number,
      default: 0,
    },
    grossCommission: {
      type: Number,
      default: 0,
    },
    deductions: {
      type: Number,
      default: 0,
    },
    netPayable: {
      type: Number,
      default: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
    },
    dueAmount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["Draft", "Submitted", "Approved", "Disbursed"],
      default: "Draft",
    },
    approvedBy: {
      email: { type: String },
      name: { type: String },
      userId: { type: String },
      date: { type: Date },
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

SettlementSchema.index({ settlementNo: 1 });
SettlementSchema.index({ batch: 1 });
SettlementSchema.index({ instructor: 1 });
SettlementSchema.index({ status: 1 });

const Settlement: Model<ISettlementDocument> =
  mongoose.models.Settlement || mongoose.model<ISettlementDocument>("Settlement", SettlementSchema);

export default Settlement;

