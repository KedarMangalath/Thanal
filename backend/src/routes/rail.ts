import { Router } from "express";
import { z } from "zod";
import { planRailRoute, searchRailStations } from "../services/rail";

const router = Router();

const latLngSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180)
});

router.get("/stations", (request, response) => {
  const query = z.string().default("").parse(request.query.q ?? "");
  response.json(
    searchRailStations(query).map((station, index) => ({
      place_id: index,
      display_name: `${station.name} (${station.code})`,
      lat: String(station.lat),
      lon: String(station.lng),
      code: station.code
    }))
  );
});

router.post("/route", (request, response) => {
  const body = z
    .object({
      start: latLngSchema,
      end: latLngSchema,
      departureTime: z.string().datetime().optional(),
      averageSpeedKmh: z.number().positive().optional()
    })
    .parse(request.body);

  response.json(
    planRailRoute({
      start: body.start,
      end: body.end,
      departureTime: body.departureTime ? new Date(body.departureTime) : new Date(),
      averageSpeedKmh: body.averageSpeedKmh,
      timeType: String(request.query.timeType ?? "depart")
    })
  );
});

export default router;
