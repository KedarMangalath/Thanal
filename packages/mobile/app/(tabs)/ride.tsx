import { analyzeRoute, type LatLng, type RouteAnalysis } from "@thanal/shared";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import GlareWarning from "../../components/GlareWarning";
import MapPicker from "../../components/MapPicker";
import RainWindow from "../../components/RainWindow";
import ComfortScore from "../../components/ComfortScore";
import { useComfortScore } from "../../hooks/useComfortScore";
import { useRoute } from "../../hooks/useRoute";
import { useWeather } from "../../hooks/useWeather";
import PlaceSearch from "../../components/PlaceSearch";

export default function RideScreen() {
  const [start, setStart] = useState<LatLng | null>(null);
  const [end, setEnd] = useState<LatLng | null>(null);
  const [analysis, setAnalysis] = useState<RouteAnalysis | null>(null);
  const route = useRoute();
  const weather = useWeather();
  const comfort = useComfortScore(weather.weather);

  function onPick(point: LatLng) {
    if (!start || (start && end)) {
      setStart(point);
      setEnd(null);
      setAnalysis(null);
      route.reset();
      return;
    }

    setEnd(point);
  }

  function selectStart(point: LatLng) {
    setStart(point);
    setAnalysis(null);
    route.reset();
  }

  function selectEnd(point: LatLng) {
    setEnd(point);
    setAnalysis(null);
    route.reset();
  }

  async function analyzeRide() {
    if (!start || !end) return;
    const routed = await route.fetchRoute(start, end);
    setAnalysis(analyzeRoute(routed.coordinates, { departureTime: new Date(), averageSpeedKmh: 24 }));
    await weather.fetchWeather(start);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Ride planner</Text>
      <PlaceSearch label="Start" onSelect={selectStart} />
      <PlaceSearch label="Destination" onSelect={selectEnd} />
      <MapPicker start={start} end={end} route={route.coordinates} onPick={onPick} />

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Shade preference</Text>
        <View style={styles.toggleOn}>
          <Text style={styles.toggleText}>On</Text>
        </View>
      </View>

      <Pressable style={styles.button} onPress={analyzeRide}>
        <Text style={styles.buttonText}>{route.isLoading ? "Checking roads..." : "Analyze ride"}</Text>
      </Pressable>

      {route.error ? <Text style={styles.warning}>{route.error} Using a direct line fallback.</Text> : null}
      {weather.error ? <Text style={styles.warning}>{weather.error}</Text> : null}

      {analysis ? <GlareWarning count={analysis.glareWindows.length} /> : null}
      {comfort ? <ComfortScore score={comfort.score} label={comfort.label} /> : null}
      {weather.weather ? (
        <RainWindow
          probability={weather.weather.precipitationProbability ?? 0}
          timeline={weather.weather.rainTimeline}
        />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f5f7f3",
    flexGrow: 1,
    gap: 14,
    padding: 16,
    paddingTop: 54
  },
  title: {
    color: "#17211f",
    fontSize: 26,
    fontWeight: "800"
  },
  switchRow: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#d7e0db",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 14
  },
  switchLabel: {
    color: "#17211f",
    fontSize: 16,
    fontWeight: "700"
  },
  toggleOn: {
    backgroundColor: "#0f766e",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7
  },
  toggleText: {
    color: "#ffffff",
    fontWeight: "800"
  },
  button: {
    alignItems: "center",
    backgroundColor: "#0f766e",
    borderRadius: 8,
    padding: 14
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800"
  },
  warning: {
    color: "#a15c00",
    fontSize: 13,
    lineHeight: 18
  }
});
