import {
  getCourses,
  getBatches,
  getInstructorOptions,
} from "@/lib/actions/academic.actions";
import NewAdmissionForm from "@/components/students/NewAdmissionForm";
import { getCurrentAdminProfile } from "@/lib/auth-guard";
import { getAdmissionDiscountRequestForUse } from "@/lib/actions/student.actions";

export const dynamic = "force-dynamic";

interface NewStudentPageProps {
  searchParams: Promise<{ batchId?: string; discountRequestId?: string }>;
}

export default async function NewAdmissionPage({
  searchParams,
}: NewStudentPageProps) {
  const { batchId, discountRequestId } = await searchParams;

  const [courses, batches, instructors, profile, discountRequest] = await Promise.all([
    getCourses({ status: "active" }),
    getBatches(),
    getInstructorOptions(),
    getCurrentAdminProfile(),
    discountRequestId ? getAdmissionDiscountRequestForUse(discountRequestId) : Promise.resolve(null),
  ]);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <NewAdmissionForm
        courses={courses}
        batches={batches}
        instructors={instructors}
        preselectedBatchId={batchId}
        approvedDiscountRequest={discountRequest}
        isInstructor={profile?.role === "instructor"}
        currentEmployeeId={profile?.role === "instructor" ? profile.employeeId : undefined}
      />
    </div>
  );
}

