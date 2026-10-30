import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICourseDocument extends Document {
  title: string;
  code: string;
  subject: mongoose.Types.ObjectId;
  description?: string;
  durationMonths: number;
  defaultFee: number;
  instructors: mongoose.Types.ObjectId[];
  defaultCommissionRate?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CourseSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    subject: {
      type: Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    durationMonths: {
      type: Number,
      required: true,
      default: 3,
      min: 1,
    },
    defaultFee: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    instructors: [
      {
        type: Schema.Types.ObjectId,
        ref: "Employee",
      },
    ],
    defaultCommissionRate: {
      type: Number,
      default: 20,
      min: 0,
      max: 100,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

CourseSchema.index({ subject: 1 });
CourseSchema.index({ instructors: 1 });
CourseSchema.index({ title: 1 });

const Course: Model<ICourseDocument> =
  mongoose.models.Course || mongoose.model<ICourseDocument>("Course", CourseSchema);

export default Course;

