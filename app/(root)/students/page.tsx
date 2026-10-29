import { getStudents } from "@/lib/actions/student.actions";
import StudentDirectory from "@/components/students/StudentDirectory";

export const dynamic = "force-dynamic";

export default async function StudentsPage() {
  const data = await getStudents();

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <StudentDirectory
        initialStudents={data.students}
        total={data.total}
      />
    </div>
  );
}

