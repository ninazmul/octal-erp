import { getEmployees } from "@/lib/actions/staff.actions";
import { getCurrentAdminProfile } from "@/lib/auth-guard";
import StaffDirectory from "@/components/staff/StaffDirectory";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const [profile, employees] = await Promise.all([
    getCurrentAdminProfile(),
    getEmployees(),
  ]);

  const isSuperAdmin = profile?.role === "super_admin";

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <StaffDirectory
        initialEmployees={employees}
        isSuperAdmin={isSuperAdmin}
      />
    </div>
  );
}

