import { getStudents } from "@/lib/actions/student.actions";
import { getCourses, getBatches } from "@/lib/actions/academic.actions";
import StudentDirectory from "@/components/students/StudentDirectory";

export const dynamic = "force-dynamic";

interface StudentsPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function StudentsPage({ searchParams }: StudentsPageProps) {
  const { status } = await searchParams;
  const [data, courses, batches] = await Promise.all([
    getStudents(),
    getCourses({ status: "active" }),
    getBatches(),
  ]);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <StudentDirectory
        initialStudents={data.students}
        total={data.total}
        initialPendingDiscountCount={data.pendingDiscountCount || 0}
        initialStatusFilter={status || "all"}
        courses={courses}
        batches={batches}
      />
    </div>
  );
}

