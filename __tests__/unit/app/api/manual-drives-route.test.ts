import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockKvGet } = vi.hoisted(() => ({
  mockKvGet: vi.fn(),
}));

vi.mock("@/lib/kv", () => ({
  kv: {
    get: mockKvGet,
  },
}));

import { GET } from "@/app/api/manual-drives/route";
import { MANUAL_DRIVES_KEY } from "@/lib/manual-drives";

describe("app/api/manual-drives route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns sanitized manual drives", async () => {
    mockKvGet.mockResolvedValue([
      { id: "drive_1", name: "Drive One", isProtected: true },
      { id: "", name: "Invalid Drive" },
      { id: "drive-2", name: "Drive Two" },
    ]);

    const response = await GET();

    expect(mockKvGet).toHaveBeenCalledWith(MANUAL_DRIVES_KEY);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([
      { id: "drive_1", name: "Drive One", isProtected: true },
      { id: "drive-2", name: "Drive Two" },
    ]);
  });

  it("returns 500 when reading manual drives fails", async () => {
    mockKvGet.mockRejectedValue(new Error("redis down"));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await GET();

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Failed to fetch manual drives",
    });
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });
});
