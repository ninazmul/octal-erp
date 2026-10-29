import mongoose, { Schema, Document, Model } from "mongoose";

export interface IExpenseDocument extends Document {
  expenseNo: string;
  category: string;
  title: string;
  description?: string;
  amount: number;
  paidAmount: number;
  dueAmount: number;
  expenseDate: Date;
  dueDate?: Date;
  recipientName?: string;
  paymentMethod?: string;
  supportingDocUrl?: string;
  isRecurring: boolean;
  recurrenceFrequency?: "monthly" | "quarterly" | "yearly";
  status: "Unpaid" | "Partial" | "Fully Paid" | "Overdue" | "Cancelled";
  paymentHistory: Array<{
    amount: number;
    paymentDate: Date;
    paymentMethod: string;
    transactionRef?: string;
    accountId?: mongoose.Types.ObjectId | null;
    paidBy: {
      email: string;
      name?: string;
      userId?: string;
    };
    notes?: string;
  }>;
  createdBy: {
    email: string;
    name?: string;
    userId?: string;
  };
  approvedBy?: {
    email: string;
    name?: string;
    userId?: string;
    date?: Date;
  };
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema: Schema = new Schema(
  {
    expenseNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "Salaries & Payroll",
        "Rent",
        "Electricity & Utilities",
        "Internet & Communications",
        "Marketing & Advertising",
        "Equipment & Supplies",
        "Academic & Training Materials",
        "Software & Subscriptions",
        "Transport",
        "Maintenance",
        "Other Operating Costs",
      ],
      default: "Other Operating Costs",
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    dueAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    expenseDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
    },
    recipientName: {
      type: String,
      trim: true,
      default: "",
    },
    paymentMethod: {
      type: String,
      default: "Cash",
    },
    supportingDocUrl: {
      type: String,
      trim: true,
      default: "",
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurrenceFrequency: {
      type: String,
      enum: ["monthly", "quarterly", "yearly"],
      default: "monthly",
    },
    status: {
      type: String,
      enum: ["Unpaid", "Partial", "Fully Paid", "Overdue", "Cancelled"],
      default: "Unpaid",
    },
    paymentHistory: [
      {
        amount: { type: Number, required: true },
        paymentDate: { type: Date, default: Date.now },
        paymentMethod: { type: String, default: "Cash" },
        transactionRef: { type: String, default: "" },
        accountId: { type: Schema.Types.ObjectId, ref: "Account", default: null },
        paidBy: {
          email: { type: String, required: true },
          name: { type: String, default: "" },
          userId: { type: String, default: "" },
        },
        notes: { type: String, default: "" },
      },
    ],
    createdBy: {
      email: { type: String, required: true },
      name: { type: String, default: "" },
      userId: { type: String, default: "" },
    },
    approvedBy: {
      email: { type: String },
      name: { type: String },
      userId: { type: String },
      date: { type: Date },
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

ExpenseSchema.index({ category: 1 });
ExpenseSchema.index({ status: 1 });
ExpenseSchema.index({ expenseDate: -1 });

const Expense: Model<IExpenseDocument> =
  mongoose.models.Expense || mongoose.model<IExpenseDocument>("Expense", ExpenseSchema);

export default Expense;

