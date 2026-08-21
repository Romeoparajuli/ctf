import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "../config/env.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

fs.mkdirSync(path.dirname(env.DB_PATH), { recursive: true });

export const db = new DatabaseSync(env.DB_PATH);
db.exec("PRAGMA foreign_keys = ON;");
db.exec("PRAGMA journal_mode = WAL;");

/** Additive, idempotent column migrations for tables that already existed before a given field was introduced. */
function migrateColumns(): void {
  const columns = db.prepare(`PRAGMA table_info(users)`).all() as { name: string }[];
  if (!columns.some((c) => c.name === "must_change_password")) {
    db.exec(`ALTER TABLE users ADD COLUMN must_change_password INTEGER NOT NULL DEFAULT 0`);
  }
}

export function runMigrations(): void {
  const schemaPath = path.join(__dirname, "schema.sql");
  const sql = fs.readFileSync(schemaPath, "utf-8");
  db.exec(sql);
  migrateColumns();
}
