import { requireAdminSession } from "@/lib/admin-auth";
import { AdminDashboard } from "./AdminDashboard.client";
import { getAdminStats } from "@/lib/admin-stats";
import { getAppConfig } from "@/lib/app-config";
import { kv } from "@/lib/kv";
import { REDIS_KEYS } from "@/lib/constants";

export default async function AdminPage() {
  const session = await requireAdminSession();

  const [stats, config, adminEmails, editorEmails] = await Promise.all([
    getAdminStats(),
    getAppConfig(),
    kv.smembers(REDIS_KEYS.ADMIN_USERS).then((v) => (v || []).filter(Boolean)),
    kv
      .smembers(REDIS_KEYS.ADMIN_EDITORS)
      .then((v) => (v || []).filter(Boolean)),
  ]);

  return (
    <AdminDashboard
      sessionEmail={session.user.email || ""}
      initialData={{
        stats,
        config,
        adminEmails: adminEmails.sort(),
        editorEmails: editorEmails.sort(),
      }}
    />
  );
}
