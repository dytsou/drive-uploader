"use client";

import { TabsContent } from "@/components/ui/tabs";
import AnalyticsDashboard from "@/components/admin/AnalyticsDashboard";

export function AdminAnalyticsTab() {
  return (
    <TabsContent value="analytics" className="mt-2">
      <div className="bg-card border rounded-xl overflow-hidden shadow-sm p-4 sm:p-6">
        <AnalyticsDashboard />
      </div>
    </TabsContent>
  );
}
