import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient, type Client } from "@libsql/client";

const currentDir = dirname(fileURLToPath(import.meta.url));
const schemaPath = join(currentDir, "schema.sql");

const isTurso = !!process.env.TURSO_DATABASE_URL;

class SQLiteWrapper {
  private localDb: any = null;
  
  constructor() {}

  async init() {
    if (this.localDb) return;
    const { DatabaseSync } = await import("node:sqlite");
    const dbPath = process.env.THANAL_DB_PATH ?? join(process.cwd(), "thanal.db");
    this.localDb = new DatabaseSync(dbPath);
    this.localDb.exec("PRAGMA journal_mode = WAL");
  }

  async exec(sql: string): Promise<void> {
    await this.init();
    this.localDb.exec(sql);
  }

  async query(sql: string, params: any = []): Promise<any[]> {
    await this.init();
    const stmt = this.localDb.prepare(sql);
    const rows = (typeof params === "object" && !Array.isArray(params))
      ? stmt.all(params)
      : stmt.all(...(Array.isArray(params) ? params : [params]));
    return rows;
  }

  async run(sql: string, params: any = []): Promise<{ lastInsertRowid: number; changes: number }> {
    await this.init();
    const stmt = this.localDb.prepare(sql);
    const result = (typeof params === "object" && !Array.isArray(params))
      ? stmt.run(params)
      : stmt.run(...(Array.isArray(params) ? params : [params]));
    return {
      lastInsertRowid: Number(result.lastInsertRowid),
      changes: Number(result.changes)
    };
  }
}

class TursoWrapper {
  private client: Client;

  constructor() {
    this.client = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN
    });
  }

  async exec(sql: string): Promise<void> {
    await this.client.execute(sql);
  }

  async query(sql: string, params: any = []): Promise<any[]> {
    const res = await this.client.execute({ sql, args: params });
    return res.rows as any[];
  }

  async run(sql: string, params: any = []): Promise<{ lastInsertRowid: number; changes: number }> {
    const res = await this.client.execute({ sql, args: params });
    return {
      lastInsertRowid: Number(res.lastInsertRowid ?? 0),
      changes: res.rowsAffected
    };
  }
}

export const db = isTurso ? new TursoWrapper() : new SQLiteWrapper();

// Safe DB initialization/migrations
(async () => {
  try {
    const schemaSql = readFileSync(schemaPath, "utf8");
    await db.exec(schemaSql);
    try {
      await db.exec("ALTER TABLE washrooms ADD COLUMN description TEXT");
    } catch {
      // Column already exists
    }
  } catch (error) {
    console.error("Database initialization failed:", error);
  }
})();
