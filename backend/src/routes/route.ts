import { analyzeRoute, type LatLng } from "@thanal/shared";
import { Router } from "express";
import { z } from "zod";
import { fetchRoadRoutes, routeCoordinates, summarizeRoute } from "../services/osrm";
import { findCamerasOnRoute } from "../services/speedcams";
import { calculateShadeCoverPercent } from "../services/shade";
import { findWashroomsOnRoute } from "../services/washrooms";

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
    const waypointsRaw = request.query.waypoints;
    const waypointsStr = Array.isArray(waypointsRaw) ? waypointsRaw : [waypointsRaw];
    const waypoints = waypointsStr.filter(Boolean).map(wp => parseLatLng(String(wp)));
    
    if (waypoints.length < 2) {
      return response.status(400).json({ error: "At least two waypoints are required." });
    }

    const reqDepartureTime = new Date(String(request.query.departureTime ?? new Date().toISOString()));
    const timeType = String(request.query.timeType ?? "depart");
    const routes = await fetchRoadRoutes(waypoints, 3);
    const options = await Promise.all(routes.map(async (route, index) => {
      const coordinates = routeCoordinates(route);
      let label = summarizeRoute(route);
      if (index > 0 && label === summarizeRoute(routes[0])) {
        label = `Alternative: ${label}`;
      }

      let routeDepartureTime = reqDepartureTime;
      if (timeType === "arrive") {
        // route.duration is in seconds
        routeDepartureTime = new Date(reqDepartureTime.getTime() - route.duration * 1000);
      }

      const analysis = analyzeRoute(coordinates, {
        departureTime: routeDepartureTime,
        averageSpeedKmh: Math.max(18, (route.distance / route.duration) * 3.6)
      });
      analysis.speedCameras = await findCamerasOnRoute(coordinates);
      analysis.shadeCoverPercent = await calculateShadeCoverPercent(coordinates);
      analysis.washrooms = await findWashroomsOnRoute(coordinates);

      return {
        id: `road-${index + 1}`,
        label,
        route,
        coordinates,
        analysis
      };
    }));
    const recommended = options
      .map((option) => ({
        option,
        score:
          option.analysis.directSunMinutesBySide.left +
          option.analysis.directSunMinutesBySide.right +
          option.analysis.glareWindows.length * 8 +
          option.analysis.totalDurationMinutes * 0.15
      }))
      .sort((a, b) => a.score - b.score)[0]?.option;

    response.json({
      options,
      recommendedOptionId: recommended?.id
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
