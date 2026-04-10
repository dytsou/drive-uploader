import { z } from "zod";

const envSchema = z.object({
  GOOGLE_CLIENT_ID: z.string().optional().or(z.literal("")),
  GOOGLE_CLIENT_SECRET: z.string().optional().or(z.literal("")),
  GOOGLE_SERVICE_ACCOUNT_EMAIL: z.string().optional().or(z.literal("")),
  GOOGLE_SERVICE_ACCOUNT_KEY: z.string().optional().or(z.literal("")),
  GOOGLE_DRIVE_ROOT_FOLDER_ID: z.string().optional().or(z.literal("")),
  NEXT_PUBLIC_ROOT_FOLDER_ID: z.string().optional().or(z.literal("")),
  NEXT_PUBLIC_ROOT_FOLDER_NAME: z.string().default("Home"),

  NEXTAUTH_SECRET: z
    .string()
    .min(32, "NEXTAUTH_SECRET must be at least 32 characters"),
  NEXTAUTH_URL: z.string().url("NEXTAUTH_URL must be a valid URL"),
  SHARE_SECRET_KEY: z
    .string()
    .min(32, "SHARE_SECRET_KEY must be at least 32 characters"),

  ADMIN_EMAILS: z.string().min(1, "ADMIN_EMAILS is required"),
  ADMIN_PASSWORD: z.string().optional().or(z.literal("")),
  ADMIN_PASSWORD_HASH: z.string().optional().or(z.literal("")),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  REDIS_URL: z.string().optional().or(z.literal("")),

  GOOGLE_REFRESH_TOKEN: z.string().optional().or(z.literal("")),
  PRIVATE_FOLDER_IDS: z.string().optional(),
  STORAGE_LIMIT_GB: z.string().optional(),
  STORAGE_WARNING_THRESHOLD: z.string().optional(),
  CRON_SECRET: z
    .string()
    .min(16, "CRON_SECRET must be at least 16 characters")
    .optional()
    .or(z.literal("")),

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().optional(),

  STORAGE_PROVIDER: z.string().optional().default("google-drive"),
  TMDB_API_KEY: z.string().optional(),
  ANALYZE: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function validateOnStartup(): Env {
  if (
    process.env.NODE_ENV === "test" ||
    process.env.SKIP_ENV_VALIDATION === "1" ||
    process.env.SKIP_ENV_VALIDATION === "true"
  ) {
    return process.env as unknown as Env;
  }

  const result = envSchema.safeParse(process.env);

  const adminCredentialResult = result.success
    ? validateAdminCredentials(result.data)
    : { ok: true as const };

  if (!result.success || !adminCredentialResult.ok) {
    console.error(
      "\n❌ PROYEK GAGAL MENYALA: Environment Variable Tidak Valid",
    );
    console.error("=========================================================");
    const issues = !result.success
      ? result.error.issues
      : adminCredentialResult.ok
        ? []
        : [adminCredentialResult.issue];

    issues.forEach((issue) => {
      console.error(`🚩 [${issue.path.join(".")}] -> ${issue.message}`);
    });
    console.error("=========================================================");
    console.error("Silakan periksa kembali file .env Anda.\n");

    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
    return process.env as unknown as Env;
  }

  const warnings: string[] = [];
  if (!process.env.REDIS_URL)
    warnings.push(
      "REDIS_URL tidak diset. Data sementara tidak akan tersimpan secara persisten.",
    );
  if (!process.env.SMTP_HOST)
    warnings.push(
      "Konfigurasi Email (SMTP) tidak ditemukan. Fitur email akan dinonaktifkan.",
    );
  if (process.env.NODE_ENV === "production" && !process.env.ADMIN_PASSWORD_HASH)
    warnings.push(
      "ADMIN_PASSWORD_HASH belum diset. Login admin berbasis plaintext dinonaktifkan di production.",
    );
  if (process.env.NODE_ENV === "production" && !process.env.CRON_SECRET)
    warnings.push(
      "CRON_SECRET belum diset. Endpoint cron akan menolak semua request.",
    );

  if (warnings.length > 0) {
    console.warn("\n⚠️  Peringatan Konfigurasi:");
    warnings.forEach((w) => console.warn(`   - ${w}`));
    console.warn("");
  } else {
    console.log("✅ Validasi Environment Berhasil\n");
  }

  return result.data;
}

function stripEnvQuotes(value: string | undefined): string {
  return (value ?? "").trim().replace(/^["']|["']$/g, "");
}

/** Match auth.ts: hash in production, or plaintext password (min 8) when no hash. */
function validateAdminCredentials(data: z.infer<typeof envSchema>):
  | { ok: true }
  | {
      ok: false;
      issue: { path: (string | number)[]; message: string };
    } {
  const pass = stripEnvQuotes(data.ADMIN_PASSWORD);
  const hash = (data.ADMIN_PASSWORD_HASH ?? "").trim();

  if (hash.length > 0) {
    return { ok: true };
  }

  if (pass.length === 0) {
    return {
      ok: false,
      issue: {
        path: ["ADMIN_PASSWORD"],
        message:
          "Set ADMIN_PASSWORD (min 8 characters) or ADMIN_PASSWORD_HASH for admin login.",
      },
    };
  }

  if (pass.length < 8) {
    return {
      ok: false,
      issue: {
        path: ["ADMIN_PASSWORD"],
        message: "ADMIN_PASSWORD must be at least 8 characters",
      },
    };
  }

  return { ok: true };
}

export const env = validateOnStartup();

export const config = {
  googleClientId: env.GOOGLE_CLIENT_ID,
  googleClientSecret: env.GOOGLE_CLIENT_SECRET,
  googleServiceAccountEmail: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  googleServiceAccountKey: env.GOOGLE_SERVICE_ACCOUNT_KEY,
  googleDriveRootFolderId: env.GOOGLE_DRIVE_ROOT_FOLDER_ID,
  googleRefreshToken: env.GOOGLE_REFRESH_TOKEN,
  rootFolderId: env.NEXT_PUBLIC_ROOT_FOLDER_ID,
  rootFolderName: env.NEXT_PUBLIC_ROOT_FOLDER_NAME,

  nextAuthSecret: env.NEXTAUTH_SECRET,
  nextAuthUrl: env.NEXTAUTH_URL,
  shareSecretKey: env.SHARE_SECRET_KEY,
  adminEmails: (env.ADMIN_EMAILS || "").split(",").filter(Boolean),
  adminPassword: env.ADMIN_PASSWORD ?? "",
  adminPasswordHash: env.ADMIN_PASSWORD_HASH,

  redisUrl: env.REDIS_URL,
  databaseUrl: env.DATABASE_URL,

  storageLimitGb: env.STORAGE_LIMIT_GB
    ? parseInt(env.STORAGE_LIMIT_GB, 10)
    : null,
  storageWarningThreshold: env.STORAGE_WARNING_THRESHOLD
    ? parseFloat(env.STORAGE_WARNING_THRESHOLD)
    : 0.9,

  isEmailEnabled: !!(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS),
  isDatabaseEnabled: !!env.DATABASE_URL,
  tmdbApiKey: env.TMDB_API_KEY,
  storageProvider: env.STORAGE_PROVIDER,
};
