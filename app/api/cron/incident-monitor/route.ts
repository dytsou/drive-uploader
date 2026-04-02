import { NextResponse } from "next/server";
import { createCronRoute } from "@/lib/api-middleware";
import { evaluateIncidentRules } from "@/lib/incident-monitor";

export const dynamic = "force-dynamic";

export const GET = createCronRoute(async () => {
  try {
    const summary = await evaluateIncidentRules();
    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to evaluate incidents.",
      },
      { status: 500 },
    );
  }
});
