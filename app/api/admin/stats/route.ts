import { NextResponse } from "next/server";
import { createAdminRoute } from "@/lib/api-middleware";
import type { AdminStats } from "@/lib/adminStats";
import { getAdminStats } from "@/lib/admin-stats";
export const dynamic = "force-dynamic";
export const GET = createAdminRoute(async () => {
  try {
    const stats: AdminStats = await getAdminStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Gagal mengambil statistik admin:", error);
    return NextResponse.json(
      { error: "Gagal mengambil statistik." },
      { status: 500 },
    );
  }
});
