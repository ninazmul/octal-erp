import {
  getBatches,
  getCourses,
  getInstructorOptions,
} from "@/lib/actions/academic.actions";
import BatchManagement from "@/components/academic/BatchManagement";

export const dynamic = "force-dynamic";

export default async function BatchesPage() {
  const [batches, courses, instructors] = await Promise.all([
    getBatches(),
    getCourses({ status: "active" }),
    getInstructorOptions(),
  ]);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <BatchManagement
        initialBatches={batches}
        courses={courses}
        instructors={instructors}
      />
    </div>
  );
}

