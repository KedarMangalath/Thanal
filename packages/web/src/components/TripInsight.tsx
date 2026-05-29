import { Sparkles, Camera } from "lucide-react";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { askAssistant } from "../services/api";
import type { LatLng, RouteAnalysis, WeatherSnapshot } from "@thanal/shared";

type TripInsightProps = {
  mode: "bus" | "bike" | "walk" | "train";
  start: LatLng | null;
  end: LatLng | null;
  departureTime: string;
  analysis: RouteAnalysis | null;
  weather: WeatherSnapshot | null;
  language: "english" | "manglish" | "malayalam";
};

export default function TripInsight({ mode, start, end, departureTime, analysis, weather, language }: TripInsightProps) {
  const [insight, setInsight] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Force re-fetch when language changes
  useEffect(() => {
    setHasLoaded(false);
  }, [language]);

  useEffect(() => {
    if (!analysis || !weather || !start || !end) {
      setInsight("");
      setHasLoaded(false);
      return;
    }

    if (hasLoaded) return;

    let cancelled = false;
    setIsLoading(true);

    const seatSide = analysis.recommendedSeat === "left" ? "left" : analysis.recommendedSeat === "right" ? "right" : "either";
    const sunLeft = Math.round(analysis.directSunMinutesBySide.left);
    const sunRight = Math.round(analysis.directSunMinutesBySide.right);
    const glareCount = analysis.glareWindows.length;
    const speedCams = analysis.speedCameras?.length ?? 0;
    const shadePercent = analysis.shadeCoverPercent ?? 0;
    let message = `Summarize this route in 2-3 short sentences: mode is ${mode}, seat recommendation is ${seatSide} side, sun on left for ${sunLeft} min and right for ${sunRight} min, ${glareCount} glare segments, temperature ${weather.temperatureC}°C, UV index ${weather.uvIndex}, rain probability ${weather.precipitationProbability ?? 0}%, and there are ${speedCams} AI speed cameras on the route.`;
    
    if (mode === "bike") {
      message += ` Since this is a bike ride, completely ignore the "seat side" recommendation. The route has ${shadePercent}% natural tree shade cover. If shade is high (>30%), mention it's a pleasantly shaded ride! Also specifically mention gear recommendations (e.g. tinted visor if high glare, sunscreen/UV sleeves if high UV or heat, raincoat if rain probability is >30%), and suggest taking a rest stop if duration > 60 min in high heat. Make it punchy.`;
    }

    askAssistant({
      message,
      mode,
      start,
      end,
      departureTime,
      language
    })
      .then((response) => {
        if (!cancelled) {
          // If backend returned generic fallback (no API key), use our richer local fallback
          if (response.answer === "Could not generate AI insight." || response.model === "deterministic-fallback") {
            setInsight(generateFallbackInsight(analysis, weather, mode));
          } else {
            setInsight(response.answer);
          }
          setHasLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setInsight(generateFallbackInsight(analysis, weather, mode));
          setHasLoaded(true);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [analysis, weather, start, end, mode, departureTime, hasLoaded]);

  if (!analysis || !weather) return null;

  return (
    <div className="glass-card insight-card">
      <div className="insight-header">
        <Sparkles size={14} />
        Thanal says
      </div>
      {isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <div className="loading-shimmer" style={{ width: "90%" }} />
          <div className="loading-shimmer" style={{ width: "70%" }} />
        </div>
      ) : (
        <div className="insight-text">
          <ReactMarkdown>{insight}</ReactMarkdown>
        </div>
      )}
      
      {(analysis.speedCameras?.length ?? 0) > 0 && mode !== "train" && mode !== "walk" && (
        <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--surface)', border: '1px solid var(--warning)', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
          <div style={{ background: 'var(--warning)', padding: '5px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Camera size={14} color="var(--bg)" />
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--warning)', marginBottom: '1px' }}>{analysis.speedCameras?.length} Speed Cameras Detected</div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Drive safely. Community verified locations on map.</div>
          </div>
        </div>
      )}
    </div>
  );
}

function generateFallbackInsight(analysis: RouteAnalysis, weather: WeatherSnapshot, mode: string): string {
  const parts: string[] = [];

  const { left, right } = analysis.directSunMinutesBySide;
  
  if (mode === "bike") {
    if (weather.uvIndex >= 8 || weather.temperatureC >= 32) {
      parts.push("Scorching heat! Wear UV sleeves, sunscreen, and stay hydrated.");
    }
    if (analysis.glareWindows.length > 0) {
      parts.push(`Expect intense glare on ${analysis.glareWindows.length} segments. A tinted visor is highly recommended.`);
    }
    if (analysis.totalDurationMinutes > 60 && weather.temperatureC >= 32) {
      parts.push("Long ride in the heat. Plan a shaded rest stop halfway.");
    }
    const shadePercent = analysis.shadeCoverPercent ?? 0;
    if (shadePercent > 30) {
      parts.push(`Great news! ${shadePercent}% of this route is naturally shaded by trees.`);
    } else if (shadePercent > 0) {
      parts.push(`Only ${shadePercent}% of this route has tree shade.`);
    }
  } else {
    if (analysis.recommendedSeat === "left") {
      parts.push(`Sun hits your right side for ${Math.round(right)} min. Sit on the left to stay shaded.`);
    } else if (analysis.recommendedSeat === "right") {
      parts.push(`Sun hits your left side for ${Math.round(left)} min. Sit on the right to stay shaded.`);
    } else {
      parts.push("Sun exposure is roughly equal on both sides. Either seat works.");
    }
    if (analysis.glareWindows.length > 0) {
      parts.push(`Watch for glare on ${analysis.glareWindows.length} segment${analysis.glareWindows.length > 1 ? "s" : ""}.`);
    }
  }

  if (mode !== "bike" && weather.uvIndex >= 8) {
    parts.push(`UV index is ${weather.uvIndex} (very high). Sunscreen and shades recommended.`);
  }

  if ((weather.precipitationProbability ?? 0) >= 50) {
    parts.push(`${weather.precipitationProbability}% rain chance. Carry rain gear.`);
  }

  if (analysis.speedCameras && analysis.speedCameras.length > 0) {
    parts.push(`Watch out! There are ${analysis.speedCameras.length} AI speed cameras on this route.`);
  }

  return parts.join(" ");
}
