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
  const profile = await requirePermission("dashboard", "read");
  if (profile.role === "instructor") {
    throw new Error("Forbidden: Instructor accounts cannot access organization-wide financial totals.");
  }
  await connectToDatabase();

  // Keep dashboard reads in MongoDB and transfer only one summary document per collection.
  const [
    accounts,
    [paymentTotals],
    [enrollmentTotals],
    [commissionTotals],
    [payoutTotals],
    [payrollTotals],
    [expenseTotals],
    activeStudentsCount,
    activeBatchesCount,
    totalEmployeesCount,
  ] = await Promise.all([
    Account.find({ isActive: true }).select("openingBalance currentBalance").lean(),
    Payment.aggregate([
      { $match: { status: "confirmed" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Enrollment.aggregate([
      { $match: { status: { $ne: "Dropped" } } },
      { $group: { _id: null, total: { $sum: "$remainingDue" } } },
    ]),
    CommissionEntry.aggregate([
      {
        $group: {
          _id: null,
          earned: { $sum: "$commissionEarned" },
          paid: { $sum: "$paidAmount" },
          unpaid: {
            $sum: {
              $cond: [
                { $ne: ["$status", "fully_paid"] },
                { $ifNull: ["$remainingCommission", 0] },
                0,
              ],
            },
          },
        },
      },
    ]),
    Payout.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }]),
    Payroll.aggregate([
      { $match: { status: { $ne: "Cancelled" } } },
      {
        $group: {
          _id: null,
          gross: { $sum: "$grossPayable" },
          paid: { $sum: "$paidAmount" },
          due: { $sum: "$dueAmount" },
        },
      },
    ]),
    Expense.aggregate([
      { $match: { status: { $ne: "Cancelled" } } },
      {
        $group: {
          _id: null,
          amount: { $sum: "$amount" },
          due: { $sum: "$dueAmount" },
        },
      },
    ]),
    Student.countDocuments({ status: "Active" }),
    Batch.countDocuments({ status: { $in: ["Ongoing", "Upcoming"] } }),
    Employee.countDocuments({ status: "Active" }),
  ]);

  const openingBalance = accounts.reduce((sum, account) => sum + (account.openingBalance || 0), 0);
  const closingCashBalance = accounts.reduce((sum, account) => sum + (account.currentBalance || 0), 0);
  const totalStudentCollections = paymentTotals?.total || 0;
  const totalStudentDues = enrollmentTotals?.total || 0;
  const instructorCommissionsEarned = commissionTotals?.earned || 0;
  const instructorCommissionsPaid = commissionTotals?.paid || 0;
  const approvedUnpaidCommissions = commissionTotals?.unpaid || 0;
  const actualPayouts = payoutTotals?.total || 0;
  const totalSalaryObligations = payrollTotals?.gross || 0;
  const salariesPaid = payrollTotals?.paid || 0;
  const outstandingSalaryBalances = payrollTotals?.due || 0;
  const totalOtherExpenses = expenseTotals?.amount || 0;
  const unpaidExpenseObligations = expenseTotals?.due || 0;

  // 6. Total Outstanding Liabilities & Indicative Reserves
  // Outstanding Liabilities = Unpaid Commissions + Outstanding Salaries + Unpaid Expenses
  const totalOutstandingLiabilities =
    approvedUnpaidCommissions +
    outstandingSalaryBalances +
    unpaidExpenseObligations;

  const estimatedReserveAfterCommitments =
    closingCashBalance - totalOutstandingLiabilities;

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
  const profile = await requirePermission("dashboard", "read");
  if (profile.role !== "instructor" || profile.employeeId !== instructorEmployeeId) {
    throw new Error("Forbidden: You can only view your own instructor dashboard.");
  }
  await connectToDatabase();

  const employee = await Employee.findById(instructorEmployeeId).lean();
  if (!employee) throw new Error("Instructor not found");
  const instructorName = employee?.fullName || "Instructor";

  // Batches where this instructor is assigned
  const assignedBatches = await Batch.find({
    instructors: instructorEmployeeId,
  })
    .populate("course", "title code")
    .lean();

  const assignedBatchIds = assignedBatches.map((b) => b._id);

  const [assignedStudentsCount, referredStudentsCount, [referralCollections], [commissionTotals], commissions] =
    await Promise.all([
      Enrollment.countDocuments({ batch: { $in: assignedBatchIds } }),
      Enrollment.countDocuments({ referrer: instructorEmployeeId }),
      Payment.aggregate([
        { $match: { status: "confirmed" } },
        {
          $lookup: {
            from: Enrollment.collection.name,
            localField: "enrollment",
            foreignField: "_id",
            as: "enrollmentDoc",
          },
        },
        { $unwind: "$enrollmentDoc" },
        { $match: { "enrollmentDoc.referrer": employee._id } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      CommissionEntry.aggregate([
        { $match: { referrer: employee._id } },
        {
          $group: {
            _id: null,
            earned: { $sum: "$commissionEarned" },
            paid: { $sum: "$paidAmount" },
            remaining: { $sum: "$remainingCommission" },
          },
        },
      ]),
      CommissionEntry.find({ referrer: employee._id })
        .populate("batch", "batchCode batchName")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

  const totalReferralCollections = referralCollections?.total || 0;
  const totalCommissionEarned = commissionTotals?.earned || 0;
  const totalCommissionPaid = commissionTotals?.paid || 0;
  const pendingSettlementAmount = commissionTotals?.remaining || 0;

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
      recentCommissions: commissions,
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
      const enrollments = students.length
        ? await Enrollment.find({ student: { $in: students.map((student) => student._id) } })
            .populate("course", "title code")
            .populate("batch", "batchName")
            .lean()
        : [];
      const enrollmentsByStudent = new Map<string, typeof enrollments>();
      for (const enrollment of enrollments) {
        const studentId = String(enrollment.student);
        const group = enrollmentsByStudent.get(studentId) || [];
        group.push(enrollment);
        enrollmentsByStudent.set(studentId, group);
      }
      const detailed = students.map((student) => ({
        ...student,
        enrollments: enrollmentsByStudent.get(String(student._id)) || [],
      }));
      return JSON.parse(JSON.stringify(detailed));
    }

    // Report 3: Course & Batch Wise Enrollment
    case "batch_enrollments": {
      const batches = await Batch.find()
        .populate("course", "title code defaultFee")
        .sort({ startDate: -1 })
        .lean();
      const batchSummaries = batches.length
        ? await Enrollment.aggregate([
            { $match: { batch: { $in: batches.map((batch) => batch._id) } } },
            {
              $group: {
                _id: "$batch",
                enrolledCount: { $sum: 1 },
                agreed: { $sum: { $ifNull: ["$finalPayableAmount", 0] } },
                collected: { $sum: { $ifNull: ["$totalCollectedAmount", 0] } },
                due: { $sum: { $ifNull: ["$remainingDue", 0] } },
              },
            },
          ])
        : [];
      const summaryByBatch = new Map(
        batchSummaries.map((summary) => [String(summary._id), summary])
      );
      const batchReports = batches.map((batch) => ({
        ...batch,
        enrolledCount: summaryByBatch.get(String(batch._id))?.enrolledCount || 0,
        agreed: summaryByBatch.get(String(batch._id))?.agreed || 0,
        collected: summaryByBatch.get(String(batch._id))?.collected || 0,
        due: summaryByBatch.get(String(batch._id))?.due || 0,
      }));
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

      const instructorIds = instructors.map((instructor) => instructor._id);
      const [referralSummaries, commissionSummaries] = instructorIds.length
        ? await Promise.all([
            Enrollment.aggregate([
              { $match: { referrer: { $in: instructorIds } } },
              { $group: { _id: "$referrer", referralsCount: { $sum: 1 } } },
            ]),
            CommissionEntry.aggregate([
              { $match: { referrer: { $in: instructorIds } } },
              {
                $group: {
                  _id: "$referrer",
                  totalCollections: { $sum: { $ifNull: ["$collectedAmount", 0] } },
                  totalEarned: { $sum: { $ifNull: ["$commissionEarned", 0] } },
                  totalPaid: { $sum: { $ifNull: ["$paidAmount", 0] } },
                },
              },
            ]),
          ])
        : [[], []];
      const referralsByInstructor = new Map(
        referralSummaries.map((summary) => [String(summary._id), summary])
      );
      const commissionsByInstructor = new Map(
        commissionSummaries.map((summary) => [String(summary._id), summary])
      );
      const performance = instructors.map((instructor) => {
        const commission = commissionsByInstructor.get(String(instructor._id));
        const totalEarned = commission?.totalEarned || 0;
        const totalPaid = commission?.totalPaid || 0;
        return {
          instructor,
          referralsCount: referralsByInstructor.get(String(instructor._id))?.referralsCount || 0,
          totalCollections: commission?.totalCollections || 0,
          totalEarned,
          totalPaid,
          remainingDue: Math.max(0, totalEarned - totalPaid),
        };
      });
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

