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

export function runMigrations(): void {
  const schemaPath = path.join(__dirname, "schema.sql");
  const sql = fs.readFileSync(schemaPath, "utf-8");
  db.exec(sql);
}
