import { distanceMeters, type LatLng } from "@thanal/shared";
import { db } from "../db/db";

type ShadeZone = {
  lat: number;
  lng: number;
  type: string;
  radius_meters: number;
};

// Cache the shade zones in memory for fast lookup
let cachedShadeZones: ShadeZone[] | null = null;

function getShadeZones(): ShadeZone[] {
  if (!cachedShadeZones) {
    cachedShadeZones = db.prepare("SELECT lat, lng, type, radius_meters FROM shade_zones").all() as unknown as ShadeZone[];
  }
  return cachedShadeZones;
}

export function calculateShadeCoverPercent(route: LatLng[]): number {
  if (route.length === 0) return 0;
  
  const zones = getShadeZones();
  if (zones.length === 0) return 0;

  // Pre-calculate route bounding box to filter zones
  let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
  for (const point of route) {
    if (point.lat < minLat) minLat = point.lat;
    if (point.lat > maxLat) maxLat = point.lat;
    if (point.lng < minLng) minLng = point.lng;
    if (point.lng > maxLng) maxLng = point.lng;
  }
  
  // Pad bounding box slightly (~10km)
  const pad = 0.1;
  const filteredZones = zones.filter(
    z => z.lat >= minLat - pad && z.lat <= maxLat + pad && 
         z.lng >= minLng - pad && z.lng <= maxLng + pad
  );

  let shadedPoints = 0;

  // For every Nth point, check if it's within a shade zone
  // We don't need to check every single meter, checking every ~50m is fine.
  // The route coordinates are usually quite dense. Let's just check all of them for now as it's fast enough in JS.
  for (const point of route) {
    let isShaded = false;
    for (const zone of filteredZones) {
      if (distanceMeters(point, zone) <= zone.radius_meters) {
        isShaded = true;
        break;
      }
    }
    if (isShaded) shadedPoints++;
  }

  return Math.round((shadedPoints / route.length) * 100);
}
