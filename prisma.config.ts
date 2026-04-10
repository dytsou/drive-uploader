import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Keep `prisma generate` usable even when DATABASE_URL
    // isn't present in the current shell (e.g. CI or editor tooling).
    url: process.env.DATABASE_URL,
  },
});
