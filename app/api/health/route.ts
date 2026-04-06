import { NextResponse } from "next/server";
import { headers } from "next/headers";
import {
  checkCacheHealth,
  checkDatabaseHealth,
  checkGoogleDriveHealth,
} from "@/lib/services/health-service";
import { createPublicRoute } from "@/lib/api-middleware";

export const dynamic = "force-dynamic";

export const GET = createPublicRoute(
  async () => {
    const headersList = await headers();

    const [dbHealth, cacheHealth, driveHealth] = await Promise.all([
      checkDatabaseHealth(),
      checkCacheHealth(),
      checkGoogleDriveHealth(),
    ]);

    const tempHasError =
      dbHealth.status === "unhealthy" || cacheHealth.status === "unhealthy";

    const healthData = {
      status: tempHasError ? "error" : "ok",
      timestamp: new Date().toISOString(),
      services: {
        database: dbHealth.status,
        cache: cacheHealth.status,
        google_drive: driveHealth.status,
      },
    };

    return NextResponse.json(healthData, {
      status: tempHasError ? 503 : 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Vary: headersList.get("origin") ? "Origin" : "Accept",
      },
    });
  },
  { rateLimit: "API" },
);
