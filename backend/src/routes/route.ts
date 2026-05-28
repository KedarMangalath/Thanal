import { analyzeRoute, type LatLng } from "@thanal/shared";
import { Router } from "express";
import { z } from "zod";

const router = Router();

const latLngSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180)
});

const analyzeSchema = z.object({
  coordinates: z.array(latLngSchema).min(2),
  departureTime: z.string().datetime().optional(),
  averageSpeedKmh: z.number().positive().optional()
});

router.get("/", async (request, response, next) => {
  try {
    const start = parseLatLng(String(request.query.start ?? ""));
    const end = parseLatLng(String(request.query.end ?? ""));
    const departureTime = new Date(String(request.query.departureTime ?? new Date().toISOString()));
    const url = new URL(
      `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}`
    );
    url.searchParams.set("overview", "full");
    url.searchParams.set("geometries", "geojson");
    url.searchParams.set("steps", "false");

    const osrmResponse = await fetch(url);
    if (!osrmResponse.ok) {
      response.status(osrmResponse.status).json({ error: "OSRM route request failed." });
      return;
    }

    const osrm = await osrmResponse.json();
    const coordinates = osrm.routes[0].geometry.coordinates.map(
      ([lng, lat]: [number, number]) => ({ lat, lng })
    );

    response.json({
      route: osrm.routes[0],
      analysis: analyzeRoute(coordinates, { departureTime })
    });
  } catch (error) {
    next(error);
  }
});

router.post("/analyze", (request, response) => {
  const body = analyzeSchema.parse(request.body);
  response.json(
    analyzeRoute(body.coordinates, {
      departureTime: body.departureTime ? new Date(body.departureTime) : new Date(),
      averageSpeedKmh: body.averageSpeedKmh
    })
  );
});

function parseLatLng(value: string): LatLng {
  const [lat, lng] = value.split(",").map(Number);
  const parsed = latLngSchema.parse({ lat, lng });
  return parsed;
}

export default router;
