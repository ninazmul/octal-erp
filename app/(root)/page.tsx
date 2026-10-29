import { redirect } from "next/navigation";
import {
  getFinancialDashboardStats,
  getInstructorDashboardStats,
} from "@/lib/actions/financialReport.actions";
import OctalDashboardClient from "@/components/dashboard/OctalDashboardClient";
import { getCurrentAdminProfile } from "@/lib/auth-guard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const profile = await getCurrentAdminProfile();
  if (!profile) redirect("/sign-in");

  let stats = null;
  let instructorStats = null;

  if (profile.role === "instructor" && profile.employeeId) {
    instructorStats = await getInstructorDashboardStats(profile.employeeId);
  } else {
    stats = await getFinancialDashboardStats();
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <OctalDashboardClient
        stats={stats}
        instructorStats={instructorStats}
        role={profile.role}
        userName={profile.name || profile.email}
      />
    </div>
  );
}
