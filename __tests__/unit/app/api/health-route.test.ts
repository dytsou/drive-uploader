import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const {
  mockCheckDatabaseHealth,
  mockCheckCacheHealth,
  mockCheckGoogleDriveHealth,
} = vi.hoisted(() => ({
  mockCheckDatabaseHealth: vi.fn(),
  mockCheckCacheHealth: vi.fn(),
  mockCheckGoogleDriveHealth: vi.fn(),
}));

vi.mock("@/lib/api-middleware", () => ({
  createPublicRoute: (
    handler: (context: { request: NextRequest }) => Promise<Response>,
  ) => {
    return async (request: NextRequest) => handler({ request });
  },
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("@/lib/services/health-service", () => ({
  checkDatabaseHealth: mockCheckDatabaseHealth,
  checkCacheHealth: mockCheckCacheHealth,
  checkGoogleDriveHealth: mockCheckGoogleDriveHealth,
}));

import { GET } from "@/app/api/health/route";

describe("app/api/health route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckDatabaseHealth.mockResolvedValue({
      status: "healthy",
      latency: 10,
      checkedAt: "2026-01-01T00:00:00.000Z",
    });
    mockCheckCacheHealth.mockResolvedValue({
      status: "healthy",
      latency: 10,
      checkedAt: "2026-01-01T00:00:00.000Z",
      backend: "redis",
    });
    mockCheckGoogleDriveHealth.mockResolvedValue({
      status: "healthy",
      latency: 10,
      checkedAt: "2026-01-01T00:00:00.000Z",
      quota: null,
    });
  });

  it("returns a minimal public health payload", async () => {
    const response = await GET(
      new NextRequest("http://localhost:3000/api/health"),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      status: "ok",
      timestamp: expect.any(String),
      services: {
        database: "healthy",
        cache: "healthy",
        google_drive: "healthy",
      },
    });
  });

  it("returns 503 when a critical dependency is unhealthy", async () => {
    mockCheckCacheHealth.mockResolvedValueOnce({
      status: "unhealthy",
      latency: 10,
      checkedAt: "2026-01-01T00:00:00.000Z",
      backend: "redis",
      error: "cache down",
    });

    const response = await GET(
      new NextRequest("http://localhost:3000/api/health"),
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        status: "error",
      }),
    );
  });
});
