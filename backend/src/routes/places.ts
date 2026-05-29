import { Router } from "express";
import { z } from "zod";

const router = Router();

const searchSchema = z.object({
  q: z.string().min(2),
  limit: z.coerce.number().int().min(1).max(10).default(5)
});

router.get("/search", async (request, response, next) => {
  try {
    const { q, limit } = searchSchema.parse(request.query);
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", q);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("countrycodes", "in");

    const placesResponse = await fetch(url, {
      headers: {
        "User-Agent": "Thanal local development app"
      }
    });

    if (!placesResponse.ok) {
      response.status(placesResponse.status).json({ error: "Nominatim request failed." });
      return;
    }

    response.json(await placesResponse.json());
  } catch (error) {
    next(error);
  }
});

const reverseSchema = z.object({
  lat: z.coerce.number(),
  lng: z.coerce.number()
});

router.get("/reverse", async (request, response, next) => {
  try {
    const { lat, lng } = reverseSchema.parse(request.query);
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lon", String(lng));
    url.searchParams.set("format", "jsonv2");

    const placesResponse = await fetch(url, {
      headers: {
        "User-Agent": "Thanal local development app"
      }
    });

    if (!placesResponse.ok) {
      response.status(placesResponse.status).json({ error: "Nominatim request failed." });
      return;
    }

    const data = await placesResponse.json();
    const displayName = data.display_name || "";
    const shortName = displayName.split(",").slice(0, 2).join(",").trim();

    response.json({ name: shortName });
  } catch (error) {
    next(error);
  }
});

export default router;
