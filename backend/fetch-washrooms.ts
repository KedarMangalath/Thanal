import { DatabaseSync } from "node:sqlite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(process.cwd(), "thanal.db");
const db = new DatabaseSync(DB_PATH);

const schema = fs.readFileSync(path.join(process.cwd(), "src/db/schema.sql"), "utf-8");
db.exec(schema);

// Overpass API Query for Toilets and Fuel Stations in Kerala
const QUERY = `
  [out:json];
  (
    node["amenity"="toilets"](8.0, 74.5, 12.8, 77.5);
    node["amenity"="fuel"](8.0, 74.5, 12.8, 77.5);
  );
  out center;
`;

async function main() {
  console.log("Fetching washrooms and petrol pumps in Kerala from OpenStreetMap...");
  
  try {
    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: "data=" + encodeURIComponent(QUERY),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
        "User-Agent": "Thanal/1.0"
      }
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Overpass API returned ${response.status}: ${text}`);
    }

    const data = await response.json();
    const elements = data.elements || [];

    console.log(`Found ${elements.length} washrooms/petrol pumps. Saving to database...`);

    const insertStmt = db.prepare(
      "INSERT INTO washrooms (lat, lng, type, status, upvotes, downvotes) VALUES (?, ?, ?, 'unverified', 0, 0)"
    );

    // Delete existing washrooms to avoid duplicates when running this script
    db.exec("DELETE FROM washrooms");

    let count = 0;
    for (const el of elements) {
      const lat = el.lat ?? el.center?.lat;
      const lng = el.lon ?? el.center?.lon;
      if (!lat || !lng) continue;

      const type = el.tags?.amenity === "fuel" ? "fuel_station" : "public";

      insertStmt.run(lat, lng, type);
      count++;
    }

    console.log(`Saved ${count} washrooms to database.`);
  } catch (err) {
    console.error("Failed to fetch washrooms:", err);
  }
}

void main();
