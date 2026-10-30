"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

export type AppLanguage = "en" | "bn";

const translations: Record<string, string> = {
  "Overview": "সারসংক্ষেপ",
  "Dashboard": "ড্যাশবোর্ড",
  "Academic Management": "একাডেমিক ব্যবস্থাপনা",
  "Subjects": "বিষয়সমূহ",
  "Courses": "কোর্সসমূহ",
  "Batches": "ব্যাচসমূহ",
  "Students & Admissions": "শিক্ষার্থী ও ভর্তি",
  "New Admission": "নতুন ভর্তি",
  "Financial Collections": "আর্থিক সংগ্রহ",
  "Student Payments": "শিক্ষার্থীর পেমেন্ট",
  "Commissions & Payouts": "কমিশন ও পরিশোধ",
  "Commission Entries": "কমিশন এন্ট্রি",
  "Batch Settlements": "ব্যাচ নিষ্পত্তি",
  "Staff & Payroll": "কর্মী ও বেতন",
  "Staff Directory": "কর্মী তালিকা",
  "Monthly Payroll": "মাসিক বেতন",
  "Expenses & Accounts": "ব্যয় ও হিসাব",
  "Expenses": "ব্যয়",
  "Cash & Accounts": "নগদ ও হিসাব",
  "Reports & Analytics": "রিপোর্ট ও বিশ্লেষণ",
  "Reports Center": "রিপোর্ট কেন্দ্র",
  "Administration": "প্রশাসন",
  "Manage Admins": "অ্যাডমিন ব্যবস্থাপনা",
  "Activity Logs": "কার্যক্রমের লগ",
  "Settings": "সেটিংস",
  "Language": "ভাষা",
  "Academic & Operations": "একাডেমিক ও পরিচালনা",
  "Quick Search...": "দ্রুত অনুসন্ধান...",
  "Welcome back": "স্বাগতম",
  "Your organization at a glance": "আপনার প্রতিষ্ঠানের এক নজরের চিত্র",
  "Quick Actions": "দ্রুত কার্যক্রম",
  "Recent Activity": "সাম্প্রতিক কার্যক্রম",
  "Recent Payments": "সাম্প্রতিক পেমেন্ট",
  "Recent Admissions": "সাম্প্রতিক ভর্তি",
  "Financial Overview": "আর্থিক সারসংক্ষেপ",
  "Academic Overview": "একাডেমিক সারসংক্ষেপ",
  "Today": "আজ",
  "This Month": "এই মাস",
  "This Year": "এই বছর",
  "Total Students": "মোট শিক্ষার্থী",
  "Active Students": "সক্রিয় শিক্ষার্থী",
  "Total Revenue": "মোট আয়",
  "Outstanding Dues": "মোট বকেয়া",
  "Total Expenses": "মোট ব্যয়",
  "Total Staff": "মোট কর্মী",
  "Active Batches": "সক্রিয় ব্যাচ",
  "Student Management": "শিক্ষার্থী ব্যবস্থাপনা",
  "Student Directory & Admissions": "শিক্ষার্থী তালিকা ও ভর্তি",
  "Student Directory": "শিক্ষার্থী তালিকা",
  "Octal Management Dashboard": "Octal ব্যবস্থাপনা ড্যাশবোর্ড",
  "Tuition Collections & Receipts": "টিউশন ফি আদায় ও রসিদ",
  "Operational Expense Management": "পরিচালন ব্যয় ব্যবস্থাপনা",
  "Monthly Payroll Management": "মাসিক বেতন ব্যবস্থাপনা",
  "Complete Staff & Employee Directory": "সম্পূর্ণ কর্মী তালিকা",
  "Operational & Financial Reports Center": "পরিচালন ও আর্থিক রিপোর্ট কেন্দ্র",
  "Manage student profiles, enrollments, and payments.": "শিক্ষার্থীর তথ্য, ভর্তি এবং পেমেন্ট পরিচালনা করুন।",
  "Academic Subjects": "একাডেমিক বিষয়সমূহ",
  "Manage training subjects and curriculum categories.": "প্রশিক্ষণের বিষয় ও পাঠ্যক্রমের বিভাগ পরিচালনা করুন।",
  "Course Catalog": "কোর্স তালিকা",
  "Manage courses, pricing, and assigned instructors.": "কোর্স, মূল্য এবং নির্ধারিত প্রশিক্ষক পরিচালনা করুন।",
  "Batch Management": "ব্যাচ ব্যবস্থাপনা",
  "Manage class schedules, student enrollments, and batch finances.": "ক্লাসের সময়সূচি, শিক্ষার্থী ভর্তি ও ব্যাচের হিসাব পরিচালনা করুন।",
  "Student Payments & Collections": "শিক্ষার্থীর পেমেন্ট ও আদায়",
  "Record, verify, and manage student fee collections.": "শিক্ষার্থীর ফি সংগ্রহ নথিভুক্ত, যাচাই ও পরিচালনা করুন।",
  "Expenses & Payables": "ব্যয় ও পরিশোধযোগ্য",
  "Track operational expenses and payment obligations.": "পরিচালন ব্যয় ও পেমেন্টের দায় হিসাব রাখুন।",
  "Instructor Commissions & Referral Earnings": "প্রশিক্ষকের কমিশন ও রেফারেল আয়",
  "Track earned referral commissions from student payments, configure rates, and review settlement eligibility.": "শিক্ষার্থীর পেমেন্ট থেকে অর্জিত রেফারেল কমিশন দেখুন, হার নির্ধারণ করুন এবং নিষ্পত্তির যোগ্যতা যাচাই করুন।",
  "Batch Settlement Statements & Payouts": "ব্যাচ নিষ্পত্তির বিবরণী ও পরিশোধ",
  "Staff & Payroll Management": "কর্মী ও বেতন ব্যবস্থাপনা",
  "Cash & Bank Accounts Ledger": "নগদ ও ব্যাংক হিসাবের খতিয়ান",
  "Student Profile": "শিক্ষার্থীর প্রোফাইল",
  "Enrolled Students": "ভর্তিকৃত শিক্ষার্থী",
  "Payment History": "পেমেন্টের ইতিহাস",
  "Enrollment History": "ভর্তির ইতিহাস",
  "Student Information": "শিক্ষার্থীর তথ্য",
  "Personal Information": "ব্যক্তিগত তথ্য",
  "Guardian Information": "অভিভাবকের তথ্য",
  "Course & Batch Details": "কোর্স ও ব্যাচের বিবরণ",
  "Referral Information": "রেফারেলের তথ্য",
  "Financial Information": "আর্থিক তথ্য",
  "Full Name": "সম্পূর্ণ নাম",
  "Student ID": "শিক্ষার্থী আইডি",
  "Guardian Name": "অভিভাবকের নাম",
  "Guardian Phone": "অভিভাবকের ফোন",
  "Email Address": "ইমেইল ঠিকানা",
  "Select Subject": "বিষয় নির্বাচন করুন",
  "Select Instructor": "প্রশিক্ষক নির্বাচন করুন",
  "Select Payment Method": "পেমেন্ট পদ্ধতি নির্বাচন করুন",
  "Select Referrer": "রেফারার নির্বাচন করুন",
  "Select Status": "অবস্থা নির্বাচন করুন",
  "Target Course": "নির্ধারিত কোর্স",
  "Referral Attribution": "রেফারেল পরিচিতি",
  "Referring Instructor": "রেফারকারী প্রশিক্ষক",
  "Agreed Fee": "নির্ধারিত ফি",
  "Final Payable": "সর্বশেষ পরিশোধযোগ্য",
  "Collected": "সংগৃহীত",
  "Remaining": "অবশিষ্ট",
  "Commission Rate": "কমিশনের হার",
  "Commission Earned": "অর্জিত কমিশন",
  "Payment Date": "পেমেন্টের তারিখ",
  "Due Date": "শেষ তারিখ",
  "Batch Name": "ব্যাচের নাম",
  "Batch Code": "ব্যাচ কোড",
  "Course Name": "কোর্সের নাম",
  "Subject Name": "বিষয়ের নাম",
  "Start Date": "শুরুর তারিখ",
  "End Date": "শেষ তারিখ",
  "Class Schedule": "ক্লাসের সময়সূচি",
  "Description and curriculum...": "বিবরণ ও পাঠ্যক্রম...",
  "e.g. Tanvir Ahmed": "যেমন: তানভীর আহমেদ",
  "House, Road, Area, City...": "বাড়ি, সড়ক, এলাকা, শহর...",
  "Search by batch name or batch code...": "ব্যাচের নাম বা কোড দিয়ে খুঁজুন...",
  "Search by subject name or code...": "বিষয়ের নাম বা কোড দিয়ে খুঁজুন...",
  "Search by course title or code...": "কোর্সের নাম বা কোড দিয়ে খুঁজুন...",
  "Search by receipt number (REC-...), student name, or TrxID...": "রসিদ নম্বর (REC-...), শিক্ষার্থীর নাম বা TrxID দিয়ে খুঁজুন...",
  "Filter by status": "অবস্থা অনুযায়ী ফিল্টার",
  "Filter students by status": "অবস্থা অনুযায়ী শিক্ষার্থী ফিল্টার করুন",
  "Filter by verification status": "যাচাইয়ের অবস্থা অনুযায়ী ফিল্টার",
  "Filter by payment method": "পেমেন্ট পদ্ধতি অনুযায়ী ফিল্টার",
  "New Student Admission": "নতুন শিক্ষার্থী ভর্তি",
  "Add New Student": "নতুন শিক্ষার্থী যোগ করুন",
  "Add New Course": "নতুন কোর্স যোগ করুন",
  "Add New Subject": "নতুন বিষয় যোগ করুন",
  "Add New Batch": "নতুন ব্যাচ যোগ করুন",
  "Create Admission": "ভর্তি তৈরি করুন",
  "Save Student": "শিক্ষার্থীর তথ্য সংরক্ষণ",
  "Save Course": "কোর্স সংরক্ষণ",
  "Save Subject": "বিষয় সংরক্ষণ",
  "Save Batch": "ব্যাচ সংরক্ষণ",
  "Create Batch": "ব্যাচ তৈরি করুন",
  "Create Course": "কোর্স তৈরি করুন",
  "Create Subject": "বিষয় তৈরি করুন",
  "Search by student name, ID (OCT-STU-...), or phone number...": "শিক্ষার্থীর নাম, আইডি (OCT-STU-...) বা ফোন নম্বর দিয়ে খুঁজুন...",
  "Search by batch name, course, or instructor...": "ব্যাচের নাম, কোর্স বা প্রশিক্ষক দিয়ে খুঁজুন...",
  "Search by employee name or ID...": "কর্মীর নাম বা আইডি দিয়ে খুঁজুন...",
  "Search by expense title or category...": "ব্যয়ের শিরোনাম বা শ্রেণি দিয়ে খুঁজুন...",
  "No students enrolled in this batch yet.": "এই ব্যাচে এখনো কোনো শিক্ষার্থী ভর্তি হয়নি।",
  "No payments collected from this student yet.": "এই শিক্ষার্থীর কাছ থেকে এখনো কোনো পেমেন্ট সংগ্রহ করা হয়নি।",
  "Install on your phone": "ফোনে ইনস্টল করুন",
  "Add Octal ERP to your home screen for quick access and an app-like experience.": "দ্রুত ব্যবহার ও অ্যাপের মতো অভিজ্ঞতার জন্য Octal ERP হোম স্ক্রিনে যোগ করুন।",
  "Search": "অনুসন্ধান",
  "Search...": "অনুসন্ধান...",
  "Add": "যোগ করুন",
  "Create": "তৈরি করুন",
  "Edit": "সম্পাদনা",
  "Update": "হালনাগাদ",
  "Delete": "মুছুন",
  "Remove": "সরান",
  "Save": "সংরক্ষণ",
  "Save Changes": "পরিবর্তন সংরক্ষণ",
  "Cancel": "বাতিল",
  "Close": "বন্ধ করুন",
  "Confirm": "নিশ্চিত করুন",
  "Submit": "জমা দিন",
  "Actions": "কার্যক্রম",
  "Status": "অবস্থা",
  "Date": "তারিখ",
  "Name": "নাম",
  "Email": "ইমেইল",
  "Phone": "ফোন",
  "Address": "ঠিকানা",
  "Notes": "নোট",
  "Amount": "পরিমাণ",
  "Total": "মোট",
  "Paid": "পরিশোধিত",
  "Due": "বকেয়া",
  "Active": "সক্রিয়",
  "Inactive": "নিষ্ক্রিয়",
  "All": "সব",
  "All Statuses": "সব অবস্থা",
  "No results found": "কোনো ফলাফল পাওয়া যায়নি",
  "Loading...": "লোড হচ্ছে...",
  "Required": "আবশ্যক",
  "Select": "নির্বাচন করুন",
  "Select Course": "কোর্স নির্বাচন করুন",
  "Select Batch": "ব্যাচ নির্বাচন করুন",
  "Select Student": "শিক্ষার্থী নির্বাচন করুন",
  "Student": "শিক্ষার্থী",
  "Students": "শিক্ষার্থীরা",
  "Course": "কোর্স",
  "Batch": "ব্যাচ",
  "Instructor": "প্রশিক্ষক",
  "Employee": "কর্মী",
  "Department": "বিভাগ",
  "Role": "ভূমিকা",
  "Payment": "পেমেন্ট",
  "Payments": "পেমেন্টসমূহ",
  "Payment Method": "পেমেন্ট পদ্ধতি",
  "Transaction Ref": "লেনদেন রেফারেন্স",
  "Receipt No": "রসিদ নম্বর",
  "Description": "বিবরণ",
  "Category": "শ্রেণি",
  "Search by name, ID, or phone...": "নাম, আইডি বা ফোন দিয়ে খুঁজুন...",
  "Search by student name or ID...": "শিক্ষার্থীর নাম বা আইডি দিয়ে খুঁজুন...",
  "Search by instructor name, student, or batch...": "প্রশিক্ষক, শিক্ষার্থী বা ব্যাচ দিয়ে খুঁজুন...",
  "No students found.": "কোনো শিক্ষার্থী পাওয়া যায়নি।",
  "No payments found.": "কোনো পেমেন্ট পাওয়া যায়নি।",
  "No commission entries found.": "কোনো কমিশন এন্ট্রি পাওয়া যায়নি।",
  "Add Student": "শিক্ষার্থী যোগ করুন",
  "Add Course": "কোর্স যোগ করুন",
  "Add Subject": "বিষয় যোগ করুন",
  "Add Batch": "ব্যাচ যোগ করুন",
  "Add Employee": "কর্মী যোগ করুন",
  "Add Expense": "ব্যয় যোগ করুন",
  "Add Account": "হিসাব যোগ করুন",
  "Create New Course": "নতুন কোর্স তৈরি করুন",
  "Create New Subject": "নতুন বিষয় তৈরি করুন",
  "Create New Batch": "নতুন ব্যাচ তৈরি করুন",
  "Edit Course": "কোর্স সম্পাদনা",
  "Edit Subject": "বিষয় সম্পাদনা",
  "Edit Batch": "ব্যাচ সম্পাদনা",
  "Edit Student Profile": "শিক্ষার্থীর তথ্য সম্পাদনা",
  "Edit Employee Profile": "কর্মীর তথ্য সম্পাদনা",
  "Collect Fee": "ফি সংগ্রহ",
  "Collect Payment": "পেমেন্ট সংগ্রহ",
  "Verify": "যাচাই করুন",
  "Reverse": "বাতিল এন্ট্রি",
  "Reversed": "বাতিল করা হয়েছে",
  "Confirmed": "নিশ্চিত",
  "Pending": "অপেক্ষমাণ",
  "Draft": "খসড়া",
  "Approved": "অনুমোদিত",
  "Completed": "সম্পন্ন",
  "Cancelled": "বাতিল",
  "Archived": "সংরক্ষণাগারে",
  "Generate Report": "রিপোর্ট তৈরি করুন",
  "Download": "ডাউনলোড",
  "Export": "রপ্তানি",
  "Import": "আমদানি",
  "Already Installed": "ইতোমধ্যে ইনস্টল করা হয়েছে",
  "Install Octal ERP": "Octal ERP ইনস্টল করুন",
  "Use Browser Menu": "ব্রাউজার মেনু ব্যবহার করুন",
  "Academic Operations": "একাডেমিক কার্যক্রম",
  "Manage Courses": "কোর্স পরিচালনা",
  "Commission Rules": "কমিশন নীতিমালা",
  "Accounts": "হিসাবসমূহ",
  "Payroll": "বেতন",
  "Administrator Accounts": "অ্যাডমিন অ্যাকাউন্ট",
  "Manage Admin Accounts": "অ্যাডমিন অ্যাকাউন্ট পরিচালনা",
  "Restricted Area": "সীমাবদ্ধ এলাকা",
  "Super Administrator": "সুপার অ্যাডমিনিস্ট্রেটর",
  "Light Mode": "লাইট মোড",
  "Dark Mode": "ডার্ক মোড",
};

const commonWords: Record<string, string> = {
  add: "যোগ করুন",
  new: "নতুন",
  create: "তৈরি করুন",
  edit: "সম্পাদনা",
  update: "হালনাগাদ",
  delete: "মুছুন",
  remove: "সরান",
  save: "সংরক্ষণ",
  changes: "পরিবর্তন",
  cancel: "বাতিল",
  close: "বন্ধ করুন",
  confirm: "নিশ্চিত করুন",
  submit: "জমা দিন",
  continue: "চালিয়ে যান",
  back: "ফিরে যান",
  view: "দেখুন",
  details: "বিস্তারিত",
  manage: "পরিচালনা",
  select: "নির্বাচন করুন",
  search: "অনুসন্ধান",
  filter: "ফিল্টার",
  clear: "মুছুন",
  reset: "রিসেট",
  export: "রপ্তানি",
  import: "আমদানি",
  download: "ডাউনলোড",
  upload: "আপলোড",
  print: "প্রিন্ট",
  refresh: "রিফ্রেশ",
  name: "নাম",
  full: "সম্পূর্ণ",
  email: "ইমেইল",
  phone: "ফোন",
  address: "ঠিকানা",
  date: "তারিখ",
  time: "সময়",
  status: "অবস্থা",
  type: "ধরন",
  category: "শ্রেণি",
  description: "বিবরণ",
  notes: "নোট",
  amount: "পরিমাণ",
  total: "মোট",
  paid: "পরিশোধিত",
  due: "বকেয়া",
  balance: "ব্যালেন্স",
  student: "শিক্ষার্থী",
  students: "শিক্ষার্থীরা",
  course: "কোর্স",
  courses: "কোর্সসমূহ",
  subject: "বিষয়",
  subjects: "বিষয়সমূহ",
  batch: "ব্যাচ",
  batches: "ব্যাচসমূহ",
  instructor: "প্রশিক্ষক",
  employee: "কর্মী",
  staff: "কর্মী",
  admin: "অ্যাডমিন",
  account: "হিসাব",
  accounts: "অ্যাকাউন্টসমূহ",
  payment: "পেমেন্ট",
  payments: "পেমেন্টসমূহ",
  expense: "ব্যয়",
  expenses: "ব্যয়সমূহ",
  commission: "কমিশন",
  commissions: "কমিশনসমূহ",
  payroll: "বেতন",
  report: "রিপোর্ট",
  reports: "রিপোর্টসমূহ",
  settings: "সেটিংস",
  active: "সক্রিয়",
  inactive: "নিষ্ক্রিয়",
  pending: "অপেক্ষমাণ",
  approved: "অনুমোদিত",
  completed: "সম্পন্ন",
  cancelled: "বাতিল",
  archived: "সংরক্ষণাগারে",
  verified: "যাচাইকৃত",
  rejected: "প্রত্যাখ্যাত",
  all: "সব",
  today: "আজ",
  yesterday: "গতকাল",
  month: "মাস",
  year: "বছর",
  start: "শুরু",
  end: "শেষ",
  first: "প্রথম",
  last: "শেষ",
  method: "পদ্ধতি",
  reference: "রেফারেন্স",
  receipt: "রসিদ",
  number: "নম্বর",
  id: "আইডি",
  code: "কোড",
  title: "শিরোনাম",
  role: "ভূমিকা",
  department: "বিভাগ",
  guardian: "অভিভাবক",
  information: "তথ্য",
  profile: "প্রোফাইল",
  history: "ইতিহাস",
  collection: "সংগ্রহ",
  collections: "সংগ্রহসমূহ",
  transaction: "লেনদেন",
  transactions: "লেনদেনসমূহ",
  financial: "আর্থিক",
  academic: "একাডেমিক",
  management: "ব্যবস্থাপনা",
  operations: "কার্যক্রম",
  overview: "সারসংক্ষেপ",
  welcome: "স্বাগতম",
  octal: "Octal",
  dashboard: "ড্যাশবোর্ড",
  tuition: "টিউশন ফি",
  receipts: "রসিদসমূহ",
  operational: "পরিচালন",
  complete: "সম্পূর্ণ",
  directory: "তালিকা",
  statements: "বিবরণী",
  center: "কেন্দ্র",
  quick: "দ্রুত",
  recent: "সাম্প্রতিক",
  activity: "কার্যক্রম",
  loading: "লোড হচ্ছে",
  please: "অনুগ্রহ করে",
  enter: "লিখুন",
  choose: "বেছে নিন",
  required: "আবশ্যক",
  optional: "ঐচ্ছিক",
  success: "সফল",
  failed: "ব্যর্থ",
  error: "ত্রুটি",
  warning: "সতর্কতা",
  unavailable: "পাওয়া যাচ্ছে না",
  no: "কোনো",
  found: "পাওয়া যায়নি",
  results: "ফলাফল",
  showing: "দেখানো হচ্ছে",
  of: "এর মধ্যে",
  per: "প্রতি",
  page: "পৃষ্ঠা",
  next: "পরবর্তী",
  previous: "পূর্ববর্তী",
  salary: "বেতন",
  payout: "পরিশোধ",
  settlement: "নিষ্পত্তি",
  settled: "নিষ্পত্তি হয়েছে",
  open: "খোলা",
  closed: "বন্ধ",
  unpaid: "অপরিশোধিত",
  outstanding: "বকেয়া",
  fee: "ফি",
  discount: "ছাড়",
  payable: "পরিশোধযোগ্য",
  earned: "অর্জিত",
  remaining: "অবশিষ্ট",
  confirmed: "নিশ্চিত",
  draft: "খসড়া",
  restricted: "সীমাবদ্ধ",
  area: "এলাকা",
  authorized: "অনুমোদিত",
  administrator: "অ্যাডমিনিস্ট্রেটর",
  system: "সিস্টেম",
  browser: "ব্রাউজার",
  install: "ইনস্টল",
  home: "হোম",
  screen: "স্ক্রিন",
  experience: "অভিজ্ঞতা",
  access: "প্রবেশাধিকার",
  cash: "নগদ",
  bank: "ব্যাংক",
  referral: "রেফারেল",
  earnings: "আয়",
  rate: "হার",
  rule: "নিয়ম",
  rules: "নিয়মাবলি",
  valid: "সঠিক",
};

interface LanguageContextValue {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  translate: (value: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);
const STORAGE_KEY = "octal-erp-language";

export function translateText(value: string, language: AppLanguage) {
  if (language === "en") return value;
  const trimmed = value.trim();
  const translated = translations[trimmed] || trimmed.replace(/[A-Za-z]+(?:['’-][A-Za-z]+)?/g, (word) => commonWords[word.toLowerCase()] || word);
  if (translated === trimmed) return value;
  const leading = value.match(/^\s*/)?.[0] || "";
  const trailing = value.match(/\s*$/)?.[0] || "";
  return `${leading}${translated}${trailing}`;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>("en");
  const originalText = useRef(new WeakMap<Text, string>());
  const originalAttributes = useRef(new WeakMap<Element, Map<string, string>>());
  const previousLanguage = useRef<AppLanguage>("en");

  const setLanguage = useCallback((next: AppLanguage) => {
    setLanguageState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const translate = useCallback((value: string) => translateText(value, language), [language]);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "bn" || stored === "en") setLanguageState(stored);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dataset.locale = language;
    const attributes = ["placeholder", "title", "aria-label", "alt"];

    const scan = (root: Node) => {
      const translateNode = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node as Text;
          let original = originalText.current.get(text);
          if (original === undefined || text.data !== translateText(original, previousLanguage.current)) {
            original = text.data;
            originalText.current.set(text, original);
          }
          const translated = translateText(original, language);
          if (text.data !== translated) text.data = translated;
        }
      };
      translateNode(root);
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
        acceptNode(node) {
          const parent = node.nodeType === Node.TEXT_NODE ? node.parentElement : node as Element;
          if (parent?.closest("script,style,noscript,textarea,[data-no-translate]")) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        },
      });
      const nodes: Node[] = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      for (const node of nodes) {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node as Text;
          let original = originalText.current.get(text);
          if (original === undefined || text.data !== translateText(original, previousLanguage.current)) {
            original = text.data;
            originalText.current.set(text, original);
          }
          const translated = translateText(original, language);
          if (text.data !== translated) text.data = translated;
        } else {
          const element = node as Element;
          let saved = originalAttributes.current.get(element);
          if (!saved) {
            saved = new Map();
            originalAttributes.current.set(element, saved);
          }
          for (const name of attributes) {
            const current = element.getAttribute(name);
            if (current === null) continue;
            if (!saved.has(name) || current !== translateText(saved.get(name) || "", previousLanguage.current)) saved.set(name, current);
            const translated = translateText(saved.get(name) || current, language);
            if (current !== translated) element.setAttribute(name, translated);
          }
        }
      }
    };

    scan(document.body);
    previousLanguage.current = language;
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "childList") mutation.addedNodes.forEach((node) => scan(node));
        else if (mutation.type === "characterData") scan(mutation.target.parentNode || document.body);
        else if (mutation.type === "attributes") scan(mutation.target);
      }
    });
    observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: attributes });
    previousLanguage.current = language;
    return () => observer.disconnect();
  }, [language]);

  const contextValue = useMemo(() => ({ language, setLanguage, translate }), [language, setLanguage, translate]);
  return <LanguageContext.Provider value={contextValue}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("useLanguage must be used within a LanguageProvider");
  return value;
}
