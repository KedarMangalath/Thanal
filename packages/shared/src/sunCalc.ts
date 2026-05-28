import SunCalc from "suncalc";
import { normalizeDegrees, toDegrees } from "./geo";
import type { LatLng } from "./types";

export type SunPosition = {
  azimuthDegrees: number;
  altitudeDegrees: number;
};

export function getSunPosition(point: LatLng, at: Date): SunPosition {
  const position = SunCalc.getPosition(at, point.lat, point.lng);

  return {
    azimuthDegrees: normalizeDegrees(toDegrees(position.azimuth) + 180),
    altitudeDegrees: toDegrees(position.altitude)
  };
}
