import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPayrollDocument extends Document {
  payrollId: string;
  period: string; // "YYYY-MM"
  employee: mongoose.Types.ObjectId;
  basicSalary: number;
  allowances: number;
  deductions: number;
  bonuses: number;
  grossPayable: number;
  paidAmount: number;
  dueAmount: number;
  status: "Pending" | "Approved" | "Partial" | "Settled" | "Cancelled";
  paymentHistory: Array<{
    amount: number;
    paymentDate: Date;
    paymentMethod: string;
    transactionRef?: string;
    accountId?: mongoose.Types.ObjectId | null;
    paidBy: {
      email: string;
      name?: string;
      userId?: string;
    };
    notes?: string;
  }>;
  approvedBy?: {
    email: string;
    name?: string;
    userId?: string;
    date?: Date;
  };
  generatedAt: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PayrollSchema: Schema = new Schema(
  {
    payrollId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    period: {
      type: String,
      required: true,
      trim: true,
      index: true, // e.g. "2026-10"
    },
    employee: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    basicSalary: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    allowances: {
      type: Number,
      default: 0,
      min: 0,
    },
    deductions: {
      type: Number,
      default: 0,
      min: 0,
    },
    bonuses: {
      type: Number,
      default: 0,
      min: 0,
    },
    grossPayable: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    dueAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Partial", "Settled", "Cancelled"],
      default: "Pending",
    },
    paymentHistory: [
      {
        amount: { type: Number, required: true },
        paymentDate: { type: Date, default: Date.now },
        paymentMethod: { type: String, default: "Cash" },
        transactionRef: { type: String, default: "" },
        accountId: { type: Schema.Types.ObjectId, ref: "Account", default: null },
        paidBy: {
          email: { type: String, required: true },
          name: { type: String, default: "" },
          userId: { type: String, default: "" },
        },
        notes: { type: String, default: "" },
      },
    ],
    approvedBy: {
      email: { type: String },
      name: { type: String },
      userId: { type: String },
      date: { type: Date },
    },
    generatedAt: {
      type: Date,
      default: Date.now,
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

// Idempotency: Exactly one payroll record per employee per period!
PayrollSchema.index({ employee: 1, period: 1 }, { unique: true });
PayrollSchema.index({ status: 1 });

const Payroll: Model<IPayrollDocument> =
  mongoose.models.Payroll || mongoose.model<IPayrollDocument>("Payroll", PayrollSchema);

export default Payroll;

