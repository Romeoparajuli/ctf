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

function hasColumn(table: string, column: string): boolean {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  return columns.some((c) => c.name === column);
}

function addColumnIfMissing(table: string, column: string, definition: string): void {
  if (!hasColumn(table, column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

/** Additive, idempotent column migrations for tables that already existed before a given field was introduced. */
function migrateColumns(): void {
  addColumnIfMissing("users", "must_change_password", "INTEGER NOT NULL DEFAULT 0");

  addColumnIfMissing("terms_versions", "title", "TEXT NOT NULL DEFAULT ''");
  addColumnIfMissing("terms_versions", "status", "TEXT NOT NULL DEFAULT 'DRAFT'");
  addColumnIfMissing("terms_versions", "effective_date", "TEXT");
  addColumnIfMissing("terms_versions", "created_by", "INTEGER REFERENCES users(id)");
  addColumnIfMissing("terms_versions", "published_by", "INTEGER REFERENCES users(id)");
  // SQLite's ADD COLUMN rejects a non-constant DEFAULT (e.g. a strftime()
  // call) — add nullable, then backfill with an UPDATE instead.
  addColumnIfMissing("terms_versions", "updated_at", "TEXT");
  // Backfill from the old is_active boolean this table used before status
  // existed. Keyed off actual row state (not "did this column just get
  // added") so it's safe — and self-healing — to run on every startup,
  // including one that resumes after a previous migration run failed
  // partway through (columns added, backfill not yet applied).
  if (hasColumn("terms_versions", "is_active")) {
    db.exec(`UPDATE terms_versions SET status = 'PUBLISHED', published_at = created_at WHERE is_active = 1 AND status = 'DRAFT'`);
  }
  db.exec(`UPDATE terms_versions SET title = 'Terms & Conditions v' || version WHERE title = ''`);
  db.exec(`UPDATE terms_versions SET updated_at = created_at WHERE updated_at IS NULL`);

  addColumnIfMissing("terms_acceptances", "ip_address", "TEXT");
  addColumnIfMissing("terms_acceptances", "user_agent", "TEXT");
}

export function runMigrations(): void {
  const schemaPath = path.join(__dirname, "schema.sql");
  const sql = fs.readFileSync(schemaPath, "utf-8");
  db.exec(sql);
  migrateColumns();
}
