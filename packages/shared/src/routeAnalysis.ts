import {
  bearingDegrees,
  distanceMeters,
  signedAngleDifferenceDegrees
} from "./geo";
import { getSunPosition } from "./sunCalc";
import type {
  LatLng,
  RouteAnalysis,
  RouteSegmentExposure,
  SeatSide,
  VehicleSide
} from "./types";

export type AnalyzeRouteOptions = {
  departureTime: Date;
  averageSpeedKmh?: number;
  glareThresholdDegrees?: number;
  sunAltitudeThresholdDegrees?: number;
};

const DEFAULT_AVERAGE_SPEED_KMH = 34;
const DEFAULT_GLARE_THRESHOLD_DEGREES = 30;
const DEFAULT_SUN_ALTITUDE_THRESHOLD_DEGREES = 3;

export function classifySunSide(
  headingDegrees: number,
  sunAzimuthDegrees: number,
  sunAltitudeDegrees: number,
  altitudeThresholdDegrees = DEFAULT_SUN_ALTITUDE_THRESHOLD_DEGREES
): VehicleSide {
  if (sunAltitudeDegrees <= altitudeThresholdDegrees) {
    return "none";
  }

  const relative = signedAngleDifferenceDegrees(sunAzimuthDegrees, headingDegrees);
  const absRelative = Math.abs(relative);

  if (absRelative <= 25) return "front";
  if (absRelative >= 155) return "behind";
  return relative > 0 ? "right" : "left";
}

export function seatAwayFromSun(side: VehicleSide): SeatSide {
  if (side === "left") return "right";
  if (side === "right") return "left";
  return "either";
}

export function analyzeRoute(
  coordinates: LatLng[],
  options: AnalyzeRouteOptions
): RouteAnalysis {
  if (coordinates.length < 2) {
    throw new Error("Route analysis needs at least two coordinates.");
  }

  const averageSpeedKmh = options.averageSpeedKmh ?? DEFAULT_AVERAGE_SPEED_KMH;
  const metersPerMinute = (averageSpeedKmh * 1000) / 60;
  const glareThreshold = options.glareThresholdDegrees ?? DEFAULT_GLARE_THRESHOLD_DEGREES;
  const altitudeThreshold =
    options.sunAltitudeThresholdDegrees ?? DEFAULT_SUN_ALTITUDE_THRESHOLD_DEGREES;

  let elapsedMinutes = 0;
  let totalDistanceMeters = 0;
  const directSunMinutesBySide = { left: 0, right: 0 };

  const timeline: RouteSegmentExposure[] = [];

  for (let index = 0; index < coordinates.length - 1; index += 1) {
    const start = coordinates[index];
    const end = coordinates[index + 1];
    const segmentDistance = distanceMeters(start, end);
    const segmentMinutes = segmentDistance / metersPerMinute;
    const segmentStartTime = new Date(options.departureTime.getTime() + elapsedMinutes * 60000);
    const segmentMidTime = new Date(segmentStartTime.getTime() + (segmentMinutes * 60000) / 2);
    const segmentEndTime = new Date(segmentStartTime.getTime() + segmentMinutes * 60000);
    const heading = bearingDegrees(start, end);
    const sun = getSunPosition(start, segmentMidTime);
    const sunSide = classifySunSide(
      heading,
      sun.azimuthDegrees,
      sun.altitudeDegrees,
      altitudeThreshold
    );
    const directSunMinutes = sunSide === "left" || sunSide === "right" ? segmentMinutes : 0;
    const relativeSunAngle = Math.abs(
      signedAngleDifferenceDegrees(sun.azimuthDegrees, heading)
    );
    const glareRisk =
      sun.altitudeDegrees > altitudeThreshold && relativeSunAngle <= glareThreshold;

    if (sunSide === "left" || sunSide === "right") {
      directSunMinutesBySide[sunSide] += directSunMinutes;
    }

    timeline.push({
      segmentIndex: index,
      start,
      end,
      startTime: segmentStartTime.toISOString(),
      endTime: segmentEndTime.toISOString(),
      distanceMeters: segmentDistance,
      headingDegrees: heading,
      sunAzimuthDegrees: sun.azimuthDegrees,
      sunAltitudeDegrees: sun.altitudeDegrees,
      sunSide,
      recommendedSeat: seatAwayFromSun(sunSide),
      directSunMinutes,
      glareRisk
    });

    elapsedMinutes += segmentMinutes;
    totalDistanceMeters += segmentDistance;
  }

  const recommendedSeat = chooseOverallSeat(directSunMinutesBySide);

  return {
    departureTime: options.departureTime.toISOString(),
    totalDistanceMeters,
    totalDurationMinutes: elapsedMinutes,
    directSunMinutesBySide,
    recommendedSeat,
    glareWindows: timeline.filter((segment) => segment.glareRisk),
    timeline
  };
}

function chooseOverallSeat(exposure: Record<"left" | "right", number>): SeatSide {
  const difference = Math.abs(exposure.left - exposure.right);
  if (difference < 5) return "either";
  return exposure.left > exposure.right ? "right" : "left";
}
