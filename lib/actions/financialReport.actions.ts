"use server";

import { connectToDatabase } from "@/lib/database";
import Student from "@/lib/database/models/student.model";
import Enrollment from "@/lib/database/models/enrollment.model";
import Payment from "@/lib/database/models/payment.model";
import Batch from "@/lib/database/models/batch.model";
import Employee from "@/lib/database/models/employee.model";
import CommissionEntry from "@/lib/database/models/commissionEntry.model";
import Settlement from "@/lib/database/models/settlement.model";
import Payout from "@/lib/database/models/payout.model";
import Payroll from "@/lib/database/models/payroll.model";
import Expense from "@/lib/database/models/expense.model";
import Account from "@/lib/database/models/account.model";
import Ledger from "@/lib/database/models/ledger.model";
import {
  requirePermission,
} from "@/lib/auth-guard";
import {
  OctalFinancialDashboardStats,
  InstructorDashboardStats,
} from "@/types";

// ==========================================
// GLOBAL FINANCIAL DASHBOARD STATS
// ==========================================

export async function getFinancialDashboardStats(): Promise<OctalFinancialDashboardStats> {
  await requirePermission("dashboard", "read");
  await connectToDatabase();

  // 1. Accounts & Cash Balance
  const accounts = await Account.find({ isActive: true }).lean();
  const openingBalance = accounts.reduce(
    (sum, a) => sum + (a.openingBalance || 0),
    0
  );
  const closingCashBalance = accounts.reduce(
    (sum, a) => sum + (a.currentBalance || 0),
    0
  );

  // 2. Student Collections & Dues
  const confirmedPayments = await Payment.find({ status: "confirmed" }).lean();
  const totalStudentCollections = confirmedPayments.reduce(
    (sum, p) => sum + (p.amount || 0),
    0
  );

  const activeEnrollments = await Enrollment.find({
    status: { $ne: "Dropped" },
  }).lean();
  const totalStudentDues = activeEnrollments.reduce(
    (sum, e) => sum + (e.remainingDue || 0),
    0
  );

  // 3. Instructor Commissions & Payouts
  const commissionEntries = await CommissionEntry.find().lean();
  const instructorCommissionsEarned = commissionEntries.reduce(
    (sum, c) => sum + (c.commissionEarned || 0),
    0
  );
  const instructorCommissionsPaid = commissionEntries.reduce(
    (sum, c) => sum + (c.paidAmount || 0),
    0
  );
  const approvedUnpaidCommissions = commissionEntries
    .filter((c) => c.status !== "fully_paid")
    .reduce((sum, c) => sum + (c.remainingCommission || 0), 0);

  const payouts = await Payout.find().lean();
  const actualPayouts = payouts.reduce((sum, p) => sum + (p.amount || 0), 0);

  // 4. Payroll Obligations & Salaries
  const payrolls = await Payroll.find({ status: { $ne: "Cancelled" } }).lean();
  const totalSalaryObligations = payrolls.reduce(
    (sum, p) => sum + (p.grossPayable || 0),
    0
  );
  const salariesPaid = payrolls.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
  const outstandingSalaryBalances = payrolls.reduce(
    (sum, p) => sum + (p.dueAmount || 0),
    0
  );

  // 5. Operating Expenses
  const expenses = await Expense.find({ status: { $ne: "Cancelled" } }).lean();
  const totalOtherExpenses = expenses.reduce(
    (sum, e) => sum + (e.amount || 0),
    0
  );
  const unpaidExpenseObligations = expenses.reduce(
    (sum, e) => sum + (e.dueAmount || 0),
    0
  );

  // 6. Total Outstanding Liabilities & Indicative Reserves
  // Outstanding Liabilities = Unpaid Commissions + Outstanding Salaries + Unpaid Expenses
  const totalOutstandingLiabilities =
    approvedUnpaidCommissions +
    outstandingSalaryBalances +
    unpaidExpenseObligations;

  const estimatedReserveAfterCommitments =
    closingCashBalance - totalOutstandingLiabilities;

  // Counts
  const activeStudentsCount = await Student.countDocuments({ status: "Active" });
  const activeBatchesCount = await Batch.countDocuments({
    status: { $in: ["Ongoing", "Upcoming"] },
  });
  const totalEmployeesCount = await Employee.countDocuments({
    status: "Active",
  });

  return {
    openingBalance,
    closingCashBalance,
    totalStudentCollections,
    totalStudentDues,
    instructorCommissionsEarned,
    instructorCommissionsPaid,
    approvedUnpaidCommissions,
    totalSalaryObligations,
    salariesPaid,
    outstandingSalaryBalances,
    totalOtherExpenses,
    unpaidExpenseObligations,
    actualPayouts,
    totalOutstandingLiabilities,
    estimatedReserveAfterCommitments,
    activeStudentsCount,
    activeBatchesCount,
    totalEmployeesCount,
  };
}

// ==========================================
// INSTRUCTOR DASHBOARD STATS
// ==========================================

export async function getInstructorDashboardStats(
  instructorEmployeeId: string
): Promise<InstructorDashboardStats> {
  await connectToDatabase();

  const employee = await Employee.findById(instructorEmployeeId).lean();
  const instructorName = employee?.fullName || "Instructor";

  // Batches where this instructor is assigned
  const assignedBatches = await Batch.find({
    instructors: instructorEmployeeId,
  })
    .populate("course", "title code")
    .lean();

  const assignedBatchIds = assignedBatches.map((b) => b._id);

  const assignedEnrollments = await Enrollment.find({
    batch: { $in: assignedBatchIds },
  }).lean();
  const assignedStudentsCount = assignedEnrollments.length;

  // Referred students
  const referredEnrollments = await Enrollment.find({
    referrer: instructorEmployeeId,
  }).lean();
  const referredStudentsCount = referredEnrollments.length;

  const referredEnrollmentIds = referredEnrollments.map((e) => e._id);
  const referredPayments = await Payment.find({
    enrollment: { $in: referredEnrollmentIds },
    status: "confirmed",
  }).lean();

  const totalReferralCollections = referredPayments.reduce(
    (sum, p) => sum + (p.amount || 0),
    0
  );

  const commissions = await CommissionEntry.find({
    referrer: instructorEmployeeId,
  })
    .populate("batch", "batchCode batchName")
    .sort({ createdAt: -1 })
    .lean();

  const totalCommissionEarned = commissions.reduce(
    (sum, c) => sum + (c.commissionEarned || 0),
    0
  );
  const totalCommissionPaid = commissions.reduce(
    (sum, c) => sum + (c.paidAmount || 0),
    0
  );
  const pendingSettlementAmount = commissions.reduce(
    (sum, c) => sum + (c.remainingCommission || 0),
    0
  );

  return JSON.parse(
    JSON.stringify({
      instructorName,
      assignedBatchesCount: assignedBatches.length,
      assignedStudentsCount,
      referredStudentsCount,
      totalReferralCollections,
      totalCommissionEarned,
      totalCommissionPaid,
      pendingSettlementAmount,
      recentCommissions: commissions.slice(0, 10),
      assignedBatches,
    })
  );
}

// ==========================================
// 14 OPERATIONAL & FINANCIAL REPORTS
// ==========================================

export async function getReportData(reportKey: string, params?: {
  startDate?: string;
  endDate?: string;
  department?: string;
  batchId?: string;
}) {
  await requirePermission("reports", "read");
  await connectToDatabase();

  const dateFilter: Record<string, unknown> = {};
  if (params?.startDate) dateFilter.$gte = new Date(params.startDate);
  if (params?.endDate) {
    const end = new Date(params.endDate);
    end.setHours(23, 59, 59, 999);
    dateFilter.$lte = end;
  }

  switch (reportKey) {
    // Report 1: Student Admission Report
    case "student_admissions": {
      const q: Record<string, unknown> = {};
      if (params?.startDate || params?.endDate) q.admissionDate = dateFilter;
      const students = await Student.find(q).sort({ admissionDate: -1 }).lean();
      return JSON.parse(JSON.stringify(students));
    }

    // Report 2: Student Directory & Enrollment History
    case "student_directory": {
      const students = await Student.find().sort({ fullName: 1 }).lean();
      const detailed = await Promise.all(
        students.map(async (s) => {
          const enrollments = await Enrollment.find({ student: s._id })
            .populate("course", "title code")
            .populate("batch", "batchName")
            .lean();
          return { ...s, enrollments };
        })
      );
      return JSON.parse(JSON.stringify(detailed));
    }

    // Report 3: Course & Batch Wise Enrollment
    case "batch_enrollments": {
      const batches = await Batch.find()
        .populate("course", "title code defaultFee")
        .sort({ startDate: -1 })
        .lean();
      const batchReports = await Promise.all(
        batches.map(async (b) => {
          const count = await Enrollment.countDocuments({ batch: b._id });
          const enrollments = await Enrollment.find({ batch: b._id }).lean();
          const agreed = enrollments.reduce((sum, e) => sum + (e.finalPayableAmount || 0), 0);
          const collected = enrollments.reduce((sum, e) => sum + (e.totalCollectedAmount || 0), 0);
          const due = enrollments.reduce((sum, e) => sum + (e.remainingDue || 0), 0);
          return { ...b, enrolledCount: count, agreed, collected, due };
        })
      );
      return JSON.parse(JSON.stringify(batchReports));
    }

    // Report 4: Student Collection and Due Reports
    case "collections_dues": {
      const enrollments = await Enrollment.find({ remainingDue: { $gt: 0 } })
        .populate("student", "fullName studentId phone")
        .populate("course", "title code")
        .populate("batch", "batchName batchCode")
        .sort({ remainingDue: -1 })
        .lean();
      return JSON.parse(JSON.stringify(enrollments));
    }

    // Report 5: Referral Performance Report
    case "referral_performance": {
      const instructors = await Employee.find({
        $or: [{ isInstructor: true }, { department: "Academic" }],
      }).lean();

      const performance = await Promise.all(
        instructors.map(async (inst) => {
          const referrals = await Enrollment.find({ referrer: inst._id }).lean();
          const commissions = await CommissionEntry.find({ referrer: inst._id }).lean();
          const totalEarned = commissions.reduce((sum, c) => sum + (c.commissionEarned || 0), 0);
          const totalPaid = commissions.reduce((sum, c) => sum + (c.paidAmount || 0), 0);
          const totalCollections = commissions.reduce((sum, c) => sum + (c.collectedAmount || 0), 0);
          return {
            instructor: inst,
            referralsCount: referrals.length,
            totalCollections,
            totalEarned,
            totalPaid,
            remainingDue: Math.max(0, totalEarned - totalPaid),
          };
        })
      );
      return JSON.parse(JSON.stringify(performance));
    }

    // Report 6: Instructor Commission and Earnings Report
    case "instructor_commissions": {
      const commissions = await CommissionEntry.find()
        .populate("referrer", "fullName employeeId email")
        .populate("batch", "batchName batchCode")
        .sort({ createdAt: -1 })
        .lean();
      return JSON.parse(JSON.stringify(commissions));
    }

    // Report 7: Batch Settlement Statements
    case "batch_settlements": {
      const settlements = await Settlement.find()
        .populate("batch", "batchName batchCode")
        .populate("instructor", "fullName employeeId")
        .sort({ createdAt: -1 })
        .lean();
      return JSON.parse(JSON.stringify(settlements));
    }

    // Report 8: Staff Directory & Payroll Summary
    case "staff_payroll_summary": {
      const employees = await Employee.find().sort({ department: 1 }).lean();
      return JSON.parse(JSON.stringify(employees));
    }

    // Report 9: Employee-Wise Salary History
    case "employee_salary_history": {
      const payrolls = await Payroll.find()
        .populate("employee", "fullName employeeId department designation")
        .sort({ period: -1 })
        .lean();
      return JSON.parse(JSON.stringify(payrolls));
    }

    // Report 10: Department-Wise Payroll Report
    case "department_payroll": {
      const employees = await Employee.find({ status: "Active" }).lean();
      const deptMap: Record<string, { count: number; totalBasic: number; totalNet: number }> = {};
      employees.forEach((emp) => {
        if (!deptMap[emp.department]) {
          deptMap[emp.department] = { count: 0, totalBasic: 0, totalNet: 0 };
        }
        deptMap[emp.department].count++;
        deptMap[emp.department].totalBasic += emp.basicSalary || 0;
        deptMap[emp.department].totalNet += emp.netSalary || 0;
      });
      return JSON.parse(JSON.stringify(deptMap));
    }

    // Report 11: Expense Category Report
    case "expense_categories": {
      const expenses = await Expense.find().lean();
      const catMap: Record<string, { count: number; totalAmount: number; paidAmount: number; dueAmount: number }> = {};
      expenses.forEach((exp) => {
        if (!catMap[exp.category]) {
          catMap[exp.category] = { count: 0, totalAmount: 0, paidAmount: 0, dueAmount: 0 };
        }
        catMap[exp.category].count++;
        catMap[exp.category].totalAmount += exp.amount || 0;
        catMap[exp.category].paidAmount += exp.paidAmount || 0;
        catMap[exp.category].dueAmount += exp.dueAmount || 0;
      });
      return JSON.parse(JSON.stringify(catMap));
    }

    // Report 12: Monthly Expense Report
    case "monthly_expenses": {
      const expenses = await Expense.find().sort({ expenseDate: -1 }).lean();
      return JSON.parse(JSON.stringify(expenses));
    }

    // Report 13: Outstanding Liabilities Report
    case "outstanding_liabilities": {
      const unpaidCommissions = await CommissionEntry.find({ remainingCommission: { $gt: 0 } })
        .populate("referrer", "fullName employeeId")
        .lean();
      const unpaidSalaries = await Payroll.find({ dueAmount: { $gt: 0 } })
        .populate("employee", "fullName employeeId department")
        .lean();
      const unpaidExpenses = await Expense.find({ dueAmount: { $gt: 0 } }).lean();

      return JSON.parse(
        JSON.stringify({
          unpaidCommissions,
          unpaidSalaries,
          unpaidExpenses,
        })
      );
    }

    // Report 14: Cashflow & Account Balance Report + Monthly Financial Summary
    case "cashflow_summary": {
      const accounts = await Account.find().lean();
      const ledgers = await Ledger.find()
        .populate("account", "accountName type")
        .sort({ transactionDate: -1 })
        .limit(200)
        .lean();
      return JSON.parse(
        JSON.stringify({
          accounts,
          recentJournal: ledgers,
        })
      );
    }

    default:
      return [];
  }
}

