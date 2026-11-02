import { getCurrentAdminProfile } from "@/lib/auth-guard";
import { redirect } from "next/navigation";
import { getAdmissionDiscountRequests } from "@/lib/actions/student.actions";
import DiscountRequests from "@/components/students/DiscountRequests";

export const dynamic = "force-dynamic";

export default async function DiscountRequestsPage() {
  const profile = await getCurrentAdminProfile();
  if (!profile || !["admin", "super_admin"].includes(profile.role)) redirect("/access-denied");
  const requests = await getAdmissionDiscountRequests();
  return <div className="p-4 sm:p-6 max-w-7xl mx-auto"><DiscountRequests requests={requests} /></div>;
}
