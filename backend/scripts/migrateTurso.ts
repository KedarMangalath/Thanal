import { createClient } from "@libsql/client";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env") });

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error("Missing Turso credentials");
  process.exit(1);
}

const client = createClient({ url, authToken });

async function runMigration() {
  console.log("Starting migration on Turso...");
  try {
    await client.execute("ALTER TABLE washrooms ADD COLUMN description TEXT");
    console.log("Migration successful: added description column");
  } catch (err: any) {
    if (err.message?.includes("duplicate column name")) {
      console.log("Column already exists. Migration complete.");
    } else {
      console.error("Migration failed:", err);
    }
  }
}

runMigration();
