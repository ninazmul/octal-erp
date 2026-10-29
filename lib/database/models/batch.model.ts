import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBatchDocument extends Document {
  batchCode: string;
  batchName: string;
  course: mongoose.Types.ObjectId;
  subject: mongoose.Types.ObjectId;
  instructors: mongoose.Types.ObjectId[];
  startDate: Date;
  endDate?: Date;
  scheduleDescription?: string;
  maxCapacity: number;
  status: "Upcoming" | "Ongoing" | "Completed" | "Cancelled";
  financialStatus: "Open" | "Settling" | "Settled";
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BatchSchema: Schema = new Schema(
  {
    batchCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    batchName: {
      type: String,
      required: true,
      trim: true,
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    subject: {
      type: Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    instructors: [
      {
        type: Schema.Types.ObjectId,
        ref: "Employee",
      },
    ],
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
    },
    scheduleDescription: {
      type: String,
      trim: true,
      default: "",
    },
    maxCapacity: {
      type: Number,
      default: 30,
      min: 1,
    },
    status: {
      type: String,
      enum: ["Upcoming", "Ongoing", "Completed", "Cancelled"],
      default: "Upcoming",
    },
    financialStatus: {
      type: String,
      enum: ["Open", "Settling", "Settled"],
      default: "Open",
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

BatchSchema.index({ batchCode: 1 });
BatchSchema.index({ course: 1 });
BatchSchema.index({ subject: 1 });
BatchSchema.index({ instructors: 1 });
BatchSchema.index({ status: 1 });

const Batch: Model<IBatchDocument> =
  mongoose.models.Batch || mongoose.model<IBatchDocument>("Batch", BatchSchema);

export default Batch;

