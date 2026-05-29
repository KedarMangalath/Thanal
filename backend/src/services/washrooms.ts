import { distanceMeters, type LatLng } from "@thanal/shared";
import { db } from "../db/db";

export type Washroom = {
  id: number;
  lat: number;
  lng: number;
  type: "public" | "fuel_station";
  status: "good" | "bad" | "unverified";
  upvotes: number;
  downvotes: number;
  image_url: string | null;
  description: string | null;
};

// Simple in-memory cache to avoid querying the DB for all washrooms on every route
let cachedWashrooms: Washroom[] | null = null;

export function getWashrooms(): Washroom[] {
  if (!cachedWashrooms) {
    cachedWashrooms = db.prepare("SELECT id, lat, lng, type, status, upvotes, downvotes, image_url, description FROM washrooms").all() as unknown as Washroom[];
  }
  return cachedWashrooms;
}

export function findWashroomsOnRoute(route: LatLng[]): Washroom[] {
  if (route.length === 0) return [];
  
  const allWashrooms = getWashrooms();
  if (allWashrooms.length === 0) return [];

  const found: Washroom[] = [];
  const MAX_DISTANCE_METERS = 300; // Found if within 300m of any route point

  // Simple O(N*M) - fine for small numbers
  for (const washroom of allWashrooms) {
    for (const point of route) {
      if (distanceMeters(washroom, point) <= MAX_DISTANCE_METERS) {
        found.push(washroom);
        break; // stop checking route points for this washroom
      }
    }
  }

  return found;
}
