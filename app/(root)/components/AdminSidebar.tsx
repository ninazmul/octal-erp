"use client";

import { useEffect } from "react";
import Image from "next/image";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

import {
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  Layers,
  Users,
  UserPlus,
  Receipt,
  Percent,
  FileCheck,
  Briefcase,
  Wallet,
  CreditCard,
  Building,
  BarChart3,
  ShieldCheck,
  History,
  Settings,
} from "lucide-react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePermissions } from "@/components/providers/PermissionContext";
import { AppModule } from "@/types";

interface SidebarItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  module: AppModule;
  /** If true, only super_admin can see this item */
  superAdminOnly?: boolean;
}

interface SidebarSection {
  label: string;
  items: SidebarItem[];
}

const sidebarSections: SidebarSection[] = [
  {
    label: "Overview",
    items: [
      {
        title: "Dashboard",
        url: "/",
        icon: LayoutDashboard,
        module: "dashboard",
      },
    ],
  },
  {
    label: "Academic Management",
    items: [
      {
        title: "Subjects",
        url: "/academic/subjects",
        icon: GraduationCap,
        module: "academic",
      },
      {
        title: "Courses",
        url: "/academic/courses",
        icon: BookOpen,
        module: "academic",
      },
      {
        title: "Batches",
        url: "/academic/batches",
        icon: Layers,
        module: "academic",
      },
    ],
  },
  {
    label: "Students & Admissions",
    items: [
      {
        title: "Student Directory",
        url: "/students",
        icon: Users,
        module: "students",
      },
      {
        title: "New Admission",
        url: "/students/new",
        icon: UserPlus,
        module: "students",
      },
    ],
  },
  {
    label: "Financial Collections",
    items: [
      {
        title: "Student Payments",
        url: "/payments",
        icon: Receipt,
        module: "payments",
      },
    ],
  },
  {
    label: "Commissions & Payouts",
    items: [
      {
        title: "Commission Entries",
        url: "/finance/commissions",
        icon: Percent,
        module: "commissions",
      },
      {
        title: "Batch Settlements",
        url: "/finance/settlements",
        icon: FileCheck,
        module: "commissions",
      },
    ],
  },
  {
    label: "Staff & Payroll",
    items: [
      {
        title: "Staff Directory",
        url: "/staff",
        icon: Briefcase,
        module: "staff",
      },
      {
        title: "Monthly Payroll",
        url: "/payroll",
        icon: Wallet,
        module: "payroll",
      },
    ],
  },
  {
    label: "Expenses & Accounts",
    items: [
      {
        title: "Expenses",
        url: "/expenses",
        icon: CreditCard,
        module: "expenses",
      },
      {
        title: "Cash & Accounts",
        url: "/finance/accounts",
        icon: Building,
        module: "finance",
      },
    ],
  },
  {
    label: "Reports & Analytics",
    items: [
      {
        title: "Reports Center",
        url: "/reports",
        icon: BarChart3,
        module: "reports",
      },
    ],
  },
  {
    label: "Administration",
    items: [
      {
        title: "Manage Admins",
        url: "/admins",
        icon: ShieldCheck,
        module: "admins",
        superAdminOnly: true,
      },
      {
        title: "Activity Logs",
        url: "/activity-logs",
        icon: History,
        module: "activity_logs",
        superAdminOnly: true,
      },
      {
        title: "Settings",
        url: "/settings",
        icon: Settings,
        module: "settings",
        superAdminOnly: true,
      },
    ],
  },
];

const AppSidebar = () => {
  const currentPath = usePathname();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const { canRead, isSuperAdmin, isInstructor } = usePermissions();
  const isCollapsed = state === "collapsed";

  // Automatically close mobile sidebar menu on route change
  useEffect(() => {
    if (isMobile) {
      setOpenMobile(false);
    }
  }, [currentPath, isMobile, setOpenMobile]);

  // Filter sections and items based on module + super-admin-only gates
  const visibleSections = sidebarSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        // Strongest gate first: strictly super-admin-only items
        if (item.superAdminOnly && !isSuperAdmin) return false;

        // Instructor scope restriction:
        if (isInstructor) {
          // Instructors only see dashboard, academic (view), students (assigned), and their commissions
          if (["staff", "payroll", "expenses", "finance", "reports", "admins", "settings", "payments"].includes(item.module)) {
            return false;
          }
          if (item.url === "/students/new") return false;
        }

        if (item.module !== "dashboard" && !canRead(item.module)) return false;
        return true;
      }),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <Sidebar
      className="font-sans border-r border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0a0e1a]"
      collapsible="icon"
    >
      {/* Brand Header */}
      <SidebarHeader className="p-0">
        <div className="px-4 py-3.5 mb-1 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 group-data-[collapsible=icon]:hidden">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg border border-slate-200/60 dark:border-slate-800 bg-white shadow-xs">
              <Image
                src="/erp-logo.png"
                alt="Octal ERP"
                width={32}
                height={32}
                className="object-contain"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white leading-tight">
                OCTAL ERP
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-none">
                Academic & Operations
              </span>
            </div>
          </Link>
        </div>
        <div className="hidden group-data-[collapsible=icon]:flex items-center justify-center py-3 mb-1 border-b border-slate-100 dark:border-slate-800">
          <Link href="/" className="flex items-center justify-center">
            <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg border border-slate-200/60 dark:border-slate-800 bg-white shadow-xs">
              <Image
                src="/erp-logo.png"
                alt="Octal ERP"
                width={32}
                height={32}
                className="object-contain"
                priority
              />
            </div>
          </Link>
        </div>
      </SidebarHeader>

      <SidebarContent className="py-2">
        {visibleSections.map((section) => (
          <SidebarGroup
            key={section.label}
            className="py-1 group-data-[collapsible=icon]:py-0.5"
          >
            <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-600 px-4 mb-1 group-data-[collapsible=icon]:hidden">
              {section.label}
            </SidebarGroupLabel>

            <SidebarGroupContent>
              <SidebarMenu className="space-y-0.5 px-2.5 group-data-[collapsible=icon]:px-1">
                {section.items.map((item) => {
                  const isActive =
                    item.url === "/"
                      ? currentPath === item.url
                      : currentPath === item.url ||
                        currentPath.startsWith(`${item.url}/`);

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        tooltip={item.title}
                        isActive={isActive}
                        size="default"
                        className={`relative rounded-xl font-medium text-[13px] transition-all duration-150 py-2 ${
                          isActive
                            ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200/60 dark:border-indigo-800/50 shadow-sm"
                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        }`}
                      >
                        <Link
                          href={item.url}
                          onClick={() => {
                            if (isMobile) {
                              setOpenMobile(false);
                            }
                          }}
                        >
                          <span className="flex items-center gap-2.5 w-full group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0">
                            <item.icon
                              className={`w-4 h-4 shrink-0 transition-colors ${
                                isActive
                                  ? "text-indigo-600 dark:text-indigo-400"
                                  : "text-slate-400 dark:text-slate-500"
                              }`}
                            />
                            <span
                              className={`group-data-[collapsible=icon]:hidden truncate`}
                            >
                              {item.title}
                            </span>
                          </span>

                          {isActive && !isCollapsed && (
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-indigo-600 dark:bg-indigo-400 rounded-r-full" />
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
};

export default AppSidebar;
