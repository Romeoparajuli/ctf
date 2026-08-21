import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: Number(process.env.PORT ?? 4000),
  DB_PATH: process.env.DB_PATH ?? path.join(__dirname, "..", "..", "data", "app.db"),
  SESSION_SECRET: required(
    "SESSION_SECRET",
    process.env.NODE_ENV === "production" ? undefined : "dev-only-insecure-secret-change-me"
  ),
  SESSION_TTL_SECONDS: Number(process.env.SESSION_TTL_SECONDS ?? 60 * 60 * 8),
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  COOKIE_NAME: "ctf_session",
  IS_PRODUCTION: process.env.NODE_ENV === "production",
};
