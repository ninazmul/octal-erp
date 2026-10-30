import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPaymentDocument extends Document {
  receiptNo: string;
  enrollment: mongoose.Types.ObjectId;
  student: mongoose.Types.ObjectId;
  batch: mongoose.Types.ObjectId;
  amount: number;
  paymentMethod: string;
  transactionRef?: string;
  status: "pending_verification" | "confirmed" | "rejected" | "reversed";
  paymentDate: Date;
  collectedBy: {
    email: string;
    name?: string;
    userId?: string;
  };
  verifiedBy?: {
    email: string;
    name?: string;
    userId?: string;
    date?: Date;
  };
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema: Schema = new Schema(
  {
    receiptNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    enrollment: {
      type: Schema.Types.ObjectId,
      ref: "Enrollment",
      required: true,
    },
    student: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    batch: {
      type: Schema.Types.ObjectId,
      ref: "Batch",
      required: true,
    },
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
    status: {
      type: String,
      enum: ["pending_verification", "confirmed", "rejected", "reversed"],
      default: "confirmed",
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    collectedBy: {
      email: { type: String, required: true },
      name: { type: String, default: "" },
      userId: { type: String, default: "" },
    },
    verifiedBy: {
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

PaymentSchema.index({ enrollment: 1 });
PaymentSchema.index({ student: 1, paymentDate: -1 });
PaymentSchema.index({ batch: 1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ paymentDate: -1, createdAt: -1 });
PaymentSchema.index({ status: 1, paymentDate: -1, createdAt: -1 });

const Payment: Model<IPaymentDocument> =
  mongoose.models.Payment || mongoose.model<IPaymentDocument>("Payment", PaymentSchema);

export default Payment;

