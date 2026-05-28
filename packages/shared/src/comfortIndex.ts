import type { ComfortScore, WeatherSnapshot } from "./types";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function calculateComfortScore(weather: WeatherSnapshot): ComfortScore {
  const heat = clamp((weather.temperatureC - 26) * 4, 0, 35);
  const humidity = clamp((weather.relativeHumidity - 55) * 0.45, 0, 25);
  const uv = clamp(weather.uvIndex * 4.5, 0, 30);
  const rain = clamp((weather.precipitationProbability ?? 0) * 0.1, 0, 10);
  const penalty = heat + humidity + uv + rain;
  const score = Math.round(clamp(100 - penalty, 0, 100));

  return {
    score,
    label: score >= 75 ? "good" : score >= 55 ? "warm" : score >= 35 ? "harsh" : "avoid",
    factors: {
      heat: Math.round(heat),
      humidity: Math.round(humidity),
      uv: Math.round(uv),
      rain: Math.round(rain)
    }
  };
}
