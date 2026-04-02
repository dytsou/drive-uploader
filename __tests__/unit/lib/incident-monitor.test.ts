import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockKv, mockSendMail } = vi.hoisted(() => ({
  mockKv: {
    get: vi.fn(),
    set: vi.fn(),
    zrange: vi.fn(),
    hget: vi.fn(),
    hset: vi.fn(),
    hdel: vi.fn(),
    zadd: vi.fn(),
    zcard: vi.fn(),
    hgetall: vi.fn(),
    smembers: vi.fn(),
  },
  mockSendMail: vi.fn(),
}));

vi.mock("@/lib/kv", () => ({
  kv: mockKv,
}));

vi.mock("@/lib/mailer", () => ({
  sendMail: mockSendMail,
}));

import {
  evaluateIncidentRules,
  listIncidents,
  updateIncidentStatus,
} from "@/lib/incident-monitor";

describe("lib/incident-monitor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(Date, "now").mockReturnValue(1_700_000_000_000);

    mockKv.get.mockResolvedValue(null);
    mockKv.set.mockResolvedValue("OK");
    mockKv.zrange.mockResolvedValue([]);
    mockKv.hget.mockResolvedValue(null);
    mockKv.hset.mockResolvedValue(1);
    mockKv.hdel.mockResolvedValue(1);
    mockKv.zadd.mockResolvedValue(1);
    mockKv.zcard.mockResolvedValue(0);
    mockKv.hgetall.mockResolvedValue({});
    mockKv.smembers.mockResolvedValue(["admin@example.com"]);
    mockSendMail.mockResolvedValue(undefined);
  });

  it("creates incidents from security/auth/download alert rules", async () => {
    const securityEvent = {
      id: "evt-security-1",
      type: "security:alert",
      message: "Unauthorized access attempt detected",
      severity: "error",
      timestamp: 1_700_000_000_000 - 10_000,
      category: "security",
      source: "activity-log",
      payload: { reason: "unauthorized_access" },
    };

    const authFailures = Array.from({ length: 5 }).map((_, idx) => ({
      id: `evt-auth-${idx}`,
      type: "auth:failure",
      message: "Failed to authenticate",
      severity: "error",
      timestamp: 1_700_000_000_000 - 30_000 + idx * 1000,
      category: "auth",
      source: "activity-log",
      userEmail: "attacker@example.com",
      payload: { reason: "invalid_password" },
    }));

    const downloadEvents = Array.from({ length: 45 }).map((_, idx) => ({
      id: `evt-download-${idx}`,
      type: "file:download",
      message: "downloaded file",
      severity: "info",
      timestamp: 1_700_000_000_000 - 20_000 + idx * 100,
      category: "file",
      source: "activity-log",
    }));

    mockKv.zrange
      .mockResolvedValueOnce([
        securityEvent,
        authFailures[0],
        downloadEvents[0],
      ])
      .mockResolvedValueOnce(authFailures)
      .mockResolvedValueOnce(downloadEvents);

    const summary = await evaluateIncidentRules();

    expect(summary.processedEvents).toBe(3);
    expect(summary.createdIncidents).toBe(3);
    expect(summary.updatedIncidents).toBe(0);
    expect(mockKv.hset).toHaveBeenCalled();
    expect(mockKv.zadd).toHaveBeenCalled();
    expect(mockSendMail).toHaveBeenCalled();
  });

  it("updates incident status and clears open index when resolved", async () => {
    mockKv.hget.mockImplementation(async (key: string, field: string) => {
      if (key.endsWith(":data") && field === "incident-1") {
        return {
          id: "incident-1",
          ruleId: "auth_failure_burst",
          fingerprint: "auth-failure:user@example.com",
          title: "Auth failure burst",
          description: "desc",
          severity: "error",
          status: "open",
          createdAt: 1_700_000_000_000 - 1000,
          updatedAt: 1_700_000_000_000 - 1000,
          lastTriggeredAt: 1_700_000_000_000 - 1000,
          triggerCount: 1,
          sourceEventIds: ["evt-1"],
          cooldownSeconds: 900,
        };
      }
      return null;
    });

    const updated = await updateIncidentStatus({
      id: "incident-1",
      status: "resolved",
      actor: "admin@example.com",
    });

    expect(updated).toBeTruthy();
    expect(updated?.status).toBe("resolved");
    expect(mockKv.hdel).toHaveBeenCalled();
    expect(mockKv.hset).toHaveBeenCalled();
  });

  it("lists incidents with timeline ordering", async () => {
    mockKv.zrange.mockResolvedValue(["incident-1"]);
    mockKv.hget.mockResolvedValue({
      id: "incident-1",
      ruleId: "security_alert_immediate",
      fingerprint: "security:unauthorized_access",
      title: "Security alert detected",
      description: "desc",
      severity: "critical",
      status: "open",
      createdAt: 1_700_000_000_000 - 1000,
      updatedAt: 1_700_000_000_000 - 1000,
      lastTriggeredAt: 1_700_000_000_000 - 1000,
      triggerCount: 1,
      sourceEventIds: ["evt-1"],
      cooldownSeconds: 600,
    });
    mockKv.zcard.mockResolvedValue(1);
    mockKv.hgetall.mockResolvedValue({
      "security_alert_immediate:security:unauthorized_access": "incident-1",
    });

    const result = await listIncidents({ limit: 10, status: "all" });

    expect(result.total).toBe(1);
    expect(result.openCount).toBe(1);
    expect(result.incidents).toHaveLength(1);
    expect(result.incidents[0].id).toBe("incident-1");
  });
});
