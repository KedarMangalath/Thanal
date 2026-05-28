import type { LatLng, RouteAnalysis } from "@thanal/shared";
import Constants from "expo-constants";

export const API_BASE_URL =
  typeof Constants.expoConfig?.extra?.apiBaseUrl === "string"
    ? Constants.expoConfig.extra.apiBaseUrl
    : "http://localhost:4010";

export type PlaceResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
};

export type RailRoute = {
  source: string;
  confidence: "low" | "medium" | "high";
  options: RouteOption[];
  recommendedOptionId?: string;
  coordinates: LatLng[];
  stations: Array<LatLng & { code: string; name: string }>;
  from: LatLng & { code: string; name: string };
  to: LatLng & { code: string; name: string };
  analysis: RouteAnalysis;
};

export type RouteOption = {
  id: string;
  label: string;
  serviceHint?: string;
  coordinates: LatLng[];
  analysis: RouteAnalysis;
};

export type RouteOptionsResponse = {
  options: RouteOption[];
  recommendedOptionId?: string;
};

export async function searchPlaces(query: string): Promise<PlaceResult[]> {
  const url = new URL(`${API_BASE_URL}/api/places/search`);
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "5");

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error("Place search is unavailable.");
  }

  return response.json();
}

export async function searchRailStations(query: string): Promise<PlaceResult[]> {
  const url = new URL(`${API_BASE_URL}/api/rail/stations`);
  url.searchParams.set("q", query);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error("Rail station search is unavailable.");
  }

  return response.json();
}

export async function fetchRailRoute(input: {
  start: LatLng;
  end: LatLng;
  departureTime: string;
}): Promise<RailRoute> {
  const response = await fetch(`${API_BASE_URL}/api/rail/route`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    throw new Error("Rail route is unavailable.");
  }

  return response.json();
}

export async function fetchRouteOptions(input: {
  start: LatLng;
  end: LatLng;
  departureTime: string;
}): Promise<RouteOptionsResponse> {
  const url = new URL(`${API_BASE_URL}/api/route`);
  url.searchParams.set("start", `${input.start.lat},${input.start.lng}`);
  url.searchParams.set("end", `${input.end.lat},${input.end.lng}`);
  url.searchParams.set("departureTime", input.departureTime);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error("Road route is unavailable.");
  }

  return response.json();
}

export async function askAssistant(input: {
  message: string;
  mode: "bus" | "bike" | "walk" | "train";
  start: LatLng | null;
  end: LatLng | null;
  departureTime: string;
}): Promise<{ answer: string; model: string; toolTrace: unknown[] }> {
  const response = await fetch(`${API_BASE_URL}/api/assistant/plan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    throw new Error("Assistant is unavailable.");
  }

  return response.json();
}

export async function deleteSavedRoute(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/saved-routes/${id}`, {
    method: "DELETE"
  });

  if (!response.ok) {
    throw new Error("Could not delete route.");
  }
}
