import type { AppConfig } from "@/lib/app-config.shared";
import type { AdminStats } from "@/lib/adminStats";
import type { AccessRequestRecord } from "@/lib/link-payloads";
import type { ManualDriveRecord } from "@/lib/manual-drives";

export type AdminDashboardInitialData = {
  stats?: AdminStats;
  config?: AppConfig;
  adminEmails?: string[];
  editorEmails?: string[];
  protectedFolders?: Record<string, { id: string; password: string }>;
  userAccessPermissions?: Record<string, string[]>;
  accessRequests?: AccessRequestRecord[];
  manualDrives?: ManualDriveRecord[];
};

export type AdminDashboardProps = {
  sessionEmail: string;
  initialData?: AdminDashboardInitialData;
};
