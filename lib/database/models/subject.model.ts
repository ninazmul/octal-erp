import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISubjectDocument extends Document {
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SubjectSchema: Schema = new Schema(
  {
    name: {
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
    description: {
      type: String,
      trim: true,
      default: "",
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

SubjectSchema.index({ code: 1 });
SubjectSchema.index({ name: 1 });

const Subject: Model<ISubjectDocument> =
  mongoose.models.Subject || mongoose.model<ISubjectDocument>("Subject", SubjectSchema);

export default Subject;

