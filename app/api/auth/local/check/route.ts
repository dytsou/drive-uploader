import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { getLocalStorageAuthSecret } from "@/lib/local-auth-secret";

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get("local_storage_token");
  if (!cookie) return NextResponse.json({ authenticated: false });

  const secret = getLocalStorageAuthSecret();
  if (!secret) {
    return NextResponse.json({ authenticated: false });
  }

  try {
    await jwtVerify(cookie.value, secret);
    return NextResponse.json({ authenticated: true });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}
