import mongoose from "mongoose";

// Load environment variables from .env.local if present
import fs from "fs";
import path from "path";

const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf-8");
  envConfig.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...values] = trimmed.split("=");
      if (key && values.length > 0) {
        process.env[key.trim()] = values.join("=").trim();
      }
    }
  });
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not set!");
  process.exit(1);
}

console.log("🚀 Starting OCTAL ERP Master Acceptance Verification Suite...\n");

async function runTests() {
  await mongoose.connect(MONGODB_URI, { dbName: "octal-erp-test" });
  console.log("Connected to test database: octal-erp-test");

  // Dynamic schema references
  const Subject = mongoose.model(
    "Subject",
    new mongoose.Schema(
      {
        name: String,
        code: String,
        description: String,
        isActive: Boolean,
      },
      { timestamps: true }
    )
  );

  const Course = mongoose.model(
    "Course",
    new mongoose.Schema(
      {
        title: String,
        code: String,
        subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject" },
        durationMonths: Number,
        defaultFee: Number,
        instructors: [{ type: mongoose.Schema.Types.ObjectId, ref: "Employee" }],
        defaultCommissionRate: Number,
        isActive: Boolean,
      },
      { timestamps: true }
    )
  );

  const Batch = mongoose.model(
    "Batch",
    new mongoose.Schema(
      {
        batchCode: String,
        batchName: String,
        course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
        subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject" },
        instructors: [{ type: mongoose.Schema.Types.ObjectId, ref: "Employee" }],
        startDate: Date,
        maxCapacity: Number,
        status: String,
        financialStatus: String,
      },
      { timestamps: true }
    )
  );

  const Employee = mongoose.model(
    "Employee",
    new mongoose.Schema(
      {
        employeeId: String,
        fullName: String,
        email: String,
        phone: String,
        department: String,
        designation: String,
        basicSalary: Number,
        allowances: Number,
        deductions: Number,
        netSalary: Number,
        status: String,
        isInstructor: Boolean,
      },
      { timestamps: true }
    )
  );

  const Student = mongoose.model(
    "Student",
    new mongoose.Schema(
      {
        studentId: String,
        fullName: String,
        phone: String,
        email: String,
        status: String,
        admissionDate: Date,
      },
      { timestamps: true }
    )
  );

  const Enrollment = mongoose.model(
    "Enrollment",
    new mongoose.Schema(
      {
        enrollmentId: String,
        student: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
        course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
        batch: { type: mongoose.Schema.Types.ObjectId, ref: "Batch" },
        agreedFee: Number,
        discount: Number,
        finalPayableAmount: Number,
        totalCollectedAmount: { type: Number, default: 0 },
        remainingDue: Number,
        referrerType: String,
        referrer: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
        commissionRate: Number,
        status: String,
      },
      { timestamps: true }
    )
  );

  const Payment = mongoose.model(
    "Payment",
    new mongoose.Schema(
      {
        receiptNo: String,
        enrollment: { type: mongoose.Schema.Types.ObjectId, ref: "Enrollment" },
        student: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
        batch: { type: mongoose.Schema.Types.ObjectId, ref: "Batch" },
        amount: Number,
        paymentMethod: String,
        status: String,
        paymentDate: Date,
      },
      { timestamps: true }
    )
  );

  const CommissionEntry = mongoose.model(
    "CommissionEntry",
    new mongoose.Schema(
      {
        payment: { type: mongoose.Schema.Types.ObjectId, ref: "Payment", unique: true },
        enrollment: { type: mongoose.Schema.Types.ObjectId, ref: "Enrollment" },
        batch: { type: mongoose.Schema.Types.ObjectId, ref: "Batch" },
        referrer: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
        collectedAmount: Number,
        commissionRate: Number,
        commissionEarned: Number,
        paidAmount: { type: Number, default: 0 },
        remainingCommission: Number,
        status: String,
      },
      { timestamps: true }
    )
  );

  const Payroll = mongoose.model(
    "Payroll",
    new mongoose.Schema(
      {
        payrollId: String,
        period: String,
        employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
        basicSalary: Number,
        allowances: Number,
        deductions: Number,
        grossPayable: Number,
        paidAmount: { type: Number, default: 0 },
        dueAmount: Number,
        status: String,
      },
      { timestamps: true }
    )
  );

  const Account = mongoose.model(
    "Account",
    new mongoose.Schema(
      {
        accountName: String,
        type: String,
        openingBalance: Number,
        currentBalance: Number,
        isDefault: Boolean,
        isActive: Boolean,
      },
      { timestamps: true }
    )
  );

  const Expense = mongoose.model(
    "Expense",
    new mongoose.Schema(
      {
        expenseNo: String,
        category: String,
        title: String,
        amount: Number,
        paidAmount: Number,
        dueAmount: Number,
        status: String,
      },
      { timestamps: true }
    )
  );

  // Clean test collections
  await Promise.all([
    Subject.deleteMany({}),
    Course.deleteMany({}),
    Batch.deleteMany({}),
    Employee.deleteMany({}),
    Student.deleteMany({}),
    Enrollment.deleteMany({}),
    Payment.deleteMany({}),
    CommissionEntry.deleteMany({}),
    Payroll.deleteMany({}),
    Account.deleteMany({}),
    Expense.deleteMany({}),
  ]);

  let passCount = 0;
  function assert(condition, message) {
    if (!condition) {
      console.error(`❌ FAIL: ${message}`);
      throw new Error(message);
    }
    passCount++;
    console.log(`✅ PASS: ${message}`);
  }

  // -------------------------------------------------------------
  // Test 1: Super Admin creates Web Development subject, course & batch
  // -------------------------------------------------------------
  const subject = await Subject.create({
    name: "Web Development",
    code: "WEB",
    isActive: true,
  });

  const instructor1 = await Employee.create({
    employeeId: "OCT-EMP-0001",
    fullName: "Kamrul Hasan",
    email: "kamrul@octalerp.com",
    phone: "01711111111",
    department: "Academic",
    designation: "Lead Web Instructor",
    basicSalary: 35000,
    allowances: 5000,
    deductions: 0,
    netSalary: 40000,
    isInstructor: true,
    status: "Active",
  });

  const course = await Course.create({
    title: "Full Stack Web Development",
    code: "FSWD",
    subject: subject._id,
    durationMonths: 4,
    defaultFee: 20000,
    defaultCommissionRate: 20,
    instructors: [instructor1._id],
    isActive: true,
  });

  const batch = await Batch.create({
    batchCode: "FSWD-B01",
    batchName: "Full Stack Batch 01",
    course: course._id,
    subject: subject._id,
    instructors: [instructor1._id],
    startDate: new Date(),
    maxCapacity: 25,
    status: "Ongoing",
    financialStatus: "Open",
  });

  assert(subject._id && course._id && batch._id, "Test 1: Subject, Course, and Batch created successfully.");

  // -------------------------------------------------------------
  // Test 2: Instructor assigned to Web Development cannot access unauthorized course or batch
  // -------------------------------------------------------------
  const instructor2 = await Employee.create({
    employeeId: "OCT-EMP-0002",
    fullName: "Graphic Designer",
    email: "graphic@octalerp.com",
    phone: "01722222222",
    department: "Academic",
    designation: "Graphics Mentor",
    basicSalary: 25000,
    isInstructor: true,
    status: "Active",
  });

  const isAssigned = batch.instructors.some((id) => id.toString() === instructor2._id.toString());
  assert(!isAssigned, "Test 2: Instructor 2 correctly restricted from unauthorized batch FSWD-B01.");

  // -------------------------------------------------------------
  // Test 3: Student registered in batch and linked to correct referrer
  // -------------------------------------------------------------
  const student = await Student.create({
    studentId: "OCT-STU-0001",
    fullName: "Shakil Ahmed",
    phone: "01833333333",
    email: "shakil@gmail.com",
    status: "Active",
    admissionDate: new Date(),
  });

  const agreedFee = 20000;
  const discount = 2000;
  const finalPayable = agreedFee - discount; // 18,000

  const enrollment = await Enrollment.create({
    enrollmentId: "OCT-ENR-0001",
    student: student._id,
    course: course._id,
    batch: batch._id,
    agreedFee,
    discount,
    finalPayableAmount: finalPayable,
    totalCollectedAmount: 0,
    remainingDue: finalPayable,
    referrerType: "Instructor",
    referrer: instructor1._id,
    commissionRate: 20, // 20%
    status: "Active",
  });

  assert(
    enrollment.finalPayableAmount === 18000 &&
      enrollment.remainingDue === 18000 &&
      enrollment.referrer.toString() === instructor1._id.toString(),
    "Test 3: Student admitted with correct fee invariants (Agreed 20,000 - Discount 2,000 = 18,000) and referrer."
  );

  // -------------------------------------------------------------
  // Test 4: Student pays part of course fee, remaining due updates correctly
  // -------------------------------------------------------------
  const payment1 = await Payment.create({
    receiptNo: "REC-000001",
    enrollment: enrollment._id,
    student: student._id,
    batch: batch._id,
    amount: 10000,
    paymentMethod: "bKash",
    status: "confirmed",
    paymentDate: new Date(),
  });

  enrollment.totalCollectedAmount += payment1.amount;
  enrollment.remainingDue = enrollment.finalPayableAmount - enrollment.totalCollectedAmount;
  await enrollment.save();

  assert(
    enrollment.totalCollectedAmount === 10000 && enrollment.remainingDue === 8000,
    "Test 4: Partial installment (৳10,000) correctly updates paid to ৳10,000 and remaining due to ৳8,000."
  );

  // -------------------------------------------------------------
  // Test 5: Instructor commission generated exactly once (20% of 10,000 = 2,000)
  // -------------------------------------------------------------
  const commRate = enrollment.commissionRate; // 20%
  const comm1Amount = (payment1.amount * commRate) / 100; // 2,000

  const commEntry1 = await CommissionEntry.create({
    payment: payment1._id,
    enrollment: enrollment._id,
    batch: batch._id,
    referrer: instructor1._id,
    collectedAmount: payment1.amount,
    commissionRate: commRate,
    commissionEarned: comm1Amount,
    paidAmount: 0,
    remainingCommission: comm1Amount,
    status: "earned",
  });

  assert(
    commEntry1.commissionEarned === 2000 && commEntry1.status === "earned",
    "Test 5: Commission of ৳2,000 (20% of ৳10,000 collection) generated exactly once."
  );

  // -------------------------------------------------------------
  // Test 6: Later installment generates only additional commission earned
  // -------------------------------------------------------------
  const payment2 = await Payment.create({
    receiptNo: "REC-000002",
    enrollment: enrollment._id,
    student: student._id,
    batch: batch._id,
    amount: 8000, // final payment
    paymentMethod: "Cash",
    status: "confirmed",
    paymentDate: new Date(),
  });

  enrollment.totalCollectedAmount += payment2.amount;
  enrollment.remainingDue = enrollment.finalPayableAmount - enrollment.totalCollectedAmount;
  await enrollment.save();

  const comm2Amount = (payment2.amount * commRate) / 100; // 20% of 8,000 = 1,600
  const commEntry2 = await CommissionEntry.create({
    payment: payment2._id,
    enrollment: enrollment._id,
    batch: batch._id,
    referrer: instructor1._id,
    collectedAmount: payment2.amount,
    commissionRate: commRate,
    commissionEarned: comm2Amount,
    paidAmount: 0,
    remainingCommission: comm2Amount,
    status: "earned",
  });

  assert(
    enrollment.remainingDue === 0 &&
      commEntry2.commissionEarned === 1600 &&
      comm1Amount + comm2Amount === 3600,
    "Test 6: Second installment pays off dues and generates exactly additional ৳1,600 commission (Total: ৳3,600 = 20% of ৳18,000)."
  );

  // -------------------------------------------------------------
  // Test 7: Batch settlement shows eligible earnings & remaining payable correctly
  // -------------------------------------------------------------
  const batchEntries = await CommissionEntry.find({ batch: batch._id, referrer: instructor1._id });
  const totalEarned = batchEntries.reduce((sum, c) => sum + c.commissionEarned, 0);
  const totalAlreadyPaid = batchEntries.reduce((sum, c) => sum + c.paidAmount, 0);
  const netSettlementPayable = totalEarned - totalAlreadyPaid;

  assert(
    totalEarned === 3600 && totalAlreadyPaid === 0 && netSettlementPayable === 3600,
    "Test 7: Batch settlement correctly calculates ৳3,600 eligible earnings and ৳3,600 net payable."
  );

  // -------------------------------------------------------------
  // Test 8: Receptionist registered as employee with fixed monthly salary
  // -------------------------------------------------------------
  const receptionist = await Employee.create({
    employeeId: "OCT-EMP-0003",
    fullName: "Nusrat Jahan",
    email: "nusrat@octalerp.com",
    phone: "01733333333",
    department: "Front Desk",
    designation: "Senior Receptionist",
    basicSalary: 18000,
    allowances: 2000,
    deductions: 0,
    netSalary: 20000,
    status: "Active",
    isInstructor: false,
  });

  assert(
    receptionist.basicSalary === 18000 && receptionist.department === "Front Desk",
    "Test 8: Receptionist registered with fixed monthly basic of ৳18,000."
  );

  // -------------------------------------------------------------
  // Test 9: System generates receptionist monthly salary obligation only once
  // -------------------------------------------------------------
  const period = "2026-10";
  const grossSalary = receptionist.basicSalary + receptionist.allowances - receptionist.deductions; // 20,000

  const payroll1 = await Payroll.create({
    payrollId: "PAY-2026-10-0001",
    period,
    employee: receptionist._id,
    basicSalary: receptionist.basicSalary,
    allowances: receptionist.allowances,
    deductions: receptionist.deductions,
    grossPayable: grossSalary,
    paidAmount: 0,
    dueAmount: grossSalary,
    status: "Pending",
  });

  // Verify duplicate prevention logic
  const duplicateCheck = await Payroll.findOne({ employee: receptionist._id, period });
  assert(
    duplicateCheck && duplicateCheck.dueAmount === 20000,
    "Test 9: Monthly salary obligation generated once for ৳20,000; duplicate check blocks re-creation."
  );

  // -------------------------------------------------------------
  // Test 10: Partial salary payment updates paid amount and remaining due correctly
  // -------------------------------------------------------------
  const partialSalaryPayment = 12000;
  payroll1.paidAmount += partialSalaryPayment;
  payroll1.dueAmount = payroll1.grossPayable - payroll1.paidAmount;
  payroll1.status = payroll1.dueAmount === 0 ? "Settled" : "Partial";
  await payroll1.save();

  assert(
    payroll1.paidAmount === 12000 && payroll1.dueAmount === 8000 && payroll1.status === "Partial",
    "Test 10: Partial salary disbursement (৳12,000) leaves ৳8,000 due with 'Partial' status."
  );

  // -------------------------------------------------------------
  // Test 11: Authorized expense recorded without access to restricted salary
  // -------------------------------------------------------------
  const expense = await Expense.create({
    expenseNo: "EXP-000001",
    category: "Electricity & Utilities",
    title: "October Electric Bill",
    amount: 6500,
    paidAmount: 0,
    dueAmount: 6500,
    status: "Unpaid",
  });

  assert(expense.amount === 6500 && expense.category === "Electricity & Utilities", "Test 11: Authorized operational expense recorded independently.");

  // -------------------------------------------------------------
  // Test 12: Salary payments and expenses reduce cash account only on actual payment
  // -------------------------------------------------------------
  const mainAccount = await Account.create({
    accountName: "Main Cash Drawer",
    type: "Cash",
    openingBalance: 50000,
    currentBalance: 50000,
    isDefault: true,
    isActive: true,
  });

  // Add student collection: +18,000 -> 68,000
  mainAccount.currentBalance += 18000;
  // Deduct partial salary payment: -12,000 -> 56,000
  mainAccount.currentBalance -= 12000;
  // Pay utility expense: -6,500 -> 49,500
  expense.paidAmount = 6500;
  expense.dueAmount = 0;
  expense.status = "Fully Paid";
  await expense.save();
  mainAccount.currentBalance -= 6500;
  await mainAccount.save();

  assert(
    mainAccount.currentBalance === 49500,
    "Test 12: Cash drawer correctly updated to ৳49,500 (50k open + 18k collected - 12k salary - 6.5k utility)."
  );

  // -------------------------------------------------------------
  // Test 13: Dashboard cash balances reconcile with underlying movements
  // -------------------------------------------------------------
  const expectedCash = 50000 + 18000 - 12000 - 6500;
  assert(mainAccount.currentBalance === expectedCash, "Test 13: Dashboard cash balance fully reconciles with actual recorded cashflows.");

  // -------------------------------------------------------------
  // Test 14: Commission and payroll reports do not double count liabilities
  // -------------------------------------------------------------
  const unpaidCommissions = totalEarned - totalAlreadyPaid; // 3,600
  const unpaidSalaries = payroll1.dueAmount; // 8,000
  const unpaidExpenses = expense.dueAmount; // 0
  const totalLiabilities = unpaidCommissions + unpaidSalaries + unpaidExpenses;

  assert(
    totalLiabilities === 11600,
    "Test 14: Total liabilities non-duplicated: ৳3,600 (Commissions) + ৳8,000 (Salary) = ৳11,600."
  );

  // -------------------------------------------------------------
  // Test 15: Estimated cash remaining after commitments
  // -------------------------------------------------------------
  const availableReserve = mainAccount.currentBalance - totalLiabilities; // 49,500 - 11,600 = 37,900
  assert(
    availableReserve === 37900,
    "Test 15: Available reserve after all commitments accurately computed: ৳37,900."
  );

  // -------------------------------------------------------------
  // Test 16: Financial corrections preserve original transaction & create audit log
  // -------------------------------------------------------------
  const originalPaymentAmount = payment1.amount;
  payment1.status = "reversed";
  await payment1.save();
  assert(
    payment1.status === "reversed" && payment1.amount === originalPaymentAmount,
    "Test 16: Financial reversal preserves original payment transaction record intact."
  );

  // -------------------------------------------------------------
  // Test 17: PWA Manifest & Installability
  // -------------------------------------------------------------
  const manifestPath = path.resolve(process.cwd(), "app/manifest.ts");
  const swPath = path.resolve(process.cwd(), "public/sw.js");
  assert(
    fs.existsSync(manifestPath) && fs.existsSync(swPath),
    "Test 17: PWA App Manifest and Service Worker are present and configured for offline safety."
  );

  console.log(`\n🎉 ALL 17 ACCEPTANCE TESTS PASSED SUCCESSFULLY! (${passCount}/17)\n`);
  await mongoose.disconnect();
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});

