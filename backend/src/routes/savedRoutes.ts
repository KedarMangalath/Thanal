import { Router } from "express";
import { z } from "zod";
import { analyzeRoute } from "@thanal/shared";
import { db } from "../db/db";
import { fetchRoadRoute, routeCoordinates } from "../services/osrm";

const router = Router();

const savedRouteSchema = z.object({
  userId: z.number().int().positive().optional(),
  name: z.string().min(2),
  mode: z.enum(["bus", "bike", "walk"]),
  start: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180)
  }),
  end: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180)
  }),
  departureTime: z.string().optional()
});

router.get("/", (_request, response) => {
  const routes = db
    .prepare(
      `SELECT
        id,
        user_id AS userId,
        name,
        mode,
        start_lat AS startLat,
        start_lng AS startLng,
        end_lat AS endLat,
        end_lng AS endLng,
        departure_time AS departureTime,
        created_at AS createdAt
      FROM saved_routes
      ORDER BY created_at DESC`
    )
    .all();

  response.json(routes);
});

router.get("/:id/refresh", async (request, response, next) => {
  try {
    const id = z.coerce.number().int().positive().parse(request.params.id);
    const departureTime = new Date(String(request.query.departureTime ?? new Date().toISOString()));
    const route = getSavedRoute(id);

    if (!route) {
      response.status(404).json({ error: "Saved route not found." });
      return;
    }

    const start = { lat: route.startLat, lng: route.startLng };
    const end = { lat: route.endLat, lng: route.endLng };
    const fallbackAverageSpeedKmh = route.mode === "walk" ? 5 : route.mode === "bike" ? 24 : 34;
    let coordinates = [start, end];
    let averageSpeedKmh = fallbackAverageSpeedKmh;
    let roadRoute = null;

    try {
      roadRoute = await fetchRoadRoute(start, end);
      coordinates = routeCoordinates(roadRoute);
      averageSpeedKmh = Math.max(18, (roadRoute.distance / roadRoute.duration) * 3.6);
    } catch {
      roadRoute = null;
    }

    response.json({
      savedRoute: route,
      route: roadRoute,
      analysis: analyzeRoute(coordinates, { departureTime, averageSpeedKmh }),
      routeSource: roadRoute ? "osrm" : "direct"
    });
  } catch (error) {
    next(error);
  }
});

router.post("/", (request, response) => {
  const route = savedRouteSchema.parse(request.body);
  const result = db
    .prepare(
      `INSERT INTO saved_routes (
        user_id,
        name,
        mode,
        start_lat,
        start_lng,
        end_lat,
        end_lng,
        departure_time
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      route.userId ?? null,
      route.name,
      route.mode,
      route.start.lat,
      route.start.lng,
      route.end.lat,
      route.end.lng,
      route.departureTime ?? null
    );

  response.status(201).json(getSavedRoute(Number(result.lastInsertRowid)));
});

router.delete("/:id", (request, response) => {
  const id = z.coerce.number().int().positive().parse(request.params.id);
  const result = db.prepare("DELETE FROM saved_routes WHERE id = ?").run(id);

  if (result.changes === 0) {
    response.status(404).json({ error: "Saved route not found." });
    return;
  }

  response.status(204).send();
});

type SavedRouteRow = {
  id: number;
  userId: number | null;
  name: string;
  mode: "bus" | "bike" | "walk";
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  departureTime: string | null;
  createdAt: string;
};

function getSavedRoute(id: number): SavedRouteRow | null {
  return (
    (db
      .prepare(
        `SELECT
          id,
          user_id AS userId,
          name,
          mode,
          start_lat AS startLat,
          start_lng AS startLng,
          end_lat AS endLat,
          end_lng AS endLng,
          departure_time AS departureTime,
          created_at AS createdAt
        FROM saved_routes
        WHERE id = ?`
      )
      .get(id) as SavedRouteRow | undefined) ?? null
  );
}

export default router;
