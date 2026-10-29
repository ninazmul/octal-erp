import { getSettlements } from "@/lib/actions/commission.actions";
import { getBatches, getInstructorOptions } from "@/lib/actions/academic.actions";
import { getAccounts } from "@/lib/actions/account.actions";
import { getCurrentAdminProfile } from "@/lib/auth-guard";
import SettlementManagement from "@/components/finance/SettlementManagement";

export const dynamic = "force-dynamic";

export default async function SettlementsPage() {
  const [profile, settlements, batches, instructors, accounts] =
    await Promise.all([
      getCurrentAdminProfile(),
      getSettlements(),
      getBatches(),
      getInstructorOptions(),
      getAccounts(),
    ]);

  const isSuperAdmin = profile?.role === "super_admin";

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <SettlementManagement
        initialSettlements={settlements}
        batches={batches}
        instructors={instructors}
        accounts={accounts}
        isSuperAdmin={isSuperAdmin}
      />
    </div>
  );
}

