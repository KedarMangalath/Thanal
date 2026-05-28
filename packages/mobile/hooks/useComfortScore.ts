import { calculateComfortScore, type WeatherSnapshot } from "@thanal/shared";
import { useMemo } from "react";

export function useComfortScore(weather: WeatherSnapshot | null) {
  return useMemo(() => (weather ? calculateComfortScore(weather) : null), [weather]);
}
