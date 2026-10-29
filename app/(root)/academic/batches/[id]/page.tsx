import { getBatchById } from "@/lib/actions/academic.actions";
import BatchDetailsView from "@/components/academic/BatchDetailsView";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface BatchPageProps {
  params: Promise<{ id: string }>;
}

export default async function BatchDetailPage({ params }: BatchPageProps) {
  const { id } = await params;

  try {
    const batch = await getBatchById(id);
    if (!batch) return notFound();

    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <BatchDetailsView batch={batch} />
      </div>
    );
  } catch {
    return notFound();
  }
}

