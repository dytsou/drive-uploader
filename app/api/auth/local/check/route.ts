import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get("local_storage_token");
  if (!cookie) return NextResponse.json({ authenticated: false });

  try {
    const SECRET = new TextEncoder().encode(
      process.env.NEXTAUTH_SECRET || "local-storage-secret-key-123",
    );
    await jwtVerify(cookie.value, SECRET);
    return NextResponse.json({ authenticated: true });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}
