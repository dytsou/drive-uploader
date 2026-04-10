import { JWT } from "google-auth-library";
import { kv } from "@/lib/kv";
import type { AppDriveCredentials } from "@/lib/config";
import { getAppCredentials } from "@/lib/config";
import {
  REDIS_KEYS,
  REDIS_TTL,
  ERROR_MESSAGES,
  GOOGLE_OAUTH_TOKEN_URL,
} from "@/lib/constants";
import { logger } from "@/lib/logger";

const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive";

function driveAccessTokenCacheKey(creds: AppDriveCredentials): string {
  if (creds.mode === "service_account") {
    return `${REDIS_KEYS.ACCESS_TOKEN}:sa:${creds.serviceAccountEmail.substring(0, 12)}`;
  }
  return `${REDIS_KEYS.ACCESS_TOKEN}:oauth:${creds.refreshToken.substring(0, 10)}`;
}

export async function invalidateAccessToken() {
  try {
    const keys = await kv.scanKeys(`${REDIS_KEYS.ACCESS_TOKEN}:*`);
    if (keys.length > 0) {
      await kv.del(...keys);
    }
  } catch (e) {
    logger.error({ err: e }, "Failed to invalidate access token cache keys");
  }
  try {
    await kv.del(REDIS_KEYS.ACCESS_TOKEN);
  } catch (e) {
    logger.error({ err: e }, "Failed to delete legacy access token key");
  }
}

async function getAccessTokenFromServiceAccount(
  creds: Extract<AppDriveCredentials, { mode: "service_account" }>,
  cacheKey: string,
): Promise<string> {
  try {
    const cachedToken: string | null = await kv.get(cacheKey);
    if (cachedToken) {
      return cachedToken;
    }
  } catch (e) {
    logger.error({ err: e }, "Failed to get cached access token");
  }

  const jwtClient = new JWT({
    email: creds.serviceAccountEmail,
    key: creds.privateKey,
    scopes: [DRIVE_SCOPE],
  });

  const tokenResponse = await jwtClient.getAccessToken();
  const accessToken = tokenResponse?.token;
  if (!accessToken) {
    throw new Error(ERROR_MESSAGES.AUTH_FAILED);
  }

  try {
    await kv.set(cacheKey, accessToken, {
      ex: REDIS_TTL.ACCESS_TOKEN,
    });
    logger.debug("Service account access token obtained successfully");
  } catch (e) {
    logger.error({ err: e }, "Failed to cache access token");
  }

  return accessToken;
}

async function getAccessTokenFromOAuthRefresh(
  creds: Extract<AppDriveCredentials, { mode: "oauth_refresh" }>,
  cacheKey: string,
): Promise<string> {
  try {
    const cachedToken: string | null = await kv.get(cacheKey);
    if (cachedToken) {
      return cachedToken;
    }
  } catch (e) {
    logger.error({ err: e }, "Failed to get cached access token");
  }

  const bodyParams = new URLSearchParams({
    client_id: creds.clientId,
    client_secret: creds.clientSecret,
    refresh_token: creds.refreshToken,
    grant_type: "refresh_token",
  });

  const response = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: bodyParams,
    cache: "no-store",
  });

  if (!response.ok) {
    const errorData = await response.json();
    logger.error({ error: errorData.error }, "OAuth token refresh failed");

    if (errorData.error === ERROR_MESSAGES.INVALID_GRANT) {
      throw new Error(ERROR_MESSAGES.SESSION_EXPIRED);
    }

    throw new Error(errorData.error_description || ERROR_MESSAGES.AUTH_FAILED);
  }

  const tokenData: { access_token: string; expires_in: number } =
    await response.json();

  try {
    await kv.set(cacheKey, tokenData.access_token, {
      ex: REDIS_TTL.ACCESS_TOKEN,
    });
    logger.debug("Access token refreshed successfully");
  } catch (e) {
    logger.error({ err: e }, "Failed to cache access token");
  }

  return tokenData.access_token;
}

export async function getAccessToken(): Promise<string> {
  const creds = await getAppCredentials();
  if (!creds) {
    throw new Error(ERROR_MESSAGES.APP_NOT_CONFIGURED);
  }

  const cacheKey = driveAccessTokenCacheKey(creds);

  if (creds.mode === "service_account") {
    return getAccessTokenFromServiceAccount(creds, cacheKey);
  }

  return getAccessTokenFromOAuthRefresh(creds, cacheKey);
}
