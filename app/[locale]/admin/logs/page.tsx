import { requireAdminSession } from "@/lib/admin-auth";
import { getLiveLogsAction } from "@/app/actions/admin";
import ActivityLogPageClient, {
  type LogEntry,
} from "@/app/[locale]/admin/_client/ActivityLogPage.client";

export default async function ActivityLogPage() {
  await requireAdminSession();
  const data = await getLiveLogsAction({ offset: 0 });
  return (
    <ActivityLogPageClient
      initialLogs={((data.logs || []) as unknown as LogEntry[]) || []}
    />
  );
}
