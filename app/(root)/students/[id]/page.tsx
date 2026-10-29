import { getStudentById } from "@/lib/actions/student.actions";
import StudentProfileView from "@/components/students/StudentProfileView";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface StudentDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function StudentDetailPage({
  params,
}: StudentDetailPageProps) {
  const { id } = await params;

  try {
    const student = await getStudentById(id);
    if (!student) return notFound();

    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <StudentProfileView student={student} />
      </div>
    );
  } catch {
    return notFound();
  }
}

