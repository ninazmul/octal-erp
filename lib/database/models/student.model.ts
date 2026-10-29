import mongoose, { Schema, Document, Model } from "mongoose";

export interface IStudentDocument extends Document {
  studentId: string;
  fullName: string;
  phone: string;
  email?: string;
  guardianName?: string;
  guardianPhone?: string;
  address?: string;
  notes?: string;
  status: "Active" | "Inactive" | "Archived";
  admissionDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema: Schema = new Schema(
  {
    studentId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    guardianName: {
      type: String,
      trim: true,
      default: "",
    },
    guardianPhone: {
      type: String,
      trim: true,
      default: "",
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Archived"],
      default: "Active",
    },
    admissionDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

StudentSchema.index({ fullName: "text", phone: "text", email: "text" });

const Student: Model<IStudentDocument> =
  mongoose.models.Student || mongoose.model<IStudentDocument>("Student", StudentSchema);

export default Student;

