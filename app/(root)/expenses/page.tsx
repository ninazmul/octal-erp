import { getExpenses } from "@/lib/actions/expense.actions";
import { getAccounts } from "@/lib/actions/account.actions";
import { getCurrentAdminProfile } from "@/lib/auth-guard";
import ExpenseManagement from "@/components/expenses/ExpenseManagement";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  const [profile, expenseData, accounts] = await Promise.all([
    getCurrentAdminProfile(),
    getExpenses(),
    getAccounts(),
  ]);

  const isAuthorized =
    profile?.role === "super_admin" ||
    profile?.role === "admin" ||
    profile?.role === "accountant";

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <ExpenseManagement
        initialExpenses={expenseData.expenses}
        total={expenseData.total}
        totalIncurred={expenseData.totalIncurred}
        totalPaid={expenseData.totalPaid}
        totalDue={expenseData.totalDue}
        accounts={accounts}
        isAuthorized={isAuthorized}
      />
    </div>
  );
}

