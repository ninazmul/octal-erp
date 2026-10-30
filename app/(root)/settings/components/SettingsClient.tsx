"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Settings,
  BookOpen,
  ShieldCheck,
  ChevronRight,
  Sliders,
  CheckCircle2,
  Percent,
  Briefcase,
  ShieldAlert,
  Download,
  Smartphone,
} from "lucide-react";
import { usePermissions } from "@/components/providers/PermissionContext";
import { useEffect, useState } from "react";
import { getPWAInstallState, promptPWAInstall, subscribeToPWAInstall } from "@/components/shared/PWAInstallManager";

export default function SettingsClient() {
  const { isSuperAdmin } = usePermissions();
  const [installState, setInstallState] = useState({ canInstall: false, installed: false });
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const sync = () => setInstallState(getPWAInstallState());
    sync();
    const unsubscribe = subscribeToPWAInstall(sync);
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window));
    return unsubscribe;
  }, []);

  const handleInstall = async () => {
    await promptPWAInstall();
    setInstallState(getPWAInstallState());
  };

  if (!isSuperAdmin) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-8 max-w-md w-full text-center space-y-4">
          <div className="mx-auto p-3 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 w-fit">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Restricted Area
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            System settings and administration shortcuts are only available to Super Administrators.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-5xl mx-auto min-w-0">
      {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Octal ERP Settings
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Operations, academic policies, permissions and system architecture
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PWA Installation Card */}
        <div className="rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-4 sm:p-6 flex flex-col justify-between min-w-0">
          <div>
            <div className="p-3 w-fit rounded-2xl bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 mb-3">
              <Smartphone className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Install on your phone</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Add Octal ERP to your home screen for quick access and an app-like experience.
            </p>
            {installState.installed ? (
              <p className="mt-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400">Octal ERP is installed on this device.</p>
            ) : !installState.canInstall && isIOS ? (
              <p className="mt-3 text-xs text-slate-600 dark:text-slate-300">In Safari, tap Share, then choose “Add to Home Screen.”</p>
            ) : !installState.canInstall ? (
              <p className="mt-3 text-xs text-slate-600 dark:text-slate-300">Open your browser menu and choose “Install app” or “Add to Home screen.”</p>
            ) : null}
          </div>
          <div className="pt-4">
            <Button
              onClick={handleInstall}
              disabled={!installState.canInstall || installState.installed}
              className="w-full rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs justify-between disabled:opacity-60"
            >
              <span>{installState.installed ? "Already Installed" : installState.canInstall ? "Install Octal ERP" : "Use Browser Menu"}</span>
              {installState.canInstall && !installState.installed ? <Download className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Academic Settings Card */}
        <div className="rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-4 sm:p-6 flex flex-col justify-between min-w-0">
          <div>
            <div className="p-3 w-fit rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 mb-3">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Academic Operations
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Configure training subjects (Web Dev, Graphic Design, Marketing), course pricing structures, default duration and batch schedules.
            </p>
          </div>
          <div className="pt-4 flex flex-col sm:flex-row gap-2">
            <Link href="/academic/courses" className="flex-1">
              <Button className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs justify-between">
                <span>Manage Courses</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/academic/subjects">
              <Button variant="outline" className="w-full sm:w-auto rounded-xl border-slate-200 dark:border-slate-800 text-xs font-semibold">
                Subjects
              </Button>
            </Link>
          </div>
        </div>

        {/* Financial & Commissions Card */}
        <div className="rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-4 sm:p-6 flex flex-col justify-between min-w-0">
          <div>
            <div className="p-3 w-fit rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 mb-3">
              <Percent className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Commissions & Accounts
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Configure default instructor commission percentages, batch settlement reconciliation rules, and multi-channel cash/bank accounts.
            </p>
          </div>
          <div className="pt-4 flex flex-col sm:flex-row gap-2">
            <Link href="/finance/commissions" className="flex-1">
              <Button className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs justify-between">
                <span>Commission Rules</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/finance/accounts">
              <Button variant="outline" className="w-full sm:w-auto rounded-xl border-slate-200 dark:border-slate-800 text-xs font-semibold">
                Accounts
              </Button>
            </Link>
          </div>
        </div>

        {/* Staff & Payroll Card */}
        <div className="rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-4 sm:p-6 flex flex-col justify-between min-w-0">
          <div>
            <div className="p-3 w-fit rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 mb-3">
              <Briefcase className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Staff & Payroll Policies
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Employee master directory across academic, administrative, reception, and finance departments with monthly payroll automation.
            </p>
          </div>
          <div className="pt-4 flex gap-2">
            <Link href="/staff" className="flex-1">
              <Button variant="outline" className="w-full rounded-xl border-slate-200 dark:border-slate-800 text-xs font-semibold justify-between">
                <span>Staff Directory</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/payroll">
              <Button variant="outline" className="rounded-xl border-slate-200 dark:border-slate-800 text-xs font-semibold">
                Payroll
              </Button>
            </Link>
          </div>
        </div>

        {/* Admin Accounts Card */}
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="p-3 w-fit rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 mb-3">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Administrator Accounts
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Manage authorized administrative email accounts and configure role-based access control (Super Admin, Admin, Instructor, Receptionist, Accountant).
            </p>
          </div>
          <div className="pt-4">
            <Link href="/admins">
              <Button
                variant="outline"
                className="w-full rounded-xl border-slate-200 dark:border-slate-800 text-xs font-semibold justify-between"
              >
                <span>Manage Admin Accounts</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* System Information Card */}
        <div className="rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-4 sm:p-6 md:col-span-2 space-y-4 min-w-0">
          <div className="flex items-center gap-3">
            <div className="p-3 w-fit rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Octal ERP Architecture & Platform
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Core operational platform specifications, unified ledger, and database cluster
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-xs pt-2">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2">
              <span className="text-slate-400 block font-medium">Application</span>
              <div className="flex items-center gap-2">
                <div className="relative h-7 w-7 rounded-lg overflow-hidden border border-slate-200/60 dark:border-slate-800 bg-white">
                  <Image
                    src="/erp-logo.png"
                    alt="Octal ERP"
                    width={28}
                    height={28}
                    className="object-contain"
                  />
                </div>
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  Octal ERP
                </span>
              </div>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-3 h-3" /> v2.0 Enterprise
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
              <span className="text-slate-400 block font-medium">Data Storage</span>
              <span className="font-bold text-slate-900 dark:text-slate-100 text-sm block">
                MongoDB Cluster
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Mongoose 8 Atomic Sequences & Ledgers
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
              <span className="text-slate-400 block font-medium">Authentication</span>
              <span className="font-bold text-slate-900 dark:text-slate-100 text-sm block">
                Clerk Multi-Role RBAC
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Server-Enforced Access Guards
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
              <span className="text-slate-400 block font-medium">Deployment</span>
              <span className="font-bold text-slate-900 dark:text-slate-100 text-sm block">
                PWA & VPS Ready
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Service Worker & Offline Indicator
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
