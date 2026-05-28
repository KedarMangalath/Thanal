import type { LatLng } from "@thanal/shared";

export type RoadRoute = {
  geometry: {
    coordinates: [number, number][];
  };
  distance: number;
  duration: number;
};

export async function fetchRoadRoute(start: LatLng, end: LatLng): Promise<RoadRoute> {
  const url = new URL(
    `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}`
  );
  url.searchParams.set("overview", "full");
  url.searchParams.set("geometries", "geojson");
  url.searchParams.set("steps", "false");

  const osrmResponse = await fetch(url);
  if (!osrmResponse.ok) {
    throw new Error("OSRM route request failed.");
  }

  const osrm = await osrmResponse.json();
  const route = osrm.routes?.[0];
  if (!route) {
    throw new Error("No road route found between those points.");
  }

  return route;
}

export function routeCoordinates(route: RoadRoute): LatLng[] {
  return route.geometry.coordinates.map(([lng, lat]) => ({ lat, lng }));
}
