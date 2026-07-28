import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(16),
  AUTH_URL: z.string().url().optional(),
  DISCORD_CLIENT_ID: z.string().optional(),
  DISCORD_CLIENT_SECRET: z.string().optional(),
  CRON_SECRET: z.string().min(16).optional(),
  ENABLE_TEST_AUTH: z.enum(["true", "false"]).default("false"),
  EMAIL_FROM: z.string().optional()
});

export function validateEnv() {
  return envSchema.parse(process.env);
}

export function isTestAuthEnabled() {
  return process.env.ENABLE_TEST_AUTH === "true" && process.env.NODE_ENV !== "production";
}
