import { getAccounts, getLedgerEntries } from "@/lib/actions/account.actions";
import { getCurrentAdminProfile } from "@/lib/auth-guard";
import AccountManagement from "@/components/finance/AccountManagement";

export const dynamic = "force-dynamic";

export default async function AccountsPage() {
  const [profile, accounts, ledgerEntries] = await Promise.all([
    getCurrentAdminProfile(),
    getAccounts(),
    getLedgerEntries({ limit: 100 }),
  ]);

  const isSuperAdmin = profile?.role === "super_admin";

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <AccountManagement
        initialAccounts={accounts}
        initialLedgerEntries={ledgerEntries}
        isSuperAdmin={isSuperAdmin}
      />
    </div>
  );
}

