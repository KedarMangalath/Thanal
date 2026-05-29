import { distanceMeters, type LatLng } from "@thanal/shared";

export type RoadRoute = {
  geometry: {
    coordinates: [number, number][];
  };
  distance: number;
  duration: number;
  weight_name?: string;
  legs?: {
    steps: {
      name: string;
      distance: number;
    }[];
  }[];
};

export async function fetchRoadRoute(waypoints: LatLng[]): Promise<RoadRoute> {
  return (await fetchRoadRoutes(waypoints, 1))[0];
}

export async function fetchRoadRoutes(waypoints: LatLng[], count = 3): Promise<RoadRoute[]> {
  if (waypoints.length < 2) throw new Error("At least two waypoints required.");
  try {
    const coordsStr = waypoints.map(wp => `${wp.lng},${wp.lat}`).join(";");
    const url = new URL(
      `https://router.project-osrm.org/route/v1/driving/${coordsStr}`
    );
    url.searchParams.set("overview", "full");
    url.searchParams.set("geometries", "geojson");
    url.searchParams.set("steps", "true");
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
  } catch (error) {
    console.warn("OSRM failed, falling back to proxy route:", error);
    const dist = distanceMeters(waypoints[0], waypoints[waypoints.length - 1]);
    return [
      {
        geometry: {
          coordinates: waypoints.map(wp => [wp.lng, wp.lat] as [number, number])
        },
        distance: dist,
        duration: (dist / 40000) * 3600, // 40km/h assumed
        legs: [{ steps: [{ name: "Direct proxy route", distance: dist }] }]
      }
    ];
  }
}

export function routeCoordinates(route: RoadRoute): LatLng[] {
  return route.geometry.coordinates.map(([lng, lat]) => ({ lat, lng }));
}

export function summarizeRoute(route: RoadRoute): string {
  if (!route.legs || route.legs.length === 0) return "Road route";
  
  const steps = route.legs[0].steps || [];
  
  // Aggregate distance by road name
  const roadDistances: Record<string, number> = {};
  for (const step of steps) {
    if (step.name && step.name.trim().length > 0) {
      roadDistances[step.name] = (roadDistances[step.name] || 0) + step.distance;
    }
  }
  
  // Sort by distance descending
  const sortedRoads = Object.entries(roadDistances)
    .sort((a, b) => b[1] - a[1])
    .map(entry => entry[0]);
    
  if (sortedRoads.length === 0) return "Road route";
  
  const mainRoad = sortedRoads[0];
  
  // Try to find a secondary road that is also significant (e.g., > 20% of the main road's distance)
  if (sortedRoads.length > 1 && roadDistances[sortedRoads[1]] > roadDistances[mainRoad] * 0.2) {
    return `Via ${mainRoad} and ${sortedRoads[1]}`;
  }
  
  return `Via ${mainRoad}`;
}
