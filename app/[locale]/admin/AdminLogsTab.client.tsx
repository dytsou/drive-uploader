"use client";

import { TabsContent } from "@/components/ui/tabs";
import ActivityLogDashboard from "@/components/admin/ActivityLogDashboard";

export function AdminLogsTab() {
  return (
    <TabsContent value="logs" className="mt-2">
      <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
        <ActivityLogDashboard />
      </div>
    </TabsContent>
  );
}
