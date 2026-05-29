import { DatabaseSync } from "node:sqlite";
import path from "path";

async function run() {
  console.log("Fetching speed cameras in India...");
  const query = `
    [out:json];
    (
      node["highway"="speed_camera"](6.5, 68.1, 35.5, 97.4);
      node["enforcement"="speed"](6.5, 68.1, 35.5, 97.4);
    );
    out geom;
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
    console.log(`Found ${data.elements.length} cameras.`);
    
    const cameras = data.elements
      .filter((e: any) => e.type === "node")
      .map((e: any) => ({ lat: e.lat, lng: e.lon }));

    const dbPath = path.join(process.cwd(), "thanal.db");
    const db = new DatabaseSync(dbPath);
    
    // Clear old osm cameras
    db.prepare("DELETE FROM speed_cameras WHERE source = 'osm'").run();
    
    const insertStmt = db.prepare(
      "INSERT INTO speed_cameras (lat, lng, source, verified, status) VALUES (?, ?, 'osm', 1, 'active')"
    );

    db.exec("BEGIN TRANSACTION");
    let inserted = 0;
    for (const cam of cameras) {
      insertStmt.run(cam.lat, cam.lng);
      inserted++;
    }
    db.exec("COMMIT");

    console.log(`Saved ${inserted} cameras to database.`);

  } catch (err) {
    console.error(err);
  }
}

run();
