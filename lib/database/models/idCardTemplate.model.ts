import mongoose, { Document, Model, Schema } from "mongoose";

export interface IIdCardTemplateDocument extends Document {
  role: "student" | "staff";
  institutionName: string;
  cardTitle: string;
  backMessage: string;
  contactLine: string;
  addressLine: string;
  backgroundImageUrl: string;
  signatureImageUrl: string;
  signatoryName: string;
  signatoryTitle: string;
  accentColor: string;
  updatedAt: Date;
}

const IdCardTemplateSchema = new Schema<IIdCardTemplateDocument>({
  role: { type: String, enum: ["student", "staff"], required: true, unique: true },
  institutionName: { type: String, trim: true, default: "Octal Technical Training Institute" },
  cardTitle: { type: String, trim: true, default: "IDENTITY CARD" },
  backMessage: { type: String, trim: true, default: "If found, please return this card to the institute at the contact details below." },
  contactLine: { type: String, trim: true, default: "" },
  addressLine: { type: String, trim: true, default: "" },
  backgroundImageUrl: { type: String, trim: true, default: "" },
  signatureImageUrl: { type: String, trim: true, default: "" },
  signatoryName: { type: String, trim: true, default: "" },
  signatoryTitle: { type: String, trim: true, default: "Authorized by" },
  accentColor: { type: String, trim: true, default: "#173b72" },
}, { timestamps: true });

const IdCardTemplate: Model<IIdCardTemplateDocument> = mongoose.models.IdCardTemplate || mongoose.model<IIdCardTemplateDocument>("IdCardTemplate", IdCardTemplateSchema);
export default IdCardTemplate;
