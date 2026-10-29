// ==========================================
// OCTAL ERP - CORE TYPE DEFINITIONS
// ==========================================

export type AdminRole =
  | "super_admin"
  | "admin"
  | "instructor"
  | "receptionist"
  | "accountant"
  | "staff"
  | "engineer"
  | "editor"
  | "moderator"
  | "viewer"
  | "custom";

export type PermissionLevel = "none" | "read" | "write";

export type AppModule =
  | "dashboard"
  | "academic"
  | "students"
  | "payments"
  | "commissions"
  | "staff"
  | "payroll"
  | "expenses"
  | "finance"
  | "reports"
  | "admins"
  | "activity_logs"
  | "settings"
  // Legacy modules retained for backwards compatibility
  | "devices"
  | "customers"
  | "billing"
  | "catalog";

export type ModulePermissions = Record<AppModule, PermissionLevel>;

export type GranularPermissionKey =
  | "academic_manage"
  | "student_admit"
  | "student_view"
  | "payment_record"
  | "payment_verify"
  | "commission_configure"
  | "commission_settle"
  | "staff_manage"
  | "payroll_generate"
  | "payroll_disburse"
  | "payroll_view_confidential"
  | "expense_record"
  | "expense_approve"
  | "account_manage"
  | "report_view"
  | "user_manage"
  | "setting_manage"
  // Legacy keys
  | "device_add"
  | "device_view"
  | "device_edit"
  | "device_delete"
  | "device_approve"
  | "device_archive"
  | "server_view"
  | "server_manage"
  | "customer_view";

export type GranularPermissions = Partial<
  Record<GranularPermissionKey, boolean>
>;

export interface IAdminUser {
  _id: string;
  email: string;
  name?: string;
  role: AdminRole;
  employeeId?: string;
  permissions?: Partial<ModulePermissions>;
  granularPermissions?: GranularPermissions;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export type Admin = IAdminUser;

// ==========================================
// ACADEMIC MANAGEMENT TYPES
// ==========================================

export interface ISubject {
  _id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface ICourse {
  _id: string;
  title: string;
  code: string;
  subject: ISubject | string;
  description?: string;
  durationMonths: number;
  defaultFee: number;
  instructors: Array<IEmployee | string>;
  defaultCommissionRate?: number;
  isActive: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export type BatchStatus = "Upcoming" | "Ongoing" | "Completed" | "Cancelled";
export type BatchFinancialStatus = "Open" | "Settling" | "Settled";

export interface IBatch {
  _id: string;
  batchCode: string;
  batchName: string;
  course: ICourse | string;
  subject: ISubject | string;
  instructors: Array<IEmployee | string>;
  startDate: Date | string;
  endDate?: Date | string;
  scheduleDescription?: string;
  maxCapacity: number;
  status: BatchStatus;
  financialStatus: BatchFinancialStatus;
  notes?: string;
  // Computed / aggregated runtime fields
  totalEnrollments?: number;
  totalAgreedFees?: number;
  totalCollected?: number;
  totalDue?: number;
  totalCommissionEarned?: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

// ==========================================
// STUDENT & ENROLLMENT TYPES
// ==========================================

export type StudentStatus = "Active" | "Inactive" | "Archived";
export type EnrollmentStatus = "Active" | "Completed" | "Dropped" | "Suspended";
export type ReferrerType = "Instructor" | "Staff" | "External" | "None";

export interface IStudent {
  _id: string;
  studentId: string; // e.g. "OCT-STU-0001"
  fullName: string;
  phone: string;
  email?: string;
  guardianName?: string;
  guardianPhone?: string;
  address?: string;
  notes?: string;
  status: StudentStatus;
  admissionDate: Date | string;
  // Computed summaries
  totalEnrollmentsCount?: number;
  totalPayableSum?: number;
  totalPaidSum?: number;
  totalDueSum?: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface IEnrollment {
  _id: string;
  enrollmentId: string; // e.g. "OCT-ENR-0001"
  student: IStudent | string;
  course: ICourse | string;
  batch: IBatch | string;
  agreedFee: number;
  discount: number;
  finalPayableAmount: number; // agreedFee - discount
  totalCollectedAmount: number;
  remainingDue: number; // finalPayableAmount - totalCollectedAmount
  referrerType: ReferrerType;
  referrer?: IEmployee | string | null;
  referrerName?: string;
  commissionRate: number; // % applied to this enrollment collections
  status: EnrollmentStatus;
  admittedBy: {
    email: string;
    name?: string;
    userId?: string;
  };
  notes?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

// ==========================================
// PAYMENT & COLLECTION TYPES
// ==========================================

export type OctalPaymentMethod =
  | "Cash"
  | "Bank Transfer"
  | "bKash"
  | "Nagad"
  | "Rocket"
  | "Card"
  | "Other";

export type PaymentVerificationStatus =
  | "pending_verification"
  | "confirmed"
  | "rejected"
  | "reversed";

export interface IPayment {
  _id: string;
  receiptNo: string; // e.g. "REC-000001"
  enrollment: IEnrollment | string;
  student: IStudent | string;
  batch: IBatch | string;
  amount: number;
  paymentMethod: OctalPaymentMethod;
  transactionRef?: string;
  status: PaymentVerificationStatus;
  paymentDate: Date | string;
  collectedBy: {
    email: string;
    name?: string;
    userId?: string;
  };
  verifiedBy?: {
    email: string;
    name?: string;
    userId?: string;
    date?: Date | string;
  };
  notes?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

// ==========================================
// INSTRUCTOR COMMISSION & SETTLEMENT TYPES
// ==========================================

export interface ICommissionRule {
  _id: string;
  referrer: IEmployee | string;
  course?: ICourse | string; // If null, applies globally to referrer
  percentage: number; // e.g. 20 for 20%
  calculationBasis: "collections" | "enrollment_fee";
  effectiveFrom: Date | string;
  isActive: boolean;
  notes?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export type CommissionEntryStatus =
  | "earned"
  | "awaiting_settlement"
  | "approved_payable"
  | "partially_paid"
  | "fully_paid"
  | "adjusted"
  | "disputed";

export interface ICommissionEntry {
  _id: string;
  payment: IPayment | string;
  enrollment: IEnrollment | string;
  batch: IBatch | string;
  referrer: IEmployee | string;
  collectedAmount: number;
  commissionRate: number;
  commissionEarned: number; // (collectedAmount * commissionRate) / 100
  settlementId?: string | null;
  status: CommissionEntryStatus;
  paidAmount: number;
  remainingCommission: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export type SettlementStatus = "Draft" | "Submitted" | "Approved" | "Disbursed";

export interface ISettlement {
  _id: string;
  settlementNo: string; // e.g. "SET-000001"
  batch: IBatch | string;
  instructor: IEmployee | string;
  periodStart?: Date | string;
  periodEnd?: Date | string;
  eligibleCollectionsCount: number;
  totalEligibleCollections: number;
  grossCommission: number;
  deductions: number;
  netPayable: number;
  paidAmount: number;
  dueAmount: number;
  status: SettlementStatus;
  approvedBy?: {
    email: string;
    name?: string;
    userId?: string;
    date?: Date | string;
  };
  notes?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface IPayout {
  _id: string;
  payoutNo: string; // e.g. "PO-000001"
  instructor: IEmployee | string;
  settlement?: ISettlement | string;
  batchBreakdown?: Array<{
    batchId: string;
    batchName: string;
    amount: number;
  }>;
  amount: number;
  paymentMethod: OctalPaymentMethod;
  transactionRef?: string;
  accountId?: string; // Reference to Account (Cash/Bank)
  payoutDate: Date | string;
  paidBy: {
    email: string;
    name?: string;
    userId?: string;
  };
  notes?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

// ==========================================
// STAFF & PAYROLL TYPES
// ==========================================

export type EmployeeDepartment =
  | "Academic"
  | "Administration"
  | "Finance"
  | "Front Desk"
  | "Marketing"
  | "IT"
  | "Support"
  | "Management";

export type EmploymentType = "Full-time" | "Part-time" | "Contract" | "Intern";
export type EmployeeStatus = "Active" | "Inactive" | "On-Leave" | "Terminated";

export interface IEmployee {
  _id: string;
  employeeId: string; // e.g. "OCT-EMP-0001"
  fullName: string;
  email: string;
  phone: string;
  department: EmployeeDepartment;
  designation: string;
  joiningDate: Date | string;
  employmentType: EmploymentType;
  status: EmployeeStatus;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number; // basicSalary + allowances - deductions
  linkedUserId?: string; // Linked Admin / Clerk user ID or email
  isInstructor: boolean;
  notes?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export type PayrollObligationStatus =
  | "Pending"
  | "Approved"
  | "Partial"
  | "Settled"
  | "Cancelled";

export interface IPayrollPaymentRecord {
  amount: number;
  paymentDate: Date | string;
  paymentMethod: OctalPaymentMethod;
  transactionRef?: string;
  accountId?: string;
  paidBy: {
    email: string;
    name?: string;
    userId?: string;
  };
  notes?: string;
}

export interface IPayrollObligation {
  _id: string;
  payrollId: string; // e.g. "PAY-2026-10-0001"
  period: string; // e.g. "2026-10"
  employee: IEmployee | string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  bonuses: number;
  grossPayable: number;
  paidAmount: number;
  dueAmount: number;
  status: PayrollObligationStatus;
  paymentHistory: IPayrollPaymentRecord[];
  approvedBy?: {
    email: string;
    name?: string;
    userId?: string;
    date?: Date | string;
  };
  generatedAt: Date | string;
  notes?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

// ==========================================
// EXPENSE & FINANCIAL LEDGER TYPES
// ==========================================

export type ExpenseCategory =
  | "Salaries & Payroll"
  | "Rent"
  | "Electricity & Utilities"
  | "Internet & Communications"
  | "Marketing & Advertising"
  | "Equipment & Supplies"
  | "Academic & Training Materials"
  | "Software & Subscriptions"
  | "Transport"
  | "Maintenance"
  | "Other Operating Costs";

export type ExpenseStatus =
  | "Unpaid"
  | "Partial"
  | "Fully Paid"
  | "Overdue"
  | "Cancelled";

export interface IExpensePaymentRecord {
  amount: number;
  paymentDate: Date | string;
  paymentMethod: OctalPaymentMethod;
  transactionRef?: string;
  accountId?: string;
  paidBy: {
    email: string;
    name?: string;
    userId?: string;
  };
  notes?: string;
}

export interface IExpense {
  _id: string;
  expenseNo: string; // e.g. "EXP-000001"
  category: ExpenseCategory;
  title: string;
  description?: string;
  amount: number;
  paidAmount: number;
  dueAmount: number;
  expenseDate: Date | string;
  dueDate?: Date | string;
  recipientName?: string;
  paymentMethod?: OctalPaymentMethod;
  supportingDocUrl?: string;
  isRecurring: boolean;
  recurrenceFrequency?: "monthly" | "quarterly" | "yearly";
  status: ExpenseStatus;
  paymentHistory: IExpensePaymentRecord[];
  createdBy: {
    email: string;
    name?: string;
    userId?: string;
  };
  approvedBy?: {
    email: string;
    name?: string;
    userId?: string;
    date?: Date | string;
  };
  notes?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export type AccountType = "Cash" | "Bank" | "MFS";

export interface IAccount {
  _id: string;
  accountName: string;
  accountNumber?: string;
  type: AccountType;
  bankName?: string;
  openingBalance: number;
  currentBalance: number;
  isDefault: boolean;
  isActive: boolean;
  notes?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export type LedgerEntryType = "CREDIT" | "DEBIT";

export interface ILedgerEntry {
  _id: string;
  entryNo: string; // e.g. "LED-000001"
  account: IAccount | string;
  type: LedgerEntryType; // CREDIT: cash in, DEBIT: cash out
  amount: number;
  balanceAfter: number;
  sourceModule: "payments" | "commissions" | "payroll" | "expenses" | "adjustment";
  sourceReferenceId?: string;
  description: string;
  transactionDate: Date | string;
  recordedBy: {
    email: string;
    name?: string;
    userId?: string;
  };
  createdAt?: Date | string;
}

// ==========================================
// FINANCIAL DASHBOARD & STATS TYPES
// ==========================================

export interface OctalFinancialDashboardStats {
  openingBalance: number;
  closingCashBalance: number;
  totalStudentCollections: number;
  totalStudentDues: number;
  instructorCommissionsEarned: number;
  instructorCommissionsPaid: number;
  approvedUnpaidCommissions: number;
  totalSalaryObligations: number;
  salariesPaid: number;
  outstandingSalaryBalances: number;
  totalOtherExpenses: number;
  unpaidExpenseObligations: number;
  actualPayouts: number;
  // Indicative Reserve = Cash - (Unpaid Commissions + Outstanding Salaries + Unpaid Expenses)
  totalOutstandingLiabilities: number;
  estimatedReserveAfterCommitments: number;
  activeStudentsCount: number;
  activeBatchesCount: number;
  totalEmployeesCount: number;
}

export interface InstructorDashboardStats {
  instructorName: string;
  assignedBatchesCount: number;
  assignedStudentsCount: number;
  referredStudentsCount: number;
  totalReferralCollections: number;
  totalCommissionEarned: number;
  totalCommissionPaid: number;
  pendingSettlementAmount: number;
  recentCommissions: ICommissionEntry[];
  assignedBatches: IBatch[];
}

// ==========================================
// ACTIVITY LOG & NOTIFICATION (SHARED)
// ==========================================

export interface IActivityLog {
  _id: string;
  actorEmail: string;
  actorRole: AdminRole;
  action: string;
  module: AppModule | "system";
  resourceId?: string;
  resourceName?: string;
  details: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: Date | string;
}

export interface INotification {
  _id: string;
  actorEmail: string;
  actorRole: AdminRole;
  action: string;
  module: AppModule | "system";
  title: string;
  message: string;
  link?: string;
  recipientEmails?: string[];
  readBy: string[];
  createdAt: Date | string;
}

export interface GetActivityLogsParams {
  module?: string;
  action?: string;
  actorEmail?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

// Legacy aliases for existing modules
export type DeviceStatus = "Pending" | "Online" | "Storage" | "Frozen" | "Maintenance" | "Lost";
export type CustomerStatus = "Active" | "Inactive" | "Suspended";
export type BillingStatus = "Pending" | "Paid" | "Partial" | "Overdue" | "Cancelled";
export type PaymentMethod = OctalPaymentMethod;
