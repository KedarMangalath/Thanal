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

export default router;
