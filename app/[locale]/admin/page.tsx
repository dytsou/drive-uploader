import { requireAdminSession } from "@/lib/admin-auth";
import { AdminDashboard } from "@/app/[locale]/admin/AdminDashboard.client";

export default async function AdminPage() {
  const session = await requireAdminSession();

  return <AdminDashboard sessionEmail={session.user.email || ""} />;
}
