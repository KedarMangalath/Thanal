import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const schemaPath = join(currentDir, "schema.sql");
const dbPath = process.env.THANAL_DB_PATH ?? join(process.cwd(), "thanal.db");

export const db = new DatabaseSync(dbPath);
db.exec("PRAGMA journal_mode = WAL");
db.exec(readFileSync(schemaPath, "utf8"));

// Safe DB Migrations
try {
  db.exec("ALTER TABLE washrooms ADD COLUMN description TEXT");
} catch {
  // Column already exists
}
