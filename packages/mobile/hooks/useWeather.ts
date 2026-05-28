import type { LatLng, WeatherSnapshot } from "@thanal/shared";
import { useCallback, useState } from "react";

type UseWeatherState = {
  weather: WeatherSnapshot | null;
  error: string | null;
  isLoading: boolean;
  fetchWeather: (point: LatLng) => Promise<WeatherSnapshot | null>;
};

export function useWeather(): UseWeatherState {
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchWeather = useCallback(async (point: LatLng) => {
    setIsLoading(true);
    setError(null);

    try {
      const url = new URL("https://api.open-meteo.com/v1/forecast");
      url.searchParams.set("latitude", String(point.lat));
      url.searchParams.set("longitude", String(point.lng));
      url.searchParams.set(
        "hourly",
        "temperature_2m,relative_humidity_2m,uv_index,precipitation_probability"
      );
      url.searchParams.set("forecast_days", "1");
      url.searchParams.set("timezone", "auto");

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error("Open-Meteo request failed.");
      }

      const data = await response.json();
      const hour = new Date().getHours();
      const snapshot: WeatherSnapshot = {
        temperatureC: data.hourly.temperature_2m[hour] ?? 32,
        relativeHumidity: data.hourly.relative_humidity_2m[hour] ?? 78,
        uvIndex: data.hourly.uv_index[hour] ?? 7,
        precipitationProbability: data.hourly.precipitation_probability[hour] ?? 20
      };

      setWeather(snapshot);
      return snapshot;
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Weather request failed.";
      setError(message);
      setWeather(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { weather, error, isLoading, fetchWeather };
}
