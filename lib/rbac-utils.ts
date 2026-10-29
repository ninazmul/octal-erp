import {
  AdminRole,
  AppModule,
  GranularPermissionKey,
  GranularPermissions,
  ModulePermissions,
  PermissionLevel,
} from "@/types";

export const ALL_APP_MODULES: AppModule[] = [
  "dashboard",
  "academic",
  "students",
  "payments",
  "commissions",
  "staff",
  "payroll",
  "expenses",
  "finance",
  "reports",
  "admins",
  "activity_logs",
  "settings",
];

export const DEFAULT_ROLE_PERMISSIONS: Record<AdminRole, ModulePermissions> = {
  super_admin: {
    dashboard: "write",
    academic: "write",
    students: "write",
    payments: "write",
    commissions: "write",
    staff: "write",
    payroll: "write",
    expenses: "write",
    finance: "write",
    reports: "write",
    admins: "write",
    activity_logs: "write",
    settings: "write",
  },
  admin: {
    dashboard: "write",
    academic: "write",
    students: "write",
    payments: "write",
    commissions: "read",
    staff: "write",
    payroll: "read",
    expenses: "write",
    finance: "read",
    reports: "write",
    admins: "none",
    activity_logs: "read",
    settings: "read",
  },
  instructor: {
    dashboard: "read",
    academic: "read",
    students: "read",
    payments: "none",
    commissions: "read",
    staff: "none",
    payroll: "none",
    expenses: "none",
    finance: "none",
    reports: "none",
    admins: "none",
    activity_logs: "none",
    settings: "none",
  },
  receptionist: {
    dashboard: "read",
    academic: "read",
    students: "write",
    payments: "write",
    commissions: "none",
    staff: "read",
    payroll: "none",
    expenses: "none",
    finance: "none",
    reports: "none",
    admins: "none",
    activity_logs: "none",
    settings: "none",
  },
  accountant: {
    dashboard: "read",
    academic: "read",
    students: "read",
    payments: "write",
    commissions: "write",
    staff: "read",
    payroll: "write",
    expenses: "write",
    finance: "write",
    reports: "write",
    admins: "none",
    activity_logs: "read",
    settings: "read",
  },
  staff: {
    dashboard: "read",
    academic: "read",
    students: "read",
    payments: "none",
    commissions: "none",
    staff: "read",
    payroll: "none",
    expenses: "none",
    finance: "none",
    reports: "none",
    admins: "none",
    activity_logs: "none",
    settings: "none",
  },
  engineer: {
    dashboard: "write",
    academic: "read",
    students: "read",
    payments: "none",
    commissions: "none",
    staff: "read",
    payroll: "none",
    expenses: "read",
    finance: "none",
    reports: "read",
    admins: "none",
    activity_logs: "read",
    settings: "none",
  },
  editor: {
    dashboard: "none",
    academic: "write",
    students: "write",
    payments: "read",
    commissions: "none",
    staff: "none",
    payroll: "none",
    expenses: "none",
    finance: "none",
    reports: "none",
    admins: "none",
    activity_logs: "none",
    settings: "none",
  },
  moderator: {
    dashboard: "read",
    academic: "read",
    students: "write",
    payments: "read",
    commissions: "none",
    staff: "none",
    payroll: "none",
    expenses: "none",
    finance: "none",
    reports: "none",
    admins: "none",
    activity_logs: "none",
    settings: "none",
  },
  viewer: {
    dashboard: "read",
    academic: "read",
    students: "read",
    payments: "none",
    commissions: "none",
    staff: "none",
    payroll: "none",
    expenses: "none",
    finance: "none",
    reports: "none",
    admins: "none",
    activity_logs: "none",
    settings: "none",
  },
  custom: {
    dashboard: "read",
    academic: "none",
    students: "none",
    payments: "none",
    commissions: "none",
    staff: "none",
    payroll: "none",
    expenses: "none",
    finance: "none",
    reports: "none",
    admins: "none",
    activity_logs: "none",
    settings: "none",
  },
};

export const DEFAULT_GRANULAR_PERMISSIONS: Record<
  AdminRole,
  Record<GranularPermissionKey, boolean>
> = {
  super_admin: {
    academic_manage: true,
    student_admit: true,
    student_view: true,
    payment_record: true,
    payment_verify: true,
    commission_configure: true,
    commission_settle: true,
    staff_manage: true,
    payroll_generate: true,
    payroll_disburse: true,
    payroll_view_confidential: true,
    expense_record: true,
    expense_approve: true,
    account_manage: true,
    report_view: true,
    user_manage: true,
    setting_manage: true,
  },
  admin: {
    academic_manage: true,
    student_admit: true,
    student_view: true,
    payment_record: true,
    payment_verify: true,
    commission_configure: false,
    commission_settle: false,
    staff_manage: true,
    payroll_generate: false,
    payroll_disburse: false,
    payroll_view_confidential: false,
    expense_record: true,
    expense_approve: false,
    account_manage: false,
    report_view: true,
    user_manage: false,
    setting_manage: false,
  },
  instructor: {
    academic_manage: false,
    student_admit: false,
    student_view: true,
    payment_record: false,
    payment_verify: false,
    commission_configure: false,
    commission_settle: false,
    staff_manage: false,
    payroll_generate: false,
    payroll_disburse: false,
    payroll_view_confidential: false,
    expense_record: false,
    expense_approve: false,
    account_manage: false,
    report_view: false,
    user_manage: false,
    setting_manage: false,
  },
  receptionist: {
    academic_manage: false,
    student_admit: true,
    student_view: true,
    payment_record: true,
    payment_verify: false,
    commission_configure: false,
    commission_settle: false,
    staff_manage: false,
    payroll_generate: false,
    payroll_disburse: false,
    payroll_view_confidential: false,
    expense_record: false,
    expense_approve: false,
    account_manage: false,
    report_view: false,
    user_manage: false,
    setting_manage: false,
  },
  accountant: {
    academic_manage: false,
    student_admit: false,
    student_view: true,
    payment_record: true,
    payment_verify: true,
    commission_configure: true,
    commission_settle: true,
    staff_manage: true,
    payroll_generate: true,
    payroll_disburse: true,
    payroll_view_confidential: true,
    expense_record: true,
    expense_approve: true,
    account_manage: true,
    report_view: true,
    user_manage: false,
    setting_manage: false,
  },
  staff: {
    academic_manage: false,
    student_admit: false,
    student_view: false,
    payment_record: false,
    payment_verify: false,
    commission_configure: false,
    commission_settle: false,
    staff_manage: false,
    payroll_generate: false,
    payroll_disburse: false,
    payroll_view_confidential: false,
    expense_record: false,
    expense_approve: false,
    account_manage: false,
    report_view: false,
    user_manage: false,
    setting_manage: false,
  },
  engineer: {
    academic_manage: false,
    student_admit: false,
    student_view: false,
    payment_record: false,
    payment_verify: false,
    commission_configure: false,
    commission_settle: false,
    staff_manage: false,
    payroll_generate: false,
    payroll_disburse: false,
    payroll_view_confidential: false,
    expense_record: false,
    expense_approve: false,
    account_manage: false,
    report_view: true,
    user_manage: false,
    setting_manage: false,
  },
  editor: {
    academic_manage: true,
    student_admit: true,
    student_view: true,
    payment_record: false,
    payment_verify: false,
    commission_configure: false,
    commission_settle: false,
    staff_manage: false,
    payroll_generate: false,
    payroll_disburse: false,
    payroll_view_confidential: false,
    expense_record: false,
    expense_approve: false,
    account_manage: false,
    report_view: false,
    user_manage: false,
    setting_manage: false,
  },
  moderator: {
    academic_manage: false,
    student_admit: true,
    student_view: true,
    payment_record: false,
    payment_verify: false,
    commission_configure: false,
    commission_settle: false,
    staff_manage: false,
    payroll_generate: false,
    payroll_disburse: false,
    payroll_view_confidential: false,
    expense_record: false,
    expense_approve: false,
    account_manage: false,
    report_view: false,
    user_manage: false,
    setting_manage: false,
  },
  viewer: {
    academic_manage: false,
    student_admit: false,
    student_view: true,
    payment_record: false,
    payment_verify: false,
    commission_configure: false,
    commission_settle: false,
    staff_manage: false,
    payroll_generate: false,
    payroll_disburse: false,
    payroll_view_confidential: false,
    expense_record: false,
    expense_approve: false,
    account_manage: false,
    report_view: false,
    user_manage: false,
    setting_manage: false,
  },
  custom: {
    academic_manage: false,
    student_admit: false,
    student_view: false,
    payment_record: false,
    payment_verify: false,
    commission_configure: false,
    commission_settle: false,
    staff_manage: false,
    payroll_generate: false,
    payroll_disburse: false,
    payroll_view_confidential: false,
    expense_record: false,
    expense_approve: false,
    account_manage: false,
    report_view: false,
    user_manage: false,
    setting_manage: false,
  },
};

export interface GranularPermissionMeta {
  key: GranularPermissionKey;
  label: string;
  category: "Academic" | "Students & Payments" | "Finance & Payroll" | "Administration";
  description: string;
}

export const GRANULAR_PERMISSIONS_LIST: GranularPermissionMeta[] = [
  {
    key: "academic_manage",
    label: "Manage Academic",
    category: "Academic",
    description: "Create and update subjects, courses, and batches",
  },
  {
    key: "student_admit",
    label: "Admit Students",
    category: "Students & Payments",
    description: "Enroll students, register admissions, and assign batches",
  },
  {
    key: "student_view",
    label: "View Students",
    category: "Students & Payments",
    description: "View student directory and enrollment profiles",
  },
  {
    key: "payment_record",
    label: "Record Payments",
    category: "Students & Payments",
    description: "Collect and log student tuition installments",
  },
  {
    key: "payment_verify",
    label: "Verify Payments",
    category: "Students & Payments",
    description: "Confirm and approve student payment collections",
  },
  {
    key: "commission_configure",
    label: "Configure Commissions",
    category: "Finance & Payroll",
    description: "Set commission rates and rules for instructors",
  },
  {
    key: "commission_settle",
    label: "Settle Commissions",
    category: "Finance & Payroll",
    description: "Prepare and approve batch settlements and payouts",
  },
  {
    key: "staff_manage",
    label: "Manage Staff",
    category: "Administration",
    description: "Manage employee directory, profiles, and contracts",
  },
  {
    key: "payroll_generate",
    label: "Generate Payroll",
    category: "Finance & Payroll",
    description: "Generate monthly salary obligations for employees",
  },
  {
    key: "payroll_disburse",
    label: "Disburse Payroll",
    category: "Finance & Payroll",
    description: "Record salary payments and mark obligations settled",
  },
  {
    key: "payroll_view_confidential",
    label: "View Confidential Salaries",
    category: "Finance & Payroll",
    description: "Access executive salary figures and compensation data",
  },
  {
    key: "expense_record",
    label: "Record Expenses",
    category: "Finance & Payroll",
    description: "Log operational expenses and invoices",
  },
  {
    key: "expense_approve",
    label: "Approve Expenses",
    category: "Finance & Payroll",
    description: "Authorize and approve operational expense disbursements",
  },
  {
    key: "account_manage",
    label: "Manage Accounts & Ledgers",
    category: "Finance & Payroll",
    description: "Configure Cash, Bank, and MFS accounts and audit ledger entries",
  },
  {
    key: "report_view",
    label: "View Financial Reports",
    category: "Finance & Payroll",
    description: "Access collections, dues, commissions, and P&L financial reports",
  },
  {
    key: "user_manage",
    label: "Manage Admin Users",
    category: "Administration",
    description: "Invite administrators, assign roles, and configure permissions",
  },
  {
    key: "setting_manage",
    label: "Manage System Settings",
    category: "Administration",
    description: "Adjust system parameters and organizational defaults",
  },
];

/**
 * Resolves full effective permissions for a user given their role and custom overrides.
 */
export function resolveEffectivePermissions(
  role: AdminRole,
  customPerms?: Partial<ModulePermissions> | Map<string, string>,
): ModulePermissions {
  if (role === "super_admin") {
    return { ...DEFAULT_ROLE_PERMISSIONS.super_admin };
  }

  const base = {
    ...(DEFAULT_ROLE_PERMISSIONS[role] || DEFAULT_ROLE_PERMISSIONS.custom),
  };

  if (customPerms) {
    let customObj: Record<string, string> = {};
    if (customPerms instanceof Map) {
      customPerms.forEach((val, key) => {
        customObj[key] = val;
      });
    } else {
      customObj = customPerms as Record<string, string>;
    }

    for (const mod of ALL_APP_MODULES) {
      const val = customObj[mod] as PermissionLevel | undefined;
      if (val && ["none", "read", "write"].includes(val)) {
        base[mod] = val;
      }
    }
  }

  // Staff administration is reserved for Super Admins.
  base.admins = "none";

  return base;
}

/**
 * Resolves effective granular permissions for a user given their role and custom overrides.
 */
export function resolveEffectiveGranularPermissions(
  role: AdminRole,
  customGranular?: GranularPermissions | Map<string, boolean>,
): Record<GranularPermissionKey, boolean> {
  if (role === "super_admin") {
    return { ...DEFAULT_GRANULAR_PERMISSIONS.super_admin };
  }

  const base: Record<GranularPermissionKey, boolean> = {
    ...(DEFAULT_GRANULAR_PERMISSIONS[role] ||
      DEFAULT_GRANULAR_PERMISSIONS.custom),
  };

  if (customGranular) {
    let customObj: Record<string, boolean> = {};
    if (customGranular instanceof Map) {
      customGranular.forEach((val, key) => {
        customObj[key] = Boolean(val);
      });
    } else {
      customObj = customGranular as Record<string, boolean>;
    }

    for (const key of Object.keys(base) as GranularPermissionKey[]) {
      if (typeof customObj[key] === "boolean") {
        base[key] = customObj[key];
      }
    }
  }

  // Role and permission administration can never be delegated.
  base.user_manage = false;

  return base;
}

/**
 * Checks if a user has sufficient permission level for a module.
 * 'write' satisfies 'read' and 'write'.
 * 'read' satisfies 'read'.
 */
export function hasPermissionLevel(
  effectivePerms: ModulePermissions,
  module: AppModule,
  requiredLevel: PermissionLevel,
): boolean {
  const current = effectivePerms[module] || "none";
  if (requiredLevel === "none") return true;
  if (requiredLevel === "read")
    return current === "read" || current === "write";
  if (requiredLevel === "write") return current === "write";
  return false;
}
