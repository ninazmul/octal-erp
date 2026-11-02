import mongoose, { Document, Model, Schema } from "mongoose";

export type AdmissionDiscountRequestStatus = "Pending" | "Approved" | "Rejected" | "Used";

export interface IAdmissionDiscountRequestDocument extends Document {
  studentName: string;
  studentPhone: string;
  studentEmail?: string;
  course: mongoose.Types.ObjectId;
  batch: mongoose.Types.ObjectId;
  requestedAmount: number;
  approvedAmount: number;
  reason: string;
  adminNotes?: string;
  status: AdmissionDiscountRequestStatus;
  requestedBy: { email: string; name?: string; role: string };
  reviewedBy?: { email: string; name?: string; date: Date };
  student?: mongoose.Types.ObjectId;
  enrollment?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AdmissionDiscountRequestSchema = new Schema<IAdmissionDiscountRequestDocument>(
  {
    studentName: { type: String, required: true, trim: true },
    studentPhone: { type: String, required: true, trim: true },
    studentEmail: { type: String, trim: true, lowercase: true, default: "" },
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    batch: { type: Schema.Types.ObjectId, ref: "Batch", required: true },
    requestedAmount: { type: Number, required: true, min: 1 },
    approvedAmount: { type: Number, default: 0, min: 0 },
    reason: { type: String, required: true, trim: true },
    adminNotes: { type: String, trim: true, default: "" },
    status: { type: String, enum: ["Pending", "Approved", "Rejected", "Used"], default: "Pending", index: true },
    requestedBy: {
      email: { type: String, required: true, lowercase: true, trim: true },
      name: { type: String, trim: true, default: "" },
      role: { type: String, required: true },
    },
    reviewedBy: {
      email: { type: String, lowercase: true, trim: true },
      name: { type: String, trim: true },
      date: { type: Date },
    },
    student: { type: Schema.Types.ObjectId, ref: "Student" },
    enrollment: { type: Schema.Types.ObjectId, ref: "Enrollment" },
  },
  { timestamps: true },
);

AdmissionDiscountRequestSchema.index({ status: 1, createdAt: -1 });
AdmissionDiscountRequestSchema.index({ requestedBy: 1, createdAt: -1 });

const AdmissionDiscountRequest: Model<IAdmissionDiscountRequestDocument> =
  mongoose.models.AdmissionDiscountRequest ||
  mongoose.model<IAdmissionDiscountRequestDocument>("AdmissionDiscountRequest", AdmissionDiscountRequestSchema);

export default AdmissionDiscountRequest;
