import type { LatLng, RouteAnalysis } from "@thanal/shared";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import GlareWarning from "../../components/GlareWarning";
import MapPicker from "../../components/MapPicker";
import RainWindow from "../../components/RainWindow";
import ComfortScore from "../../components/ComfortScore";
import { useComfortScore } from "../../hooks/useComfortScore";
import { useWeather } from "../../hooks/useWeather";
import AssistantCard from "../../components/AssistantCard";
import PlaceSearch from "../../components/PlaceSearch";
import RouteOptions from "../../components/RouteOptions";
import { fetchRouteOptions, type RouteOption } from "../../utils/api";

export default function RideScreen() {
  const [start, setStart] = useState<LatLng | null>(null);
  const [end, setEnd] = useState<LatLng | null>(null);
  const [analysis, setAnalysis] = useState<RouteAnalysis | null>(null);
  const [options, setOptions] = useState<RouteOption[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<LatLng[]>([]);
  const [isRouting, setIsRouting] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const weather = useWeather();
  const comfort = useComfortScore(weather.weather);

  function onPick(point: LatLng) {
    if (!start || (start && end)) {
      setStart(point);
      setEnd(null);
      setAnalysis(null);
      setOptions([]);
      setSelectedRouteId(null);
      setRouteCoordinates([]);
      setRouteError(null);
      return;
    }

    setEnd(point);
    setOptions([]);
    setSelectedRouteId(null);
    setRouteCoordinates([]);
    setRouteError(null);
  }

  function selectStart(point: LatLng) {
    setStart(point);
    setAnalysis(null);
    setOptions([]);
    setSelectedRouteId(null);
    setRouteCoordinates([]);
    setRouteError(null);
  }

  function selectEnd(point: LatLng) {
    setEnd(point);
    setAnalysis(null);
    setOptions([]);
    setSelectedRouteId(null);
    setRouteCoordinates([]);
    setRouteError(null);
  }

  async function analyzeRide() {
    if (!start || !end) return;
    setIsRouting(true);
    setRouteError(null);

    try {
      const response = await fetchRouteOptions({
        start,
        end,
        departureTime: new Date().toISOString()
      });
      const rideOptions = response.options.map((option) => ({
        ...option,
        label: option.label.replace("Road", "Ride")
      }));
      const option =
        rideOptions.find((candidate) => candidate.id === response.recommendedOptionId) ??
        rideOptions[0];

      setOptions(rideOptions);
      setSelectedRouteId(option?.id ?? response.recommendedOptionId ?? null);
      setRouteCoordinates(option?.coordinates ?? []);
      setAnalysis(option?.analysis ?? null);
      await weather.fetchWeather(start);
    } catch (error) {
      setRouteError(error instanceof Error ? error.message : "Ride route failed.");
      setOptions([]);
      setRouteCoordinates([]);
      setAnalysis(null);
    } finally {
      setIsRouting(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Ride planner</Text>
      <PlaceSearch label="Start" onSelect={selectStart} />
      <PlaceSearch label="Destination" onSelect={selectEnd} />
      <MapPicker
        start={start}
        end={end}
        route={routeCoordinates}
        routes={options}
        activeRouteId={selectedRouteId}
        onPick={onPick}
      />

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Shade preference</Text>
        <View style={styles.toggleOn}>
          <Text style={styles.toggleText}>On</Text>
        </View>
      </View>

      <Pressable style={styles.button} onPress={analyzeRide}>
        <Text style={styles.buttonText}>{isRouting ? "Checking roads..." : "Analyze ride"}</Text>
      </Pressable>

      {routeError ? <Text style={styles.warning}>{routeError}</Text> : null}
      {weather.error ? <Text style={styles.warning}>{weather.error}</Text> : null}
      <RouteOptions
        options={options}
        selectedId={selectedRouteId}
        onSelect={(option) => {
          setSelectedRouteId(option.id);
          setRouteCoordinates(option.coordinates);
          setAnalysis(option.analysis);
        }}
      />

      {analysis ? <GlareWarning count={analysis.glareWindows.length} /> : null}
      {comfort ? <ComfortScore score={comfort.score} label={comfort.label} /> : null}
      {weather.weather ? (
        <RainWindow
          probability={weather.weather.precipitationProbability ?? 0}
          timeline={weather.weather.rainTimeline}
        />
      ) : null}
      <AssistantCard mode="bike" start={start} end={end} />
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
