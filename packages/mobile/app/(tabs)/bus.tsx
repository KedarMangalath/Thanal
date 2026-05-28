import { analyzeRoute, type LatLng, type RouteAnalysis } from "@thanal/shared";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import MapPicker from "../../components/MapPicker";
import PlaceSearch from "../../components/PlaceSearch";
import SeatRecommendation from "../../components/SeatRecommendation";
import SunTimeline from "../../components/SunTimeline";
import { useRoute } from "../../hooks/useRoute";
import { useWeather } from "../../hooks/useWeather";
import { useComfortScore } from "../../hooks/useComfortScore";
import ComfortScore from "../../components/ComfortScore";
import RainWindow from "../../components/RainWindow";

export default function BusScreen() {
  const [start, setStart] = useState<LatLng | null>(null);
  const [end, setEnd] = useState<LatLng | null>(null);
  const [startName, setStartName] = useState("Tap map");
  const [endName, setEndName] = useState("Tap map");
  const route = useRoute();
  const weather = useWeather();
  const comfort = useComfortScore(weather.weather);
  const [analysis, setAnalysis] = useState<RouteAnalysis | null>(null);

  function onPick(point: LatLng) {
    if (!start || (start && end)) {
      setStart(point);
      setStartName("Map point");
      setEnd(null);
      setEndName("Tap map");
      setAnalysis(null);
      route.reset();
      return;
    }

    setEnd(point);
    setEndName("Map point");
  }

  function selectStart(point: LatLng, name: string) {
    setStart(point);
    setStartName(name);
    setAnalysis(null);
    route.reset();
  }

  function selectEnd(point: LatLng, name: string) {
    setEnd(point);
    setEndName(name);
    setAnalysis(null);
    route.reset();
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
      <PlaceSearch label="Start" onSelect={selectStart} />
      <PlaceSearch label="Destination" onSelect={selectEnd} />
      <MapPicker start={start} end={end} route={route.coordinates} onPick={onPick} />

      <View style={styles.pointPanel}>
        <Point label="Start" point={start} name={startName} />
        <Point label="Destination" point={end} name={endName} />
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
            <RainWindow
              probability={weather.weather.precipitationProbability ?? 0}
              timeline={weather.weather.rainTimeline}
            />
          ) : null}
        </>
      ) : null}
    </ScrollView>
  );
}

function Point({ label, point, name }: { label: string; point: LatLng | null; name: string }) {
  return (
    <View style={styles.pointRow}>
      <Text style={styles.pointLabel}>{label}</Text>
      <Text style={styles.pointValue}>
        {point ? `${name} - ${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}` : "Tap map"}
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
    flex: 1,
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
