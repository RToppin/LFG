import { defineConfig } from "prisma/config";
import { existsSync } from "node:fs";

if (existsSync(".env")) {
  process.loadEnvFile?.();
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts"
  },
  datasource: {
    url: process.env.DATABASE_URL ?? "postgresql://lfg:lfg@localhost:5432/lfg?schema=public"
  }
});
