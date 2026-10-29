import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICommissionRuleDocument extends Document {
  referrer: mongoose.Types.ObjectId;
  course?: mongoose.Types.ObjectId | null;
  percentage: number;
  calculationBasis: "collections" | "enrollment_fee";
  effectiveFrom: Date;
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CommissionRuleSchema: Schema = new Schema(
  {
    referrer: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      default: null,
    },
    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    calculationBasis: {
      type: String,
      enum: ["collections", "enrollment_fee"],
      default: "collections",
    },
    effectiveFrom: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
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

CommissionRuleSchema.index({ referrer: 1, course: 1 });
CommissionRuleSchema.index({ isActive: 1 });

const CommissionRule: Model<ICommissionRuleDocument> =
  mongoose.models.CommissionRule ||
  mongoose.model<ICommissionRuleDocument>("CommissionRule", CommissionRuleSchema);

export default CommissionRule;

