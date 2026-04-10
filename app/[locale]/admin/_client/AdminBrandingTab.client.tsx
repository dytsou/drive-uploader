"use client";

import { TabsContent } from "@/components/ui/tabs";
import BrandingConfig from "@/components/admin/BrandingConfig";

export function AdminBrandingTab() {
  return (
    <TabsContent value="branding" className="mt-2">
      <BrandingConfig />
    </TabsContent>
  );
}
