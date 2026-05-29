import { join } from "node:path";
import { createClient, type Client } from "@libsql/client";

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

export async function initDb() {
  try {
    const schemaSql = `CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS saved_routes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  name TEXT NOT NULL,
  mode TEXT NOT NULL,
  start_lat REAL NOT NULL,
  start_lng REAL NOT NULL,
  end_lat REAL NOT NULL,
  end_lng REAL NOT NULL,
  departure_time TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS community_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  severity INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS flood_zones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  severity INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  email TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS speed_cameras (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  source TEXT NOT NULL DEFAULT 'osm',
  verified INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS speed_camera_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  camera_id INTEGER,
  type TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (camera_id) REFERENCES speed_cameras(id)
);
CREATE TABLE IF NOT EXISTS shade_zones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  type TEXT NOT NULL,
  radius_meters INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS washrooms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unverified',
  upvotes INTEGER NOT NULL DEFAULT 0,
  downvotes INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);`;
    await db.exec(schemaSql);
    console.log("Database initialized successfully.");
  } catch (error) {
    console.error("Database initialization failed:", error);
  }
}
