import type { LatLng, RouteAnalysis } from "@thanal/shared";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import MapPicker from "../../components/MapPicker";
import AssistantCard from "../../components/AssistantCard";
import PlaceSearch from "../../components/PlaceSearch";
import SeatRecommendation from "../../components/SeatRecommendation";
import SunTimeline from "../../components/SunTimeline";
import { useWeather } from "../../hooks/useWeather";
import { useComfortScore } from "../../hooks/useComfortScore";
import ComfortScore from "../../components/ComfortScore";
import RainWindow from "../../components/RainWindow";
import RouteOptions from "../../components/RouteOptions";
import { fetchRouteOptions, type RouteOption } from "../../utils/api";

export default function BusScreen() {
  const [start, setStart] = useState<LatLng | null>(null);
  const [end, setEnd] = useState<LatLng | null>(null);
  const [startName, setStartName] = useState("Tap map");
  const [endName, setEndName] = useState("Tap map");
  const weather = useWeather();
  const comfort = useComfortScore(weather.weather);
  const [analysis, setAnalysis] = useState<RouteAnalysis | null>(null);
  const [options, setOptions] = useState<RouteOption[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<LatLng[]>([]);
  const [isRouting, setIsRouting] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  function onPick(point: LatLng) {
    if (!start || (start && end)) {
      setStart(point);
      setStartName("Map point");
      setEnd(null);
      setEndName("Tap map");
      setAnalysis(null);
      setOptions([]);
      setSelectedRouteId(null);
      setRouteCoordinates([]);
      setRouteError(null);
      return;
    }

    setEnd(point);
    setEndName("Map point");
    setOptions([]);
    setSelectedRouteId(null);
    setRouteCoordinates([]);
    setRouteError(null);
  }

  function selectStart(point: LatLng, name: string) {
    setStart(point);
    setStartName(name);
    setAnalysis(null);
    setOptions([]);
    setSelectedRouteId(null);
    setRouteCoordinates([]);
    setRouteError(null);
  }

  function selectEnd(point: LatLng, name: string) {
    setEnd(point);
    setEndName(name);
    setAnalysis(null);
    setOptions([]);
    setSelectedRouteId(null);
    setRouteCoordinates([]);
    setRouteError(null);
  }

  async function analyzeTappedRoute() {
    if (!start || !end) return;
    setIsRouting(true);
    setRouteError(null);

    try {
      const response = await fetchRouteOptions({
        start,
        end,
        departureTime: new Date().toISOString()
      });
      const option =
        response.options.find((candidate) => candidate.id === response.recommendedOptionId) ??
        response.options[0];

      setOptions(response.options);
      setSelectedRouteId(option?.id ?? response.recommendedOptionId ?? null);
      setRouteCoordinates(option?.coordinates ?? []);
      setAnalysis(option?.analysis ?? null);
      await weather.fetchWeather(start);
    } catch (error) {
      setRouteError(error instanceof Error ? error.message : "Road route failed.");
      setOptions([]);
      setRouteCoordinates([]);
      setAnalysis(null);
    } finally {
      setIsRouting(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Bus seat picker</Text>
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

      <View style={styles.pointPanel}>
        <Point label="Start" point={start} name={startName} />
        <Point label="Destination" point={end} name={endName} />
      </View>

      <Pressable style={styles.button} onPress={analyzeTappedRoute}>
        <Text style={styles.buttonText}>
          {isRouting ? "Routing roads..." : "Analyze sun exposure"}
        </Text>
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
      <AssistantCard mode="bus" start={start} end={end} />
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
