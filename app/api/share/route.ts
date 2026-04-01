export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createAdminRoute } from "@/lib/api-middleware";
import { SignJWT, decodeJwt } from "jose";
import crypto from "crypto";
import { kv } from "@/lib/kv";
import { db } from "@/lib/db";
import type { ShareLink } from "@/lib/store";
import { sendMail } from "@/lib/mailer";
import { getBaseUrl } from "@/lib/utils";
import {
  shareCreateRequestSchema,
  type ShareCreateRequest,
} from "@/lib/link-payloads";
import { REDIS_KEYS } from "@/lib/constants";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";

export const POST = createAdminRoute(
  async ({ body, session }) => {
    const cookieStore = await cookies();
    const locale = cookieStore.get("NEXT_LOCALE")?.value || "en";
    const t = await getTranslations({ locale, namespace: "Api.Share" });

    try {
      const {
        path,
        itemName,
        expiresIn,
        loginRequired,
        items,
        maxUses,
        preventDownload,
        hasWatermark,
        watermarkText,
      }: ShareCreateRequest = body;
      const isCollection = items && items.length > 0;

      const sensitiveKeywords = [
        "ktp",
        "password",
        "rahasia",
        "secret",
        "keuangan",
        "finance",
        "invoice",
        "identitas",
        "credential",
        ".env",
        "id_card",
        "confidential",
        "slip_gaji",
      ];

      const checkName = (name: string) =>
        sensitiveKeywords.some((keyword) =>
          name.toLowerCase().includes(keyword),
        );

      const isSensitive =
        checkName(itemName) ||
        (isCollection &&
          items.some((item: any) => item.name && checkName(item.name)));

      if (isSensitive && !loginRequired) {
        return NextResponse.json(
          {
            error: t("securityPolicySensitive"),
          },
          { status: 403 },
        );
      }

      const validExpireFormats = /^\d+[smhdw]$/;
      if (!validExpireFormats.test(expiresIn)) {
        return NextResponse.json(
          {
            error: t("invalidExpire"),
          },
          { status: 400 },
        );
      }

      const secret = new TextEncoder().encode(process.env.SHARE_SECRET_KEY!);
      const jti = crypto.randomUUID();

      const sharePath = isCollection ? `/share/${jti}` : path!;
      const shareName = itemName;

      const token = await new SignJWT({
        shareId: jti,
        loginRequired: loginRequired ?? false,
        preventDownload: preventDownload ?? false,
        hasWatermark: hasWatermark ?? false,
        watermarkText: watermarkText || null,
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime(expiresIn)
        .setJti(jti)
        .sign(secret);
      const shareableUrl = `${getBaseUrl()}${sharePath}?share_token=${token}`;

      const decodedToken = decodeJwt(token);
      if (!decodedToken.exp) {
        throw new Error(t("tokenExpired"));
      }

      if (isCollection) {
        const expiresInSeconds = (decodedToken.exp * 1000 - Date.now()) / 1000;
        await kv.set(`${REDIS_KEYS.SHARE_ITEMS}${jti}`, items, {
          ex: Math.ceil(expiresInSeconds) + 3600,
        });
      }

      const expiresAtDate = new Date(decodedToken.exp * 1000);

      const shareLinkRecord = await db.shareLink.create({
        data: {
          id: jti,
          path: sharePath,
          token,
          jti,
          expiresAt: expiresAtDate,
          loginRequired: loginRequired ?? false,
          itemName: shareName,
          isCollection: isCollection,
          maxUses: maxUses ?? null,
          preventDownload: preventDownload ?? false,
          hasWatermark: hasWatermark ?? false,
          watermarkText: watermarkText || null,
        },
      });

      const newShareLink: ShareLink = {
        id: shareLinkRecord.id,
        path: shareLinkRecord.path,
        token: shareLinkRecord.token,
        jti: shareLinkRecord.jti,
        expiresAt: shareLinkRecord.expiresAt.toISOString(),
        loginRequired: shareLinkRecord.loginRequired,
        itemName: shareLinkRecord.itemName,
        isCollection: shareLinkRecord.isCollection,
        maxUses: shareLinkRecord.maxUses,
        preventDownload: shareLinkRecord.preventDownload,
        hasWatermark: shareLinkRecord.hasWatermark,
        watermarkText: shareLinkRecord.watermarkText,
      };

      const adminEmails =
        process.env.ADMIN_EMAILS?.split(",")
          .map((email: string) => email.trim())
          .filter(Boolean) || [];
      if (adminEmails.length > 0) {
        await sendMail({
          to: adminEmails,
          subject: t("emailSubject", {
            type: isCollection ? t("collection") : t("share"),
          }),
          html: `
    
        <p>${t("emailHello")},</p>
                <p>${t("emailBody", { type: (isCollection ? t("collection") : t("share")).toLowerCase(), email: session?.user?.email || "Unknown" })}</p>
                <ul>
                    <li><b>${t("item")}</b> ${shareName}</li>
                    <li><b>${t("path")}</b> ${sharePath}</li>
                    <li><b>${t("expiresAt")}</b> ${expiresAtDate.toLocaleString(locale === "id" ? "id-ID" : "en-US", { timeZone: "Asia/Jakarta" })}</li>
                    <li><b>${t("loginRequired")}</b> ${loginRequired ? t("yes") : t("no")}</li>
                </ul>
    
            <p>${t("manageText")}</p>
            `,
        });
      }

      return NextResponse.json({ shareableUrl, token, jti, newShareLink });
    } catch (error) {
      console.error("Error generating share link:", error);
      return NextResponse.json({ error: t("createFail") }, { status: 500 });
    }
  },
  { requireEmail: true, bodySchema: shareCreateRequestSchema },
);
