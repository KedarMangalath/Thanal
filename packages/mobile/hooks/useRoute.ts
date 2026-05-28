import type { LatLng } from "@thanal/shared";
import { useCallback, useState } from "react";

type UseRouteState = {
  coordinates: LatLng[];
  distanceMeters: number | null;
  durationSeconds: number | null;
  error: string | null;
  isLoading: boolean;
  fetchRoute: (start: LatLng, end: LatLng) => Promise<RouteResult>;
  reset: () => void;
};

export type RouteResult = {
  coordinates: LatLng[];
  distanceMeters: number | null;
  durationSeconds: number | null;
};

export function useRoute(): UseRouteState {
  const [coordinates, setCoordinates] = useState<LatLng[]>([]);
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null);
  const [durationSeconds, setDurationSeconds] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchRoute = useCallback(async (start: LatLng, end: LatLng) => {
    setIsLoading(true);
    setError(null);

    try {
      const url = new URL(
        `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}`
      );
      url.searchParams.set("overview", "full");
      url.searchParams.set("geometries", "geojson");
      url.searchParams.set("steps", "false");

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error("OSRM could not return a route.");
      }

      const data = await response.json();
      const route = data.routes?.[0];
      if (!route) {
        throw new Error("No road route found between those points.");
      }

      const nextCoordinates = route.geometry.coordinates.map(([lng, lat]: [number, number]) => ({
        lat,
        lng
      }));

      const result = {
        coordinates: nextCoordinates,
        distanceMeters: route.distance,
        durationSeconds: route.duration
      };

      setCoordinates(result.coordinates);
      setDistanceMeters(result.distanceMeters);
      setDurationSeconds(result.durationSeconds);
      return result;
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Route request failed.";
      setError(message);
      const fallback = {
        coordinates: [start, end],
        distanceMeters: null,
        durationSeconds: null
      };

      setCoordinates(fallback.coordinates);
      setDistanceMeters(null);
      setDurationSeconds(null);
      return fallback;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setCoordinates([]);
    setDistanceMeters(null);
    setDurationSeconds(null);
    setError(null);
  }, []);

  return {
    coordinates,
    distanceMeters,
    durationSeconds,
    error,
    isLoading,
    fetchRoute,
    reset
  };
}
