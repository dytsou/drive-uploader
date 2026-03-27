export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { createPublicRoute } from "@/lib/api-middleware";
import { invalidateAccessToken } from "@/lib/drive";
import { isAppConfigured } from "@/lib/config";
import { z } from "zod";

const setupFinishSchema = z.object({
  clientId: z.string().min(1),
  clientSecret: z.string().min(1),
  authCode: z.string().min(1),
  redirectUri: z.string().url(),
  rootFolderId: z.string().min(1),
});

export const POST = createPublicRoute(
  async ({ body }) => {
    try {
      const isConfigured = await isAppConfigured();
      if (isConfigured) {
        return NextResponse.json(
          {
            error:
              "Setup has already been completed. Reset database to re-configure.",
          },
          { status: 403 },
        );
      }

      const { clientId, clientSecret, authCode, redirectUri, rootFolderId } =
        body;

      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code: authCode,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });

      const tokenData = await tokenResponse.json();

      if (!tokenResponse.ok) {
        return NextResponse.json(
          { error: tokenData.error_description || "Gagal menukar token" },
          { status: 400 },
        );
      }

      if (!tokenData.refresh_token) {
        return NextResponse.json(
          {
            error:
              "Refresh Token tidak diterima. Pastikan akses di-revoke dulu atau gunakan prompt=consent.",
          },
          { status: 400 },
        );
      }

      const envPath = path.join(process.cwd(), ".env");
      let envContent = "";

      try {
        if (fs.existsSync(envPath)) {
          envContent = fs.readFileSync(envPath, "utf-8");
        }
      } catch (e) {
        console.error("Gagal membaca .env:", e);
      }

      const updateEnv = (key: string, value: string) => {
        const regex = new RegExp(`^${key}=.*$`, "m");
        if (regex.test(envContent)) {
          envContent = envContent.replace(regex, `${key}="${value}"`);
        } else {
          envContent += `\n${key}="${value}"`;
        }
      };

      updateEnv("GOOGLE_CLIENT_ID", clientId);
      updateEnv("GOOGLE_CLIENT_SECRET", clientSecret);
      updateEnv("GOOGLE_REFRESH_TOKEN", tokenData.refresh_token);
      updateEnv("NEXT_PUBLIC_ROOT_FOLDER_ID", rootFolderId);

      let writeSuccess = false;
      try {
        fs.writeFileSync(envPath, envContent.trim() + "\n");
        writeSuccess = true;
      } catch (e: unknown) {
        console.error("Gagal menulis ke .env, fallback ke konfigurasi manual:", e);
      }

      const manualConfigData = {
        GOOGLE_CLIENT_ID: clientId,
        GOOGLE_CLIENT_SECRET: clientSecret,
        GOOGLE_REFRESH_TOKEN: tokenData.refresh_token,
        NEXT_PUBLIC_ROOT_FOLDER_ID: rootFolderId
      };

      try {
        await invalidateAccessToken();
      } catch {}

      return NextResponse.json({
        success: true,
        restartNeeded: writeSuccess,
        manualConfigNeeded: !writeSuccess,
        manualConfigData,
        message: writeSuccess
          ? "Konfigurasi berhasil diperbarui di file .env. PENTING: Anda HARUS me-restart container/aplikasi agar perubahan ini terbaca."
          : "Gagal menulis ke .env secara otomatis. Silakan salin nilai ini secara manual.",
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Internal Server Error";
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
  },
  { rateLimit: false, bodySchema: setupFinishSchema },
);
