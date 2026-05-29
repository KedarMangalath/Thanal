import { distanceMeters, type LatLng } from "@thanal/shared";
import { db } from "../db/db";

export type SpeedCamera = {
  id: number;
  lat: number;
  lng: number;
  source: string;
  verified: boolean;
  status: string;
};

export async function findCamerasOnRoute(route: LatLng[], thresholdMeters = 50): Promise<SpeedCamera[]> {
  if (route.length === 0) return [];
  
  // Fetch all active speed cameras from DB
  const speedCameras = (await db.query(
    "SELECT id, lat, lng, source, verified, status FROM speed_cameras WHERE status = 'active'"
  )) as unknown as SpeedCamera[];
  if (speedCameras.length === 0) return [];

  const foundCameras: SpeedCamera[] = [];
  
  for (const camera of speedCameras) {
    // Check if camera is close to any point on the route
    // Since routes have high resolution coordinates, checking points is usually enough
    for (const point of route) {
      if (distanceMeters(camera, point) <= thresholdMeters) {
        foundCameras.push(camera);
        break; // Count each camera only once
      }
    }
  }

  return foundCameras;
}
