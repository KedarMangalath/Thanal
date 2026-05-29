import type { LatLng, RouteAnalysis, WeatherSnapshot } from "@thanal/shared";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../theme";
import { askAssistant } from "../utils/api";

type TripInsightProps = {
  mode: "bus" | "bike" | "walk" | "train";
  start: LatLng | null;
  end: LatLng | null;
  departureTime: string;
  analysis: RouteAnalysis | null;
  weather: WeatherSnapshot | null;
  language: "english" | "manglish" | "malayalam";
};

function generateFallbackInsight(analysis: RouteAnalysis, weather: WeatherSnapshot): string {
  const parts: string[] = [];

  const { left, right } = analysis.directSunMinutesBySide;
  if (analysis.recommendedSeat === "left") {
    parts.push(`Sun hits your right side for ${Math.round(right)} min. Sit on the left to stay shaded.`);
  } else if (analysis.recommendedSeat === "right") {
    parts.push(`Sun hits your left side for ${Math.round(left)} min. Sit on the right to stay shaded.`);
  } else {
    parts.push("Sun exposure is roughly equal on both sides. Either seat works.");
  }

  if (weather.uvIndex >= 8) {
    parts.push(`UV index is ${weather.uvIndex} (very high). Sunscreen and shades recommended.`);
  } else if (weather.uvIndex >= 6) {
    parts.push(`UV index is ${weather.uvIndex} (high). Consider sun protection.`);
  }

  if ((weather.precipitationProbability ?? 0) >= 50) {
    parts.push(`${weather.precipitationProbability}% rain chance. Carry an umbrella.`);
  }

  if (analysis.glareWindows.length > 0) {
    parts.push(`Watch for glare on ${analysis.glareWindows.length} segment${analysis.glareWindows.length > 1 ? "s" : ""}.`);
  }

  return parts.join(" ");
}

export default function TripInsight({ mode, start, end, departureTime, analysis, weather, language }: TripInsightProps) {
  const { theme } = useTheme();
  const [insight, setInsight] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

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
    const message = `Summarize this route in 2-3 short sentences: mode is ${mode}, seat recommendation is ${seatSide} side, sun on left for ${sunLeft} min and right for ${sunRight} min, ${glareCount} glare segments, temperature ${weather.temperatureC}°C, UV index ${weather.uvIndex}, rain probability ${weather.precipitationProbability ?? 0}%.`;

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
          setInsight(response.answer);
          setHasLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setInsight(generateFallbackInsight(analysis, weather));
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

  const styles = createStyles(theme);

  const renderMarkdown = (text: string) => {
    // Basic parser for *bold* or **bold**
    const parts = text.split(/(\*\*?[^*]+\*\*?)/g);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <Text key={index} style={{ fontWeight: "bold" }}>{part.slice(2, -2)}</Text>;
      }
      if (part.startsWith("*") && part.endsWith("*")) {
        return <Text key={index} style={{ fontWeight: "bold" }}>{part.slice(1, -1)}</Text>;
      }
      return <Text key={index}>{part}</Text>;
    });
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="sparkles" size={16} color={theme.colors.accent} />
        <Text style={styles.headerTitle}>Thanal says</Text>
      </View>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={theme.colors.accent} size="small" />
          <Text style={styles.loadingText}>Generating insights...</Text>
        </View>
      ) : (
        <Text style={styles.insightText}>{renderMarkdown(insight)}</Text>
      )}
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.md,
      padding: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      gap: theme.spacing.sm
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6
    },
    headerTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: theme.colors.accent
    },
    loadingContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
      paddingVertical: theme.spacing.sm
    },
    loadingText: {
      color: theme.colors.textSecondary,
      fontSize: 14,
      fontStyle: "italic"
    },
    insightText: {
      color: theme.colors.textPrimary,
      fontSize: 14,
      lineHeight: 20
    }
  });
