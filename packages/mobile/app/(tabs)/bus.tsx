import { analyzeRoute, type LatLng, type RouteAnalysis } from "@thanal/shared";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import MapPicker from "../../components/MapPicker";
import SeatRecommendation from "../../components/SeatRecommendation";
import SunTimeline from "../../components/SunTimeline";
import { useRoute } from "../../hooks/useRoute";
import { useWeather } from "../../hooks/useWeather";
import { useComfortScore } from "../../hooks/useComfortScore";
import ComfortScore from "../../components/ComfortScore";
import RainWindow from "../../components/RainWindow";

const sampleRoute: LatLng[] = [
  { lat: 8.5241, lng: 76.9366 },
  { lat: 9.4981, lng: 76.3388 },
  { lat: 10.5276, lng: 76.2144 }
];

export default function BusScreen() {
  const [start, setStart] = useState<LatLng | null>(sampleRoute[0]);
  const [end, setEnd] = useState<LatLng | null>(sampleRoute[2]);
  const route = useRoute();
  const weather = useWeather();
  const comfort = useComfortScore(weather.weather);
  const [analysis, setAnalysis] = useState<RouteAnalysis | null>(() =>
    analyzeRoute(sampleRoute, { departureTime: new Date(), averageSpeedKmh: 42 })
  );

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

  async function analyzeTappedRoute() {
    if (!start || !end) return;
    const routed = await route.fetchRoute(start, end);
    const averageSpeedKmh =
      routed.distanceMeters && routed.durationSeconds
        ? Math.max(18, (routed.distanceMeters / routed.durationSeconds) * 3.6)
        : 34;

    setAnalysis(analyzeRoute(routed.coordinates, { departureTime: new Date(), averageSpeedKmh }));
    await weather.fetchWeather(start);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Bus seat picker</Text>
      <MapPicker start={start} end={end} route={route.coordinates.length > 0 ? route.coordinates : sampleRoute} onPick={onPick} />

      <View style={styles.pointPanel}>
        <Point label="Start" point={start} />
        <Point label="Destination" point={end} />
      </View>

      <Pressable style={styles.button} onPress={analyzeTappedRoute}>
        <Text style={styles.buttonText}>
          {route.isLoading ? "Routing roads..." : "Analyze sun exposure"}
        </Text>
      </Pressable>

      {route.error ? <Text style={styles.warning}>{route.error} Using a direct line fallback.</Text> : null}
      {weather.error ? <Text style={styles.warning}>{weather.error}</Text> : null}

      {analysis ? (
        <>
          <SeatRecommendation analysis={analysis} />
          <SunTimeline analysis={analysis} />
          {comfort ? <ComfortScore score={comfort.score} label={comfort.label} /> : null}
          {weather.weather ? (
            <RainWindow probability={weather.weather.precipitationProbability ?? 0} />
          ) : null}
        </>
      ) : null}
    </ScrollView>
  );
}

function Point({ label, point }: { label: string; point: LatLng | null }) {
  return (
    <View style={styles.pointRow}>
      <Text style={styles.pointLabel}>{label}</Text>
      <Text style={styles.pointValue}>
        {point ? `${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}` : "Tap map"}
      </Text>
    </View>
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
  pointPanel: {
    backgroundColor: "#ffffff",
    borderColor: "#d7e0db",
    borderRadius: 8,
    borderWidth: 1
  },
  pointRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 14
  },
  pointLabel: {
    color: "#66736d"
  },
  pointValue: {
    color: "#17211f",
    fontWeight: "700"
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
