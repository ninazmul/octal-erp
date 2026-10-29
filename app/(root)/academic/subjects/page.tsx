import { getSubjects } from "@/lib/actions/academic.actions";
import SubjectManagement from "@/components/academic/SubjectManagement";

export const dynamic = "force-dynamic";

export default async function SubjectsPage() {
  const subjects = await getSubjects();

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <SubjectManagement initialSubjects={subjects} />
    </div>
  );
}

