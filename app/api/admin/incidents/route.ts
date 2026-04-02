import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminRoute } from "@/lib/api-middleware";
import {
  incidentStatusSchema,
  listIncidents,
  updateIncidentStatus,
} from "@/lib/incident-monitor";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  status: z
    .union([incidentStatusSchema, z.literal("all")])
    .optional()
    .default("all"),
});

const patchSchema = z.object({
  id: z.string().min(1),
  status: incidentStatusSchema,
});

export const GET = createAdminRoute(
  async ({ query }) => {
    const { incidents, total, openCount } = await listIncidents({
      limit: query.limit,
      offset: query.offset,
      status: query.status,
    });

    return NextResponse.json({
      incidents,
      total,
      openCount,
    });
  },
  { querySchema },
);

export const PATCH = createAdminRoute(
  async ({ body, session }) => {
    const updated = await updateIncidentStatus({
      id: body.id,
      status: body.status,
      actor: session.user.email || undefined,
    });

    if (!updated) {
      return NextResponse.json(
        { error: "Incident tidak ditemukan." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      incident: updated,
    });
  },
  { bodySchema: patchSchema },
);
