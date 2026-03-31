import { describe, it, expect, afterEach } from "vitest";
import { getLocalStorageAuthSecret } from "@/lib/local-auth-secret";

const ORIGINAL_SECRET = process.env.NEXTAUTH_SECRET;

describe("lib/local-auth-secret", () => {
  afterEach(() => {
    process.env.NEXTAUTH_SECRET = ORIGINAL_SECRET;
  });

  it("returns null when NEXTAUTH_SECRET is missing", () => {
    delete process.env.NEXTAUTH_SECRET;
    expect(getLocalStorageAuthSecret()).toBeNull();
  });

  it("returns null when NEXTAUTH_SECRET is too short", () => {
    process.env.NEXTAUTH_SECRET = "short-secret";
    expect(getLocalStorageAuthSecret()).toBeNull();
  });

  it("returns encoded secret when NEXTAUTH_SECRET is valid", () => {
    process.env.NEXTAUTH_SECRET = "a".repeat(32);
    const secret = getLocalStorageAuthSecret();
    expect(secret).not.toBeNull();
    expect(ArrayBuffer.isView(secret)).toBe(true);
    expect(secret?.length).toBe(32);
  });
});
