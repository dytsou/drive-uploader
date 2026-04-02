import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { mockEvaluateIncidentRules } = vi.hoisted(() => ({
  mockEvaluateIncidentRules: vi.fn(),
}));

vi.mock("@/lib/incident-monitor", () => ({
  evaluateIncidentRules: mockEvaluateIncidentRules,
}));

import { GET } from "@/app/api/cron/incident-monitor/route";

function createCronRequest(authHeader?: string) {
  return new NextRequest("http://localhost:3000/api/cron/incident-monitor", {
    headers: authHeader ? { authorization: authHeader } : undefined,
  });
}

describe("app/api/cron/incident-monitor route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "cron-secret-test";
    mockEvaluateIncidentRules.mockResolvedValue({
      since: 100,
      until: 200,
      processedEvents: 12,
      createdIncidents: 2,
      updatedIncidents: 3,
      skippedCooldown: 1,
    });
  });

  it("returns 401 when authorization header is missing", async () => {
    const response = await GET(createCronRequest());
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      error: "Unauthorized",
    });
  });

  it("returns 200 with evaluation summary when authorized", async () => {
    const response = await GET(
      createCronRequest(`Bearer ${process.env.CRON_SECRET}`),
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      summary: {
        since: 100,
        until: 200,
        processedEvents: 12,
        createdIncidents: 2,
        updatedIncidents: 3,
        skippedCooldown: 1,
      },
    });
  });

  it("returns 500 when evaluator throws", async () => {
    mockEvaluateIncidentRules.mockRejectedValue(new Error("boom"));

    const response = await GET(
      createCronRequest(`Bearer ${process.env.CRON_SECRET}`),
    );
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "boom",
    });
  });
});
