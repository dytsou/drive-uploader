import { NextResponse } from "next/server";
import { createAdminRoute } from "@/lib/api-middleware";
import { evaluateIncidentRules } from "@/lib/incident-monitor";

export const dynamic = "force-dynamic";

export const POST = createAdminRoute(async () => {
  const summary = await evaluateIncidentRules();
  return NextResponse.json({
    success: true,
    summary,
  });
});
