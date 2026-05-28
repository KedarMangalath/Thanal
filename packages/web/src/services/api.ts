import type { LatLng, RainBucket, WeatherSnapshot } from "@thanal/shared";

const BACKEND_URL = "http://localhost:4010";

export type OsrmRoute = {
  geometry: {
    coordinates: [number, number][];
  };
  distance: number;
  duration: number;
};

export type SavedRoute = {
  id: number;
  name: string;
  mode: "bus" | "bike" | "walk";
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  departureTime: string | null;
};

export type PlaceResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
};

export async function fetchRoute(start: LatLng, end: LatLng): Promise<OsrmRoute> {
  const url = new URL(
    `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}`
  );
  url.searchParams.set("overview", "full");
  url.searchParams.set("geometries", "geojson");
  url.searchParams.set("steps", "false");

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("OSRM could not return a route.");
  }

  const data = await response.json();
  if (!data.routes?.[0]) {
    throw new Error("No road route found between those points.");
  }

  return data.routes[0];
}

export async function fetchWeather(point: LatLng): Promise<WeatherSnapshot> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(point.lat));
  url.searchParams.set("longitude", String(point.lng));
  url.searchParams.set(
    "hourly",
    "temperature_2m,relative_humidity_2m,uv_index,precipitation_probability"
  );
  url.searchParams.set("forecast_days", "1");
  url.searchParams.set("timezone", "auto");

  const response = await fetch(url);
  if (!response.ok) {
    return fallbackWeather();
  }

  const data = await response.json();
  const hour = new Date().getHours();

  return {
    temperatureC: data.hourly.temperature_2m[hour] ?? 32,
    relativeHumidity: data.hourly.relative_humidity_2m[hour] ?? 78,
    uvIndex: data.hourly.uv_index[hour] ?? 7,
    precipitationProbability: data.hourly.precipitation_probability[hour] ?? 20,
    rainTimeline: getRainTimeline(data.hourly, hour)
  };
}

export async function fetchSavedRoutes(): Promise<SavedRoute[]> {
  const response = await fetch(`${BACKEND_URL}/api/saved-routes`);
  if (!response.ok) {
    throw new Error("Saved routes are unavailable.");
  }

  return response.json();
}

export async function saveRoute(input: {
  name: string;
  mode: "bus" | "bike" | "walk";
  start: LatLng;
  end: LatLng;
  departureTime: string;
}): Promise<SavedRoute> {
  const response = await fetch(`${BACKEND_URL}/api/saved-routes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    throw new Error("Could not save route.");
  }

  return response.json();
}

export async function deleteSavedRoute(id: number): Promise<void> {
  const response = await fetch(`${BACKEND_URL}/api/saved-routes/${id}`, {
    method: "DELETE"
  });

  if (!response.ok) {
    throw new Error("Could not delete route.");
  }
}

export async function searchPlaces(query: string): Promise<PlaceResult[]> {
  const url = new URL(`${BACKEND_URL}/api/places/search`);
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "5");

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Place search is unavailable.");
  }

  return response.json();
}

function fallbackWeather(): WeatherSnapshot {
  return {
    temperatureC: 32,
    relativeHumidity: 78,
    uvIndex: 7,
    precipitationProbability: 20,
    rainTimeline: Array.from({ length: 8 }, (_, index) => ({
      time: new Date(Date.now() + index * 60 * 60 * 1000).toISOString(),
      probability: Math.max(0, 20 - index * 3)
    }))
  };
}

function getRainTimeline(
  hourly: {
    time?: string[];
    precipitation_probability?: number[];
    precipitation?: number[];
  },
  fallbackStartIndex: number
): RainBucket[] {
  const times = hourly.time ?? [];
  const probabilities = hourly.precipitation_probability ?? [];
  const precipitation = hourly.precipitation ?? [];
  const now = Date.now();
  const startIndex = Math.max(
    0,
    times.findIndex((time) => new Date(time).getTime() >= now)
  );
  const sliceStart = startIndex >= 0 ? startIndex : fallbackStartIndex;

  return Array.from({ length: 8 }, (_, offset) => {
    const index = sliceStart + offset;
    return {
      time: times[index] ?? new Date(now + offset * 60 * 60 * 1000).toISOString(),
      probability: probabilities[index] ?? probabilities[fallbackStartIndex] ?? 0,
      precipitationMm: precipitation[index]
    };
  });
}
