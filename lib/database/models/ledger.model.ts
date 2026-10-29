import mongoose, { Schema, Document, Model } from "mongoose";

export interface ILedgerDocument extends Document {
  entryNo: string;
  account: mongoose.Types.ObjectId;
  type: "CREDIT" | "DEBIT";
  amount: number;
  balanceAfter: number;
  sourceModule: "payments" | "commissions" | "payroll" | "expenses" | "adjustment";
  sourceReferenceId?: string;
  description: string;
  transactionDate: Date;
  recordedBy: {
    email: string;
    name?: string;
    userId?: string;
  };
  createdAt: Date;
}

const LedgerSchema: Schema = new Schema(
  {
    entryNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    account: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["CREDIT", "DEBIT"], // CREDIT = Cash in, DEBIT = Cash out
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    balanceAfter: {
      type: Number,
      required: true,
    },
    sourceModule: {
      type: String,
      required: true,
      enum: ["payments", "commissions", "payroll", "expenses", "adjustment"],
    },
    sourceReferenceId: {
      type: String,
      trim: true,
      default: "",
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    transactionDate: {
      type: Date,
      default: Date.now,
    },
    recordedBy: {
      email: { type: String, required: true },
      name: { type: String, default: "" },
      userId: { type: String, default: "" },
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

LedgerSchema.index({ account: 1 });
LedgerSchema.index({ transactionDate: -1 });
LedgerSchema.index({ sourceModule: 1 });

const Ledger: Model<ILedgerDocument> =
  mongoose.models.Ledger || mongoose.model<ILedgerDocument>("Ledger", LedgerSchema);

export default Ledger;

