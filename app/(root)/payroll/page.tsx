import { getPayrollObligations } from "@/lib/actions/payroll.actions";
import { getAccounts } from "@/lib/actions/account.actions";
import { getCurrentAdminProfile } from "@/lib/auth-guard";
import PayrollManagement from "@/components/payroll/PayrollManagement";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface PayrollPageProps {
  searchParams: Promise<{ period?: string }>;
}

export default async function PayrollPage({ searchParams }: PayrollPageProps) {
  const { period } = await searchParams;
  const profile = await getCurrentAdminProfile();

  if (
    profile?.role !== "super_admin" &&
    profile?.role !== "accountant" &&
    !profile?.granularPermissions?.payroll_view_confidential
  ) {
    redirect("/access-denied");
  }

  const [data, accounts] = await Promise.all([
    getPayrollObligations({ period }),
    getAccounts(),
  ]);

  const isSuperAdmin = profile?.role === "super_admin";

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <PayrollManagement
        initialObligations={data.obligations}
        currentPeriod={data.period}
        totalObligations={data.totalObligations}
        totalPaid={data.totalPaid}
        totalDue={data.totalDue}
        accounts={accounts}
        isSuperAdmin={isSuperAdmin}
      />
    </div>
  );
}

