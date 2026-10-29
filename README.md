<div align="center">

# 🎓 Octal ERP
### Academic Operations, Student Admissions, Staff, Payroll & Financial Management System

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
[![Clerk Auth](https://img.shields.io/badge/Clerk-Authentication-6C47FF?style=for-the-badge&logo=clerk)](https://clerk.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=for-the-badge&logo=pwa)](https://web.dev/progressive-web-apps/)

*One ERP · Unified Academic Operations · Complete Staff Management · Accurate Financial Tracking · Progressive Web App (PWA)*

</div>

---

## 📌 Table of Contents

- [✨ Key Modules & Capabilities](#-key-modules--capabilities)
  - [📚 Academic Management (Subjects, Courses, Batches)](#-academic-management)
  - [👨‍🎓 Student Directory, Admissions & Referrals](#-student-directory-admissions--referrals)
  - [💳 Payment Collections, Invoicing & Receipts](#-payment-collections-invoicing--receipts)
  - [🤝 Instructor Commissions & Batch Settlements](#-instructor-commissions--batch-settlements)
  - [👥 Staff Directory & Confidential Monthly Payroll](#-staff-directory--confidential-monthly-payroll)
  - [💸 Operational Expenses & Multi-Account Cash Ledger](#-operational-expenses--multi-account-cash-ledger)
  - [📈 Financial Dashboard & 14 Operational Reports](#-financial-dashboard--14-operational-reports)
  - [📱 Progressive Web App (PWA) & Mobile UX](#-progressive-web-app-pwa--mobile-ux)
  - [🔐 Server-Enforced RBAC & Resource Security](#-server-enforced-rbac--resource-security)
- [🛠️ Tech Stack](#️-tech-stack)
- [📁 Project Architecture](#-project-architecture)
- [🗄️ Database Schemas](#️-database-schemas)
- [🌐 Routes Matrix](#-routes-matrix)
- [⚡ Quick Start & Setup](#-quick-start--setup)
- [🛡️ Verification & Acceptance Tests](#️-verification--acceptance-tests)

---

## ✨ Key Modules & Capabilities

### 📚 Academic Management
- **Subjects & Courses**: Manage core academic disciplines and structured courses with prerequisite tracking, syllabus modules, fee schedules, and default instructor assignments.
- **Batch Lifecycle**: Schedule batches with unique auto-generated codes (`FSWD-B01`), room/schedule slots, seat limits, and assigned instructors.
- **Instructor Scoping**: Instructors only access courses and batches explicitly assigned to them.

### 👨‍🎓 Student Directory, Admissions & Referrals
- **Student Admissions**: Comprehensive profile capture with automated student ID assignment (`OCT-2026-0001`), contact info, guardian emergency details, and blood group.
- **Fee Configuration**: Course agreed fee and upfront discount configuration (`Agreed Fee - Discount = Net Payable`).
- **Referral Attribution**: Direct attribution of enrolled students to referring instructors or staff members with percentage commission calculations.

### 💳 Payment Collections, Invoicing & Receipts
- **Multi-Installment Collections**: Record student tuition payments via Cash, bKash, Nagad, Rocket, Bank Transfer, or Card.
- **Atomic Receipt Generation**: Auto-incremented sequence numbers (`REC-2026-0001`) with printable student vouchers.
- **Audit-Safe Financial Reversals**: Reversals preserve immutable audit history rather than hard deleting records.

### 🤝 Instructor Commissions & Batch Settlements
- **Automated Commission Calculations**: Real-time commission ledger entries generated upon student payment collection.
- **Batch Settlements**: Aggregate eligible collections per batch, compute net earnings, deductions, and payouts.
- **Instructor Portal**: Restricted view for instructors showing only their assigned batches, referred students, commission statements, and payout history.

### 👥 Staff Directory & Confidential Monthly Payroll
- **Staff Directory**: Track all employees with designations, departments, contact info, joining date, and salary terms.
- **Monthly Payroll Generation**: Idempotent monthly payroll generator preventing duplicate salary records for the same month (`OCT-PAY-2026-10-001`).
- **Disbursements & Slips**: Partial or full disbursements with printable pay vouchers. Non-administrative staff cannot view peer salaries.

### 💸 Operational Expenses & Multi-Account Cash Ledger
- **Expense Tracking**: Categorized expenses (Rent, Utilities, Marketing, Supplies, Software) with approval workflows and receipt attachments.
- **Multi-Account Cashflow Ledger**: Real-time cash balance reconciliation across physical Cash Drawers, Bank Accounts, and Mobile Money accounts.

### 📈 Financial Dashboard & 14 Operational Reports
- **Real-Time Financial Dashboard**: Super Admin executive overview of Total Revenue, Collected Fees, Outstanding Receivables, Payroll Liabilities, Commission Commitments, and True Cash Reserves.
- **14 Built-In Operational Reports**:
  1. Student Enrollment Report
  2. Tuition Due & Aging Report
  3. Daily Payment Collection Sheet
  4. Batch Revenue Performance
  5. Referral Performance Report
  6. Instructor Commission Ledger
  7. Batch Settlement Statements
  8. Monthly Payroll Register
  9. Salary Payment History
  10. Operational Expenses Summary
  11. Account Cashflow Ledger
  12. Profit & Loss Statement
  13. Comprehensive Balance Sheet
  14. System Audit Trail

### 📱 Progressive Web App (PWA) & Mobile UX
- Fully responsive mobile-first UI built with Tailwind CSS and Radix UI primitives.
- PWA installability with web manifest, offline service worker caching, and live online/offline indicator.

### 🔐 Server-Enforced RBAC & Resource Security
- Server-side role validation across all Server Actions and API endpoints.
- Role matrix supporting `super_admin`, `admin`, `instructor`, `receptionist`, `accountant`, and `staff`.
- Data isolation ensuring instructors and staff cannot inspect global finances or peer records.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 15.5](https://nextjs.org/) (App Router, Turbopack)
- **UI Library**: [React 19](https://react.dev/)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/) (Strict typing, no `any`)
- **Styling**: [Tailwind CSS 3.4](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
- **Authentication**: [Clerk](https://clerk.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) via [Mongoose 8.24](https://mongoosejs.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Forms**: [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)

---

## 📁 Project Architecture

```
octal-erp/
├── app/
│   ├── (auth)/                  # Clerk Sign-In & Sign-Up with Octal Branding
│   ├── (root)/
│   │   ├── academic/            # Subjects, Courses & Batches
│   │   ├── students/            # Student Directory & Admissions
│   │   ├── payments/            # Tuition Collections & Receipts
│   │   ├── finance/             # Commissions, Settlements & Accounts
│   │   ├── staff/               # Employee Directory & Salary Terms
│   │   ├── payroll/             # Monthly Payroll & Pay Slips
│   │   ├── expenses/            # Operational Expenses
│   │   ├── reports/             # 14 Operational & Financial Reports
│   │   ├── admins/              # RBAC & Admin User Management
│   │   ├── activity-logs/       # System Audit Trail
│   │   └── settings/            # System & Institution Settings
├── components/
│   ├── academic/                # Academic UI & dialog components
│   ├── students/                # Student admission forms & details
│   ├── payments/                # Payment collection modals & receipts
│   ├── finance/                 # Commissions, settlements, accounts
│   ├── staff/                   # Employee management forms
│   ├── payroll/                 # Payroll generator & disbursement modals
│   ├── expenses/                # Expense tracking dialogs
│   ├── reports/                 # Financial reporting tables & filters
│   ├── shared/                  # Header, Sidebar, PWA offline banner
│   └── ui/                      # shadcn/ui accessible components
├── lib/
│   ├── actions/                 # Clean Server Actions with RBAC guards
│   ├── database/
│   │   ├── models/              # 14 Mongoose Schema Definitions
│   │   └── index.ts             # Cached MongoDB Connection
│   ├── auth-guard.ts            # Server-side authentication & role guards
│   ├── rbac-utils.ts            # Permission hierarchy & module resolvers
│   └── utils.ts                 # Currency (৳ BDT) & Date formatters
├── public/
│   ├── erp-logo.png             # Official 1:1 Octal ERP Logo
│   ├── manifest.webmanifest     # PWA Web App Manifest
│   └── sw.js                    # Offline Service Worker
└── scripts/
    └── verify-acceptance-tests.mjs # 17-Scenario E2E Acceptance Test Suite
```

---

## 🌐 Routes Matrix

| Route | Module | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `/` | **Financial Dashboard** | Super Admin, Admin, Instructor | Executive dashboard with metrics & reserve calculations |
| `/academic/subjects` | **Subjects** | Super Admin, Admin | Curriculum subjects & modules |
| `/academic/courses` | **Courses** | Super Admin, Admin, Instructor | Course catalog, syllabi & fees |
| `/academic/batches` | **Batches** | Super Admin, Admin, Instructor | Active & scheduled batches |
| `/students` | **Student Directory** | Super Admin, Admin, Staff | Student roster & search |
| `/students/new` | **Admission Form** | Super Admin, Admin, Receptionist | Enroll student & configure fees |
| `/payments` | **Collections** | Super Admin, Admin, Accountant | Tuition collections & receipts |
| `/finance/commissions` | **Commissions** | Super Admin, Admin, Instructor | Referral commission statements |
| `/finance/settlements` | **Settlements** | Super Admin, Admin | Batch commission disbursements |
| `/finance/accounts` | **Ledger** | Super Admin, Admin, Accountant | Multi-account cash drawer ledger |
| `/staff` | **Staff Directory** | Super Admin, Admin | Employee roster & designations |
| `/payroll` | **Monthly Payroll** | Super Admin, Admin, Accountant | Salary generation & pay slips |
| `/expenses` | **Expenses** | Super Admin, Admin, Accountant | Operational expense tracker |
| `/reports` | **Reports** | Super Admin, Admin | 14 financial & operational statements |
| `/admins` | **Admins & RBAC** | Super Admin | Access control & user permissions |
| `/settings` | **Settings** | Super Admin | System configuration & branding |

---

## ⚡ Quick Start & Setup

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/ninazmul/octal-erp.git
cd octal-erp
npm install
```

### 2. Configure Environment
Copy `.env.local.example` to `.env.local`:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/octal-erp?retryWrites=true&w=majority
```

### 3. Run Development Server
```bash
npm run dev
```
Visit `http://localhost:3000` to interact with Octal ERP.

### 4. Build for Production
```bash
npm run build
npm start
```

---

## 🛡️ Verification & Acceptance Tests

Execute the 17-scenario automated acceptance test suite:
```bash
node scripts/verify-acceptance-tests.mjs
```

All 17 domain criteria are verified:
- Academic entity creation & batch code formatting
- Instructor scoping & batch security guards
- Admission fee mathematics & referral attribution
- Multi-installment payment recording & atomic receipt numbering
- Single idempotent commission calculation per payment
- Cumulative commission aggregation & batch settlements
- Fixed basic salary employee onboarding
- Idempotent monthly payroll generation
- Partial salary disbursements with remaining dues
- Independent operational expense tracking
- Multi-account cashflow ledger reconciliation
- Executive reserve calculation (`Net Cash - Liabilities`)
- Financial reversal audit-trail preservation
- PWA manifest and service worker configuration
