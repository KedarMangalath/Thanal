import type { LatLng } from "@thanal/shared";

export type RoadRoute = {
  geometry: {
    coordinates: [number, number][];
  };
  distance: number;
  duration: number;
  weight_name?: string;
};

export async function fetchRoadRoute(start: LatLng, end: LatLng): Promise<RoadRoute> {
  return (await fetchRoadRoutes(start, end, 1))[0];
}

export async function fetchRoadRoutes(start: LatLng, end: LatLng, count = 3): Promise<RoadRoute[]> {
  const url = new URL(
    `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}`
  );
  url.searchParams.set("overview", "full");
  url.searchParams.set("geometries", "geojson");
  url.searchParams.set("steps", "false");
  url.searchParams.set("alternatives", count > 1 ? "true" : "false");

  const osrmResponse = await fetch(url);
  if (!osrmResponse.ok) {
    throw new Error("OSRM route request failed.");
  }

  const osrm = await osrmResponse.json();
  const routes = (osrm.routes ?? []).slice(0, count);
  if (routes.length === 0) {
    throw new Error("No road route found between those points.");
  }

  return routes;
}

export function routeCoordinates(route: RoadRoute): LatLng[] {
  return route.geometry.coordinates.map(([lng, lat]) => ({ lat, lng }));
}
