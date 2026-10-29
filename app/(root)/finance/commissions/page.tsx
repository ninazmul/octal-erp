import {
  getCommissionEntries,
  getCommissionRules,
} from "@/lib/actions/commission.actions";
import {
  getInstructorOptions,
  getCourses,
} from "@/lib/actions/academic.actions";
import { getCurrentAdminProfile } from "@/lib/auth-guard";
import CommissionManagement from "@/components/finance/CommissionManagement";

export const dynamic = "force-dynamic";

export default async function CommissionsPage() {
  const [profile, entriesData, rules, instructors, courses] =
    await Promise.all([
      getCurrentAdminProfile(),
      getCommissionEntries(),
      getCommissionRules(),
      getInstructorOptions(),
      getCourses({ status: "active" }),
    ]);

  const isSuperAdmin = profile?.role === "super_admin";

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <CommissionManagement
        initialEntries={entriesData.entries}
        total={entriesData.total}
        rules={rules}
        instructors={instructors}
        courses={courses}
        isSuperAdmin={isSuperAdmin}
      />
    </div>
  );
}

