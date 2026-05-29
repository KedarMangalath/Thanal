import { Router } from "express";
import { z } from "zod";
import { analyzeRoute } from "@thanal/shared";
import { db } from "../db/db";
import { fetchRoadRoutes, routeCoordinates } from "../services/osrm";
import { planRailRoute } from "../services/rail";

const router = Router();

const savedRouteSchema = z.object({
  userId: z.number().int().positive().optional(),
  name: z.string().min(2),
  mode: z.enum(["bus", "bike", "walk", "train"]),
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

router.get("/", async (_request, response, next) => {
  try {
    const routes = await db.query(
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
    );

    response.json(routes);
  } catch (error) {
    next(error);
  }
});

router.get("/:id/refresh", async (request, response, next) => {
  try {
    const id = z.coerce.number().int().positive().parse(request.params.id);
    const departureTime = new Date(String(request.query.departureTime ?? new Date().toISOString()));
    const route = await getSavedRoute(id);

    if (!route) {
      response.status(404).json({ error: "Saved route not found." });
      return;
    }

    const start = { lat: route.startLat, lng: route.startLng };
    const end = { lat: route.endLat, lng: route.endLng };

    if (route.mode === "train") {
      const rail = planRailRoute({ start, end, departureTime });
      if (rail.options.length === 0 || !rail.analysis) {
        response.status(422).json({ error: "No rail corridor found for this saved route." });
        return;
      }

      response.json({
        savedRoute: route,
        options: rail.options,
        recommendedOptionId: rail.recommendedOptionId,
        analysis: rail.analysis,
        routeSource: rail.source
      });
      return;
    }

    const routes = await fetchRoadRoutes([start, end], 3);
    const options = routes.map((roadRoute, index) => {
      const coordinates = routeCoordinates(roadRoute);
      const averageSpeedKmh =
        route.mode === "walk"
          ? 5
          : route.mode === "bike"
            ? 24
            : Math.max(18, (roadRoute.distance / roadRoute.duration) * 3.6);

      return {
        id: `saved-${route.id}-${index + 1}`,
        label: index === 0 ? "Recommended road route" : `Alternative road route ${index + 1}`,
        route: roadRoute,
        coordinates,
        analysis: analyzeRoute(coordinates, { departureTime, averageSpeedKmh })
      };
    });
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
      savedRoute: route,
      options,
      recommendedOptionId: recommended?.id,
      analysis: recommended?.analysis,
      routeSource: "osrm"
    });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (request, response, next) => {
  try {
    const route = savedRouteSchema.parse(request.body);
    const result = await db.run(
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
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        route.userId ?? null,
        route.name,
        route.mode,
        route.start.lat,
        route.start.lng,
        route.end.lat,
        route.end.lng,
        route.departureTime ?? null
      ]
    );

    const saved = await getSavedRoute(Number(result.lastInsertRowid));
    response.status(201).json(saved);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (request, response, next) => {
  try {
    const id = z.coerce.number().int().positive().parse(request.params.id);
    const result = await db.run("DELETE FROM saved_routes WHERE id = ?", [id]);

    if (result.changes === 0) {
      response.status(404).json({ error: "Saved route not found." });
      return;
    }

    response.status(204).send();
  } catch (error) {
    next(error);
  }
});

type SavedRouteRow = {
  id: number;
  userId: number | null;
  name: string;
  mode: "bus" | "bike" | "walk" | "train";
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  departureTime: string | null;
  createdAt: string;
};

async function getSavedRoute(id: number): Promise<SavedRouteRow | null> {
  const rows = await db.query(
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
    WHERE id = ?`,
    [id]
  );
  return (rows[0] as SavedRouteRow | undefined) ?? null;
}

export default router;
