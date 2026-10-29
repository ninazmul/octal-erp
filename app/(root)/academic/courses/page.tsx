import {
  getCourses,
  getSubjects,
  getInstructorOptions,
} from "@/lib/actions/academic.actions";
import CourseManagement from "@/components/academic/CourseManagement";

export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  const [courses, subjects, instructors] = await Promise.all([
    getCourses(),
    getSubjects({ status: "active" }),
    getInstructorOptions(),
  ]);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <CourseManagement
        initialCourses={courses}
        subjects={subjects}
        instructors={instructors}
      />
    </div>
  );
}

