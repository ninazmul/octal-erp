import mongoose, { Schema, Document, Model } from "mongoose";

export interface IEmployeeDocument extends Document {
  employeeId: string;
  fullName: string;
  email: string;
  phone: string;
  department:
    | "Academic"
    | "Administration"
    | "Finance"
    | "Front Desk"
    | "Marketing"
    | "IT"
    | "Support"
    | "Management";
  designation: string;
  joiningDate: Date;
  employmentType: "Full-time" | "Part-time" | "Contract" | "Intern";
  status: "Active" | "Inactive" | "On-Leave" | "Terminated";
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  linkedUserId?: string;
  isInstructor: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EmployeeSchema: Schema = new Schema(
  {
    employeeId: {
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
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      required: true,
      enum: [
        "Academic",
        "Administration",
        "Finance",
        "Front Desk",
        "Marketing",
        "IT",
        "Support",
        "Management",
      ],
      default: "Academic",
    },
    designation: {
      type: String,
      required: true,
      trim: true,
    },
    joiningDate: {
      type: Date,
      default: Date.now,
    },
    employmentType: {
      type: String,
      enum: ["Full-time", "Part-time", "Contract", "Intern"],
      default: "Full-time",
    },
    status: {
      type: String,
      enum: ["Active", "Inactive", "On-Leave", "Terminated"],
      default: "Active",
    },
    basicSalary: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    allowances: {
      type: Number,
      default: 0,
      min: 0,
    },
    deductions: {
      type: Number,
      default: 0,
      min: 0,
    },
    netSalary: {
      type: Number,
      default: 0,
      min: 0,
    },
    linkedUserId: {
      type: String,
      trim: true,
      default: "",
    },
    isInstructor: {
      type: Boolean,
      default: false,
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

EmployeeSchema.index({ department: 1 });
EmployeeSchema.index({ isInstructor: 1 });
EmployeeSchema.index({ status: 1 });
EmployeeSchema.index({ department: 1, fullName: 1 });
EmployeeSchema.index({ status: 1, isInstructor: 1, fullName: 1 });

const Employee: Model<IEmployeeDocument> =
  mongoose.models.Employee || mongoose.model<IEmployeeDocument>("Employee", EmployeeSchema);

export default Employee;

