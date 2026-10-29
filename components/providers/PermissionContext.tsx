"use client";

import React, { createContext, useContext, useMemo, useCallback } from "react";
import {
  AdminRole,
  AppModule,
  GranularPermissionKey,
  IAdminUser,
  ModulePermissions,
  PermissionLevel,
} from "@/types";
import { resolveEffectiveGranularPermissions } from "@/lib/rbac-utils";

interface PermissionContextValue {
  admin: IAdminUser | null;
  role: AdminRole;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isInstructor: boolean;
  isAccountant: boolean;
  isReceptionist: boolean;
  isEngineer: boolean;
  isStaff: boolean;
  permissions: ModulePermissions;
  granularPermissions: Record<GranularPermissionKey, boolean>;
  hasPermission: (module: AppModule, requiredLevel: PermissionLevel) => boolean;
  canRead: (module: AppModule) => boolean;
  canWrite: (module: AppModule) => boolean;
  can: (action: GranularPermissionKey) => boolean;
  canManageAcademic: boolean;
  canAdmitStudents: boolean;
  canRecordPayments: boolean;
  canVerifyPayments: boolean;
  canConfigureCommissions: boolean;
  canSettleCommissions: boolean;
  canManageStaff: boolean;
  canGeneratePayroll: boolean;
  canDisbursePayroll: boolean;
  canViewConfidentialSalaries: boolean;
  canRecordExpenses: boolean;
  canApproveExpenses: boolean;
  canManageAccounts: boolean;
  canViewReports: boolean;
}

const PermissionContext = createContext<PermissionContextValue | undefined>(
  undefined
);

const defaultPermissions: ModulePermissions = {
  dashboard: "none",
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
};

export function PermissionProvider({
  admin,
  children,
}: {
  admin: IAdminUser | null;
  children: React.ReactNode;
}) {
  const role: AdminRole = admin?.role || "staff";
  const isSuperAdmin = role === "super_admin";
  const isAdmin = role === "admin" || role === "super_admin";
  const isInstructor = role === "instructor";
  const isAccountant = role === "accountant";
  const isReceptionist = role === "receptionist";
  const isEngineer = role === "engineer";
  const isStaff = role === "staff";

  const permissions: ModulePermissions = useMemo(() => {
    if (!admin) return defaultPermissions;
    if (isSuperAdmin) {
      return {
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
      };
    }
    const adminPerms = admin.permissions || {};
    return {
      dashboard: adminPerms.dashboard || "read",
      academic: adminPerms.academic || "none",
      students: adminPerms.students || "none",
      payments: adminPerms.payments || "none",
      commissions: adminPerms.commissions || "none",
      staff: adminPerms.staff || "none",
      payroll: adminPerms.payroll || "none",
      expenses: adminPerms.expenses || "none",
      finance: adminPerms.finance || "none",
      reports: adminPerms.reports || "none",
      admins: "none",
      activity_logs: adminPerms.activity_logs || "none",
      settings: "none",
    };
  }, [admin, isSuperAdmin]);

  const granularPermissions: Record<GranularPermissionKey, boolean> = useMemo(() => {
    if (!admin) {
      return resolveEffectiveGranularPermissions("custom");
    }
    return resolveEffectiveGranularPermissions(
      role,
      admin.granularPermissions
    );
  }, [admin, role]);

  const hasPermission = useCallback(
    (module: AppModule, requiredLevel: PermissionLevel): boolean => {
      if (isSuperAdmin) return true;
      const current = permissions[module] || "none";
      if (requiredLevel === "none") return true;
      if (requiredLevel === "read") {
        return current === "read" || current === "write";
      }
      if (requiredLevel === "write") {
        return current === "write";
      }
      return false;
    },
    [isSuperAdmin, permissions]
  );

  const canRead = useCallback(
    (module: AppModule) => hasPermission(module, "read"),
    [hasPermission]
  );

  const canWrite = useCallback(
    (module: AppModule) => hasPermission(module, "write"),
    [hasPermission]
  );

  const can = useCallback(
    (action: GranularPermissionKey): boolean => {
      if (isSuperAdmin) return true;
      return Boolean(granularPermissions[action]);
    },
    [isSuperAdmin, granularPermissions]
  );

  const canManageAcademic = isSuperAdmin || can("academic_manage");
  const canAdmitStudents = isSuperAdmin || can("student_admit");
  const canRecordPayments = isSuperAdmin || can("payment_record");
  const canVerifyPayments = isSuperAdmin || can("payment_verify");
  const canConfigureCommissions = isSuperAdmin || can("commission_configure");
  const canSettleCommissions = isSuperAdmin || can("commission_settle");
  const canManageStaff = isSuperAdmin || can("staff_manage");
  const canGeneratePayroll = isSuperAdmin || can("payroll_generate");
  const canDisbursePayroll = isSuperAdmin || can("payroll_disburse");
  const canViewConfidentialSalaries = isSuperAdmin || isAccountant || can("payroll_view_confidential");
  const canRecordExpenses = isSuperAdmin || can("expense_record");
  const canApproveExpenses = isSuperAdmin || can("expense_approve");
  const canManageAccounts = isSuperAdmin || can("account_manage");
  const canViewReports = isSuperAdmin || can("report_view");

  const value = useMemo(
    () => ({
      admin,
      role,
      isSuperAdmin,
      isAdmin,
      isInstructor,
      isAccountant,
      isReceptionist,
      isEngineer,
      isStaff,
      permissions,
      granularPermissions,
      hasPermission,
      canRead,
      canWrite,
      can,
      canManageAcademic,
      canAdmitStudents,
      canRecordPayments,
      canVerifyPayments,
      canConfigureCommissions,
      canSettleCommissions,
      canManageStaff,
      canGeneratePayroll,
      canDisbursePayroll,
      canViewConfidentialSalaries,
      canRecordExpenses,
      canApproveExpenses,
      canManageAccounts,
      canViewReports,
    }),
    [
      admin,
      role,
      isSuperAdmin,
      isAdmin,
      isInstructor,
      isAccountant,
      isReceptionist,
      isEngineer,
      isStaff,
      permissions,
      granularPermissions,
      hasPermission,
      canRead,
      canWrite,
      can,
      canManageAcademic,
      canAdmitStudents,
      canRecordPayments,
      canVerifyPayments,
      canConfigureCommissions,
      canSettleCommissions,
      canManageStaff,
      canGeneratePayroll,
      canDisbursePayroll,
      canViewConfidentialSalaries,
      canRecordExpenses,
      canApproveExpenses,
      canManageAccounts,
      canViewReports,
    ]
  );

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error("usePermissions must be used within a PermissionProvider");
  }
  return context;
}
