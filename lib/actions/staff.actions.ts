"use server";

import { connectToDatabase } from "@/lib/database";
import Employee from "@/lib/database/models/employee.model";
import Payroll from "@/lib/database/models/payroll.model";
import Counter from "@/lib/database/models/counter.model";
import { formatSL } from "@/lib/utils";
import {
  requirePermission,
  requireSuperAdmin,
  logActivityAndNotify,
} from "@/lib/auth-guard";
import { revalidatePath } from "next/cache";

async function getNextEmployeeId(): Promise<string> {
  const counter = await Counter.findByIdAndUpdate(
    "octal_employee_id",
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `OCT-EMP-${formatSL(counter.seq, 4)}`;
}

// ==========================================
// GET EMPLOYEES (WITH CONFIDENTIALITY GUARD)
// ==========================================

export async function getEmployees(params?: {
  department?: string;
  status?: string;
  search?: string;
  isInstructor?: boolean;
}) {
  const profile = await requirePermission("staff", "read");
  await connectToDatabase();

  const query: Record<string, unknown> = {};

  if (params?.department) query.department = params.department;
  if (params?.status) query.status = params.status;
  if (params?.isInstructor !== undefined) query.isInstructor = params.isInstructor;

  if (params?.search) {
    query.$or = [
      { fullName: { $regex: params.search, $options: "i" } },
      { employeeId: { $regex: params.search, $options: "i" } },
      { email: { $regex: params.search, $options: "i" } },
      { phone: { $regex: params.search, $options: "i" } },
      { designation: { $regex: params.search, $options: "i" } },
    ];
  }

  const isAuthorizedForSalary =
    profile.role === "super_admin" ||
    profile.role === "accountant" ||
    Boolean(profile.granularPermissions?.payroll_view_confidential);

  const employees = await Employee.find(query)
    .sort({ department: 1, fullName: 1 })
    .lean();

  // If user is not authorized for confidential salary details, mask salary fields!
  const sanitized = employees.map((emp) => {
    if (!isAuthorizedForSalary) {
      return {
        ...emp,
        basicSalary: null,
        allowances: null,
        deductions: null,
        netSalary: null,
      };
    }
    return emp;
  });

  return JSON.parse(JSON.stringify(sanitized));
}

export async function getEmployeeById(id: string) {
  const profile = await requirePermission("staff", "read");
  await connectToDatabase();

  const employee = await Employee.findById(id).lean();
  if (!employee) throw new Error("Employee not found");

  const isAuthorizedForSalary =
    profile.role === "super_admin" ||
    profile.role === "accountant" ||
    Boolean(profile.granularPermissions?.payroll_view_confidential);

  let payrollHistory: unknown[] = [];
  if (isAuthorizedForSalary) {
    payrollHistory = await Payroll.find({ employee: id })
      .sort({ period: -1 })
      .lean();
  }

  const sanitized = {
    ...employee,
    basicSalary: isAuthorizedForSalary ? employee.basicSalary : null,
    allowances: isAuthorizedForSalary ? employee.allowances : null,
    deductions: isAuthorizedForSalary ? employee.deductions : null,
    netSalary: isAuthorizedForSalary ? employee.netSalary : null,
    payrollHistory,
  };

  return JSON.parse(JSON.stringify(sanitized));
}

// ==========================================
// CREATE EMPLOYEE
// ==========================================

export async function createEmployee(data: {
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
  joiningDate?: string | Date;
  employmentType?: "Full-time" | "Part-time" | "Contract" | "Intern";
  status?: "Active" | "Inactive" | "On-Leave" | "Terminated";
  basicSalary: number;
  allowances?: number;
  deductions?: number;
  linkedUserId?: string;
  isInstructor?: boolean;
  notes?: string;
}) {
  const actor = await requireSuperAdmin();
  await connectToDatabase();

  const existingEmail = await Employee.findOne({
    email: data.email.trim().toLowerCase(),
  });
  if (existingEmail) {
    throw new Error(`Employee with email "${data.email}" already exists.`);
  }

  const employeeId = await getNextEmployeeId();
  const basicSalary = Math.max(0, Number(data.basicSalary || 0));
  const allowances = Math.max(0, Number(data.allowances || 0));
  const deductions = Math.max(0, Number(data.deductions || 0));
  const netSalary = Math.max(0, basicSalary + allowances - deductions);

  const employee = await Employee.create({
    employeeId,
    fullName: data.fullName.trim(),
    email: data.email.trim().toLowerCase(),
    phone: data.phone.trim(),
    department: data.department,
    designation: data.designation.trim(),
    joiningDate: data.joiningDate ? new Date(data.joiningDate) : new Date(),
    employmentType: data.employmentType || "Full-time",
    status: data.status || "Active",
    basicSalary,
    allowances,
    deductions,
    netSalary,
    linkedUserId: data.linkedUserId?.trim() || "",
    isInstructor:
      data.isInstructor !== undefined
        ? data.isInstructor
        : data.department === "Academic",
    notes: data.notes?.trim() || "",
  });

  await logActivityAndNotify({
    actor,
    action: "CREATE_EMPLOYEE",
    module: "staff",
    resourceId: String(employee._id),
    resourceName: employee.fullName,
    details: `Added new employee ${employee.fullName} (${employeeId}) - ${employee.designation} in ${employee.department}. Basic: ৳${basicSalary.toLocaleString()}`,
  });

  revalidatePath("/staff");
  return JSON.parse(JSON.stringify(employee));
}

// ==========================================
// UPDATE EMPLOYEE & SALARY STRUCTURE
// ==========================================

export async function updateEmployee(
  id: string,
  data: {
    fullName?: string;
    phone?: string;
    department?:
      | "Academic"
      | "Administration"
      | "Finance"
      | "Front Desk"
      | "Marketing"
      | "IT"
      | "Support"
      | "Management";
    designation?: string;
    joiningDate?: string | Date;
    employmentType?: "Full-time" | "Part-time" | "Contract" | "Intern";
    status?: "Active" | "Inactive" | "On-Leave" | "Terminated";
    basicSalary?: number;
    allowances?: number;
    deductions?: number;
    linkedUserId?: string;
    isInstructor?: boolean;
    notes?: string;
  }
) {
  const actor = await requireSuperAdmin();
  await connectToDatabase();

  const employee = await Employee.findById(id);
  if (!employee) throw new Error("Employee not found");

  if (data.fullName !== undefined) employee.fullName = data.fullName.trim();
  if (data.phone !== undefined) employee.phone = data.phone.trim();
  if (data.department !== undefined) employee.department = data.department;
  if (data.designation !== undefined) employee.designation = data.designation.trim();
  if (data.joiningDate !== undefined)
    employee.joiningDate = new Date(data.joiningDate);
  if (data.employmentType !== undefined)
    employee.employmentType = data.employmentType;
  if (data.status !== undefined) employee.status = data.status;
  if (data.linkedUserId !== undefined)
    employee.linkedUserId = data.linkedUserId.trim();
  if (data.isInstructor !== undefined)
    employee.isInstructor = data.isInstructor;
  if (data.notes !== undefined) employee.notes = data.notes.trim();

  // Salary adjustments
  if (data.basicSalary !== undefined) {
    employee.basicSalary = Math.max(0, Number(data.basicSalary));
  }
  if (data.allowances !== undefined) {
    employee.allowances = Math.max(0, Number(data.allowances));
  }
  if (data.deductions !== undefined) {
    employee.deductions = Math.max(0, Number(data.deductions));
  }

  employee.netSalary = Math.max(
    0,
    employee.basicSalary + employee.allowances - employee.deductions
  );

  await employee.save();

  await logActivityAndNotify({
    actor,
    action: "UPDATE_EMPLOYEE",
    module: "staff",
    resourceId: String(employee._id),
    resourceName: employee.fullName,
    details: `Updated employee ${employee.fullName} (${employee.employeeId}). New Net Salary: ৳${employee.netSalary.toLocaleString()}`,
  });

  revalidatePath("/staff");
  return JSON.parse(JSON.stringify(employee));
}
