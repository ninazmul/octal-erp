# AI Project Context — Octal ERP

## Overview
**Octal ERP** is a modern Next.js 15 (App Router) full-stack enterprise resource planning system designed specifically for Octal. It centralizes:
- **Academic Operations**: Subjects, Courses, and Batches.
- **Student Admissions & Directory**: Fee structures, upfront discounts, and referral attribution.
- **Tuition Collections**: Atomic receipt generation, multi-installment payments, and immutable financial reversals.
- **Instructor Commissions**: Dynamic rule-based commission calculations and batch settlements.
- **Staff Management & Payroll**: Employee directory, confidential salary structures, idempotent monthly payroll runs, and partial/full disbursements.
- **Operational Expenses**: Categorized expense tracking and approval workflows.
- **Multi-Account Cashflow Ledger**: Real-time cash balance reconciliation across physical drawers, bank accounts, and mobile financial services (bKash/Nagad).
- **Executive Analytics**: 14 operational reports and financial reserve calculation (`Available Reserve = Liquid Cash - Outstanding Liabilities`).
- **PWA Capabilities**: Offline service worker caching and installability.

## Technology Stack
- **Framework**: Next.js 15.5 with Turbopack & React 19
- **Database**: MongoDB with Mongoose 8.24
- **Auth & RBAC**: Clerk authentication coupled with MongoDB Admin/Employee role profile guards
- **Styling**: Tailwind CSS & shadcn/ui (Radix primitives)
- **Language**: TypeScript with strict types (no `any`)

## Directory Map
- `app/(root)/academic/`: Subject, Course, and Batch management
- `app/(root)/students/`: Student directory, profile details, and admission forms
- `app/(root)/payments/`: Tuition collection, receipt vouchers, and payment history
- `app/(root)/finance/`: Commissions, batch settlements, and account ledgers
- `app/(root)/staff/`: Employee directory and salary terms
- `app/(root)/payroll/`: Monthly payroll generator, disbursements, and pay slips
- `app/(root)/expenses/`: Operational expense tracking
- `app/(root)/reports/`: 14 comprehensive operational and financial statements
- `app/(root)/admins/`: RBAC management and granular permissions
- `app/(root)/activity-logs/`: System audit logs
- `app/(root)/settings/`: System configuration
- `lib/actions/`: Modular server actions with server-side authentication guards
- `lib/database/models/`: 14 Mongoose models representing the ERP domain
