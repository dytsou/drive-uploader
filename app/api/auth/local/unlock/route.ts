import { NextRequest, NextResponse } from "next/server";
import { getAppConfig } from "@/lib/app-config";
import { SignJWT } from "jose";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

const SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "local-storage-secret-key-123",
);

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();
    const config = await getAppConfig();

    const dbProtected = await db.protectedFolder.findUnique({
      where: { folderId: "local-storage:" },
    });

    let isPasswordCorrect = false;

    if (dbProtected && dbProtected.password) {
      isPasswordCorrect = await bcrypt.compare(password, dbProtected.password);
    } else if (config.localStorageAuthEnabled && config.localStoragePassword) {
      isPasswordCorrect = password === config.localStoragePassword;
    } else {
      return NextResponse.json({ success: true, message: "Not protected" });
    }

    if (isPasswordCorrect) {
      const token = await new SignJWT({ unlocked: true })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("24h")
        .sign(SECRET);

      const response = NextResponse.json({ success: true });
      const isLocal =
        req.nextUrl.hostname === "localhost" ||
        req.nextUrl.hostname === "127.0.0.1" ||
        req.nextUrl.hostname.startsWith("192.168.");
      const isSecure = process.env.NODE_ENV === "production" && !isLocal;
      response.cookies.set("local_storage_token", token, {
        httpOnly: true,
        secure: isSecure,
        sameSite: "lax",
        maxAge: 60 * 60 * 24,
        path: "/",
      });

      return response;
    }

    return NextResponse.json({ error: "Password salah" }, { status: 401 });
  } catch (error) {
    console.error("[LocalAuth] Unlock error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
