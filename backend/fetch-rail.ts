import fs from "fs";

async function run() {
  console.log("Fetching railway tracks in Kerala...");
  const query = `
    [out:json];
    (
      way["railway"="rail"](8.0, 74.5, 12.8, 77.5);
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
    console.log(`Found ${data.elements.length} elements.`);
    
    const lines = data.elements
      .filter((e: any) => e.type === "way" && e.geometry)
      .map((e: any) => e.geometry.map((g: any) => ({ lat: g.lat, lng: g.lon })));

    fs.writeFileSync("src/rail-tracks.json", JSON.stringify(lines));
    console.log("Saved to src/rail-tracks.json");

  } catch (err) {
    console.error(err);
  }
}

run();
