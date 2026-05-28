import { Router } from "express";
import { z } from "zod";

const router = Router();

const querySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180)
});

router.get("/", async (request, response, next) => {
  try {
    const { lat, lng } = querySchema.parse(request.query);
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", String(lat));
    url.searchParams.set("longitude", String(lng));
    url.searchParams.set(
      "hourly",
      "temperature_2m,relative_humidity_2m,uv_index,precipitation_probability,precipitation"
    );
    url.searchParams.set("forecast_days", "2");
    url.searchParams.set("timezone", "auto");

    const weatherResponse = await fetch(url);
    if (!weatherResponse.ok) {
      response.status(weatherResponse.status).json({ error: "Open-Meteo request failed." });
      return;
    }

    response.json(await weatherResponse.json());
  } catch (error) {
    next(error);
  }
});

export default router;
