import { getReportData } from "@/lib/actions/financialReport.actions";
import ReportsCenter from "@/components/reports/ReportsCenter";

export const dynamic = "force-dynamic";

interface ReportsPageProps {
  searchParams: Promise<{ report?: string }>;
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const { report } = await searchParams;
  const activeReport = report || "collections_dues";

  const initialData = await getReportData(activeReport);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <ReportsCenter
        initialReportId={activeReport}
        initialData={initialData}
      />
    </div>
  );
}

