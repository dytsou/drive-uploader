import { NextResponse } from "next/server";
import { getPublicAppConfig } from "@/lib/app-config";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const config = await getPublicAppConfig();
    return NextResponse.json(config);
  } catch (error) {
    console.error("Public config fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch public config" },
      { status: 500 },
    );
  }
}
