import { getSunPosition, type LatLng } from "@thanal/shared";
import { useMemo } from "react";

export function useSunPosition(point: LatLng | null, at: Date) {
  return useMemo(() => (point ? getSunPosition(point, at) : null), [point, at]);
}
