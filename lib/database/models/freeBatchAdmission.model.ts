import mongoose, { Document, Model, Schema } from "mongoose";

export interface IFreeBatchAdmissionDocument extends Document {
  student: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  batch: mongoose.Types.ObjectId;
  status: "Pending" | "Completed";
  admittedBy: { email: string; name?: string; userId?: string };
  completedBy?: { email: string; name?: string; userId?: string; date?: Date };
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FreeBatchAdmissionSchema = new Schema<IFreeBatchAdmissionDocument>(
  {
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    batch: { type: Schema.Types.ObjectId, ref: "Batch", required: true },
    status: { type: String, enum: ["Pending", "Completed"], default: "Pending", required: true },
    admittedBy: {
      email: { type: String, required: true },
      name: { type: String, default: "" },
      userId: { type: String, default: "" },
    },
    completedBy: {
      email: { type: String },
      name: { type: String },
      userId: { type: String },
      date: { type: Date },
    },
    notes: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

FreeBatchAdmissionSchema.index({ student: 1, batch: 1 }, { unique: true });
FreeBatchAdmissionSchema.index({ batch: 1, status: 1, createdAt: -1 });

const FreeBatchAdmission: Model<IFreeBatchAdmissionDocument> =
  mongoose.models.FreeBatchAdmission || mongoose.model<IFreeBatchAdmissionDocument>("FreeBatchAdmission", FreeBatchAdmissionSchema);

export default FreeBatchAdmission;
