import { Router } from "express";
import { z } from "zod";
import { db } from "../db/db";

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

  response.status(201).json({ id: result.lastInsertRowid, ...route });
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

export default router;
