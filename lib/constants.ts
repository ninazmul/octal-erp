export const ACADEMIC_BATCH_STATUSES = [
  "Upcoming",
  "Ongoing",
  "Completed",
  "Cancelled",
] as const;

export const ENROLLMENT_STATUSES = [
  "Enrolled",
  "Completed",
  "Dropped",
  "Refunded",
] as const;

export const PAYMENT_METHODS = [
  "Cash",
  "bKash",
  "Nagad",
  "Rocket",
  "Bank Transfer",
  "Card",
  "Cheque",
] as const;

export const PAYMENT_STATUSES = ["Completed", "Partial", "Refunded", "Failed"] as const;

export const COMMISSION_STATUSES = [
  "Pending",
  "Eligible",
  "Settled",
  "Paid",
  "Cancelled",
] as const;

export const PAYROLL_STATUSES = ["Pending", "Partial", "Paid", "Cancelled"] as const;

export const EXPENSE_STATUSES = ["Pending", "Approved", "Paid", "Rejected"] as const;

export const EXPENSE_CATEGORIES = [
  "Rent",
  "Utilities",
  "Salaries",
  "Commissions",
  "Marketing & Ads",
  "Office Supplies",
  "Software & Subscriptions",
  "Hardware & Maintenance",
  "Refreshments",
  "Miscellaneous",
] as const;

export const ACCOUNT_TYPES = [
  "Cash Drawer",
  "Bank Account",
  "Mobile Money (bKash/Nagad)",
  "Petty Cash",
  "Reserve Account",
] as const;

export const USER_ROLES = [
  { value: "super_admin", label: "Super Admin", description: "Unrestricted access across all ERP modules" },
  { value: "admin", label: "Admin", description: "Full operational access, academic & staff management" },
  { value: "instructor", label: "Instructor", description: "Assigned courses, batches, and own commission tracking" },
  { value: "receptionist", label: "Receptionist", description: "Front desk, student admission & payment collection" },
  { value: "accountant", label: "Accountant", description: "Payment records, expenses, ledger & financial statements" },
  { value: "staff", label: "General Staff", description: "Standard operational staff access" },
] as const;
