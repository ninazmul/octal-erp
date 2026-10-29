"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Search,
  Loader2,
  Users,
  GraduationCap,
  Layers,
  Receipt,
  Percent,
  Briefcase,
  Wallet,
  CreditCard,
  Building,
  BarChart3,
  ShieldCheck,
  ExternalLink,
  BookOpen,
} from "lucide-react";
import { getStudents } from "@/lib/actions/student.actions";
import { Badge } from "@/components/ui/badge";

interface QuickAction {
  title: string;
  subtitle: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  category: "Academic" | "Students" | "Finance" | "Staff" | "System";
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    title: "New Student Admission",
    subtitle: "Register student, calculate fees, assign batch & referrer",
    url: "/students/new",
    icon: Users,
    category: "Students",
  },
  {
    title: "Student Directory",
    subtitle: "Search, view admissions and enrollment history",
    url: "/students",
    icon: GraduationCap,
    category: "Students",
  },
  {
    title: "Collect Student Payment",
    subtitle: "Record full/partial payment & generate official receipt",
    url: "/payments",
    icon: Receipt,
    category: "Finance",
  },
  {
    title: "Batch Management",
    subtitle: "View batches, schedules, seat capacity & dues",
    url: "/academic/batches",
    icon: Layers,
    category: "Academic",
  },
  {
    title: "Courses & Fees",
    subtitle: "Manage courses, pricing and duration",
    url: "/academic/courses",
    icon: BookOpen,
    category: "Academic",
  },
  {
    title: "Subjects",
    subtitle: "Web Dev, Graphic Design, Marketing, etc.",
    url: "/academic/subjects",
    icon: GraduationCap,
    category: "Academic",
  },
  {
    title: "Instructor Commissions",
    subtitle: "View earned commissions, rates & payment status",
    url: "/finance/commissions",
    icon: Percent,
    category: "Finance",
  },
  {
    title: "Batch Settlements",
    subtitle: "Reconcile collections, statements & instructor payouts",
    url: "/finance/settlements",
    icon: Wallet,
    category: "Finance",
  },
  {
    title: "Staff & Employees",
    subtitle: "Manage instructors, receptionists, accountants & staff",
    url: "/staff",
    icon: Briefcase,
    category: "Staff",
  },
  {
    title: "Monthly Payroll",
    subtitle: "Automated monthly payroll generation & disbursements",
    url: "/payroll",
    icon: CreditCard,
    category: "Staff",
  },
  {
    title: "Operational Expenses",
    subtitle: "Record rent, utilities, maintenance & track payables",
    url: "/expenses",
    icon: CreditCard,
    category: "Finance",
  },
  {
    title: "Cash & Bank Accounts",
    subtitle: "Multi-account balances and double-entry transaction ledger",
    url: "/finance/accounts",
    icon: Building,
    category: "Finance",
  },
  {
    title: "14 Operational Reports",
    subtitle: "Collections, dues, commissions, payroll, P&L, balance",
    url: "/reports",
    icon: BarChart3,
    category: "System",
  },
  {
    title: "Manage Admins & Roles",
    subtitle: "RBAC and permission delegation",
    url: "/admins",
    icon: ShieldCheck,
    category: "System",
  },
];

interface GlobalSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearchModal({ open, onOpenChange }: GlobalSearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [studentResults, setStudentResults] = useState<
    Array<{
      _id: string;
      studentId: string;
      fullName: string;
      phone: string;
      email?: string;
      status: string;
    }>
  >([]);
  const [isPending, startTransition] = useTransition();
  const searchRequestId = useRef(0);

  // Reset when opened
  useEffect(() => {
    if (open) {
      setQuery("");
      setStudentResults([]);
    }
  }, [open]);

  // Handle live search
  useEffect(() => {
    const term = query.trim();
    const requestId = ++searchRequestId.current;

    if (term.length < 2) {
      setStudentResults([]);
      return;
    }

    const timer = setTimeout(() => {
      startTransition(async () => {
        try {
          const res = await getStudents({ search: term });
          if (searchRequestId.current === requestId) {
            setStudentResults(res.students || []);
          }
        } catch {
          if (searchRequestId.current === requestId) setStudentResults([]);
        }
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectStudent = (id: string) => {
    onOpenChange(false);
    router.push(`/students/${id}`);
  };

  const handleSelectAction = (url: string) => {
    onOpenChange(false);
    router.push(url);
  };

  const matchingActions = QUICK_ACTIONS.filter(
    (action) =>
      !query.trim() ||
      action.title.toLowerCase().includes(query.toLowerCase()) ||
      action.subtitle.toLowerCase().includes(query.toLowerCase()) ||
      action.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <DialogTitle className="sr-only">Quick ERP Command Search</DialogTitle>

        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200 dark:border-slate-800">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search students, admissions, batches, payroll, reports... (⌘K)"
            className="border-0 shadow-none focus-visible:ring-0 text-base bg-transparent p-0 placeholder:text-slate-400 dark:text-slate-100"
            autoFocus
          />
          {isPending && <Loader2 className="w-4 h-4 text-indigo-500 animate-spin shrink-0" />}
          <kbd className="hidden sm:inline-block text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Search Results */}
        <div className="max-h-[60vh] overflow-y-auto p-2 space-y-3">
          {/* Matching Students */}
          {studentResults.length > 0 && (
            <div className="space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1.5 flex items-center justify-between">
                <span>Matching Students</span>
                <span>({studentResults.length})</span>
              </p>
              {studentResults.map((stu) => (
                <button
                  key={stu._id}
                  onClick={() => handleSelectStudent(stu._id)}
                  type="button"
                  className="w-full text-left flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/70 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                          {stu.studentId}
                        </span>
                        <span className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                          {stu.fullName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        <span>{stu.phone}</span>
                        {stu.email && (
                          <>
                            <span>•</span>
                            <span className="truncate">{stu.email}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={stu.status === "Active" ? "default" : "outline"} className="text-[10px]">
                      {stu.status}
                    </Badge>
                    <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Quick Actions / Navigation */}
          {matchingActions.length > 0 && (
            <div className="space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1.5">
                {query.trim() ? "Quick Actions & Navigation" : "Suggested Operations"}
              </p>
              {matchingActions.slice(0, query.trim() ? 6 : 8).map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.url}
                    onClick={() => handleSelectAction(action.url)}
                    type="button"
                    className="w-full text-left flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/70 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/40 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <p className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                          {action.title}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {action.subtitle}
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] font-medium text-slate-400 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800/60 shrink-0">
                      {action.category}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {query.trim() && studentResults.length === 0 && matchingActions.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">No results found matching &quot;{query}&quot;</p>
              <p className="text-xs text-slate-400 mt-1">Try searching by student name, ID, phone, or ERP module.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
