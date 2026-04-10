import type { AppConfig } from "@/lib/app-config.shared";
import type { AdminStats } from "@/lib/adminStats";

export type AdminDashboardInitialData = {
  stats?: AdminStats;
  config?: AppConfig;
  adminEmails?: string[];
  editorEmails?: string[];
};

export type AdminDashboardProps = {
  sessionEmail: string;
  initialData?: AdminDashboardInitialData;
};
