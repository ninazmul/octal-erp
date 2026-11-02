import {
  getCourses,
  getBatches,
  getInstructorOptions,
} from "@/lib/actions/academic.actions";
import NewAdmissionForm from "@/components/students/NewAdmissionForm";
import { getCurrentAdminProfile } from "@/lib/auth-guard";

export const dynamic = "force-dynamic";

interface NewStudentPageProps {
  searchParams: Promise<{ batchId?: string }>;
}

export default async function NewAdmissionPage({
  searchParams,
}: NewStudentPageProps) {
  const { batchId } = await searchParams;

  const [courses, batches, instructors, profile] = await Promise.all([
    getCourses({ status: "active" }),
    getBatches(),
    getInstructorOptions(),
    getCurrentAdminProfile(),
  ]);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <NewAdmissionForm
        courses={courses}
        batches={batches}
        instructors={instructors}
        preselectedBatchId={batchId}
        isInstructor={profile?.role === "instructor"}
        currentEmployeeId={profile?.role === "instructor" ? profile.employeeId : undefined}
      />
    </div>
  );
}

