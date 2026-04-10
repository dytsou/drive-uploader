import { requireAdminSession } from "@/lib/admin-auth";
import { getAuditLogsAction } from "@/app/actions/admin";
import AuditDashboardClient from "@/app/[locale]/admin/_client/AuditDashboard.client";

export default async function AuditDashboard() {
  await requireAdminSession();
  const logs = await getAuditLogsAction();
  return <AuditDashboardClient initialLogs={logs} />;
}
