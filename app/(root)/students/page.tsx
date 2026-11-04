import { getStudents } from "@/lib/actions/student.actions";
import { getCourses, getBatches } from "@/lib/actions/academic.actions";
import StudentDirectory from "@/components/students/StudentDirectory";
import { getCurrentAdminProfile } from "@/lib/auth-guard";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface StudentsPageProps {
  searchParams?: Promise<{ status?: string }>;
}

export default async function StudentsPage({ searchParams }: StudentsPageProps) {
  const profile = await getCurrentAdminProfile();
  if (!profile) redirect("/sign-in");

  const resolvedParams = searchParams ? await searchParams : {};
  const status = resolvedParams?.status;
  const canReadAcademic = profile.permissions?.academic !== "none";

  const [data, courses, batches] = await Promise.all([
    getStudents(),
    canReadAcademic ? getCourses({ status: "active" }) : Promise.resolve([]),
    canReadAcademic ? getBatches() : Promise.resolve([]),
  ]);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <StudentDirectory
        initialStudents={data?.students || []}
        total={data?.total || 0}
        initialPendingDiscountCount={data?.pendingDiscountCount || 0}
        initialStatusFilter={status || "all"}
        courses={courses || []}
        batches={batches || []}
      />
    </div>
  );
}

