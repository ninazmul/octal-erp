import mongoose, { Schema, Document, Model } from "mongoose";

export interface IEnrollmentDocument extends Document {
  enrollmentId: string;
  student: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  batch: mongoose.Types.ObjectId;
  agreedFee: number;
  discount: number;
  finalPayableAmount: number;
  totalCollectedAmount: number;
  remainingDue: number;
  referrerType: "Instructor" | "Staff" | "External" | "None";
  referrer?: mongoose.Types.ObjectId;
  commissionRate: number;
  status: "Active" | "Completed" | "Dropped" | "Suspended";
  admittedBy: {
    email: string;
    name?: string;
    userId?: string;
  };
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EnrollmentSchema: Schema = new Schema(
  {
    enrollmentId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    student: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    batch: {
      type: Schema.Types.ObjectId,
      ref: "Batch",
      required: true,
    },
    agreedFee: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    finalPayableAmount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    totalCollectedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    remainingDue: {
      type: Number,
      default: 0,
      min: 0,
    },
    referrerType: {
      type: String,
      enum: ["Instructor", "Staff", "External", "None"],
      default: "None",
    },
    referrer: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
    commissionRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: ["Active", "Completed", "Dropped", "Suspended"],
      default: "Active",
    },
    admittedBy: {
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

EnrollmentSchema.index({ student: 1, batch: 1 }, { unique: true }); // Prevent duplicate enrollment in same batch
EnrollmentSchema.index({ batch: 1 });
EnrollmentSchema.index({ course: 1 });
EnrollmentSchema.index({ referrer: 1 });
EnrollmentSchema.index({ status: 1 });

const Enrollment: Model<IEnrollmentDocument> =
  mongoose.models.Enrollment || mongoose.model<IEnrollmentDocument>("Enrollment", EnrollmentSchema);

export default Enrollment;

