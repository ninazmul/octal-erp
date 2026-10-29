import {
  getPayments,
  getEnrollmentsWithDues,
} from "@/lib/actions/payment.actions";
import { getAccounts } from "@/lib/actions/account.actions";
import PaymentManagement from "@/components/payments/PaymentManagement";

export const dynamic = "force-dynamic";

interface PaymentsPageProps {
  searchParams: Promise<{
    enrollmentId?: string;
    studentId?: string;
  }>;
}

export default async function PaymentsPage({
  searchParams,
}: PaymentsPageProps) {
  const { enrollmentId, studentId } = await searchParams;

  const [paymentData, enrollmentsWithDues, accounts] = await Promise.all([
    getPayments(),
    getEnrollmentsWithDues(),
    getAccounts(),
  ]);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <PaymentManagement
        initialPayments={paymentData.payments}
        total={paymentData.total}
        enrollmentsWithDues={enrollmentsWithDues}
        accounts={accounts}
        preselectedEnrollmentId={enrollmentId}
        preselectedStudentId={studentId}
      />
    </div>
  );
}

