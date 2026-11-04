import {
  getCourses,
  getBatches,
} from "@/lib/actions/academic.actions";
import NewAdmissionForm from "@/components/students/NewAdmissionForm";
import { getAdmissionDiscountRequestForUse } from "@/lib/actions/student.actions";
import { getCurrentAdminProfile } from "@/lib/auth-guard";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface NewStudentPageProps {
  searchParams: Promise<{ batchId?: string; discountRequestId?: string }>;
}

export default async function NewAdmissionPage({
  searchParams,
}: NewStudentPageProps) {
  const profile = await getCurrentAdminProfile();
  if (!profile) redirect("/sign-in");
  if (
    profile.permissions?.students === "none" ||
    profile.permissions?.academic === "none" ||
    !profile.granularPermissions?.student_admit
  ) {
    redirect("/access-denied");
  }

  const { batchId, discountRequestId } = await searchParams;

  const [courses, batches, discountRequest] = await Promise.all([
    getCourses({ status: "active" }),
    getBatches(),
    discountRequestId ? getAdmissionDiscountRequestForUse(discountRequestId) : Promise.resolve(null),
  ]);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <NewAdmissionForm
        courses={courses}
        batches={batches}
        preselectedBatchId={batchId}
        approvedDiscountRequest={discountRequest}
      />
    </div>
  );
}

