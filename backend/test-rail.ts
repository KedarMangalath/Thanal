import { planRailRoute } from "./src/services/rail";

async function test() {
  const start = { lat: 8.4875, lng: 76.9525 }; // TVC
  const end = { lat: 9.9698, lng: 76.2917 }; // ERS

  const res = planRailRoute({
    start,
    end,
    departureTime: new Date()
  });

  console.log("Options count:", res.options.length);
  for (const opt of res.options) {
    console.log("Option:", opt.id, "Coordinates length:", opt.coordinates.length);
    if (opt.coordinates.length <= 4) {
      console.log("WARNING: Looks like a straight line fallback!");
    } else {
      console.log("SUCCESS: Looks like an actual track path!");
    }
  }
}

test();
