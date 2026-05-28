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

export async function deleteSavedRoute(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/saved-routes/${id}`, {
    method: "DELETE"
  });

  if (!response.ok) {
    throw new Error("Could not delete route.");
  }
}
