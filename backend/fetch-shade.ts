import { DatabaseSync } from "node:sqlite";
import path from "path";

async function run() {
  console.log("Fetching shade zones (forests, parks, woods) in Kerala...");
  // We use out center to simplify polygons into a single center point for fast radius distance checks.
  const query = `
    [out:json];
    (
      way["natural"="wood"](8.0, 74.5, 12.8, 77.5);
      way["landuse"="forest"](8.0, 74.5, 12.8, 77.5);
      way["leisure"="park"](8.0, 74.5, 12.8, 77.5);
      way["highway"]["tree_lined"="yes"](8.0, 74.5, 12.8, 77.5);
    );
    out center;
  `;

  try {
    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
        "User-Agent": "Thanal/1.0"
      },
      body: "data=" + encodeURIComponent(query)
    });
    
    if (!res.ok) {
      throw new Error(`Overpass returned ${res.status}`);
    }

    const data = await res.json();
    console.log(`Found ${data.elements.length} shade zones.`);
    
    const zones = data.elements
      .map((e: any) => {
        const center = e.center || { lat: e.lat, lon: e.lon };
        if (!center.lat) return null;
        
        let type = "unknown";
        let radius = 100; // Default 100m radius
        
        if (e.tags) {
          if (e.tags.natural === "wood" || e.tags.landuse === "forest") {
            type = "forest";
            radius = 300;
          } else if (e.tags.leisure === "park") {
            type = "park";
            radius = 150;
          } else if (e.tags.tree_lined === "yes") {
            type = "tree_lined_road";
            radius = 50;
          }
        }
        
        return { lat: center.lat, lng: center.lon, type, radius };
      }).filter(Boolean);

    const dbPath = path.join(process.cwd(), "thanal.db");
    const db = new DatabaseSync(dbPath);
    
    db.prepare("DELETE FROM shade_zones").run();
    
    const insertStmt = db.prepare(
      "INSERT INTO shade_zones (lat, lng, type, radius_meters) VALUES (?, ?, ?, ?)"
    );

    db.exec("BEGIN TRANSACTION");
    let inserted = 0;
    for (const z of zones) {
      insertStmt.run(z.lat, z.lng, z.type, z.radius);
      inserted++;
    }
    db.exec("COMMIT");

    console.log(`Saved ${inserted} shade zones to database.`);

  } catch (err) {
    console.error(err);
  }
}

run();
