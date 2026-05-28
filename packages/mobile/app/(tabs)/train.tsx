import type { LatLng, RouteAnalysis } from "@thanal/shared";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import ComfortScore from "../../components/ComfortScore";
import AssistantCard from "../../components/AssistantCard";
import MapPicker from "../../components/MapPicker";
import PlaceSearch from "../../components/PlaceSearch";
import RainWindow from "../../components/RainWindow";
import RouteOptions from "../../components/RouteOptions";
import SeatRecommendation from "../../components/SeatRecommendation";
import SunTimeline from "../../components/SunTimeline";
import { useComfortScore } from "../../hooks/useComfortScore";
import { useWeather } from "../../hooks/useWeather";
import { fetchRailRoute, searchRailStations, type RouteOption } from "../../utils/api";

type FlowStage = "entry" | "routes" | "map";

export default function TrainScreen() {
  const [start, setStart] = useState<LatLng | null>(null);
  const [end, setEnd] = useState<LatLng | null>(null);
  const [route, setRoute] = useState<LatLng[]>([]);
  const [options, setOptions] = useState<RouteOption[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<RouteAnalysis | null>(null);
  const [status, setStatus] = useState("Search railway stations or tap the map.");
  const [stage, setStage] = useState<FlowStage>("entry");
  const weather = useWeather();
  const comfort = useComfortScore(weather.weather);

  function onPick(point: LatLng) {
    if (!start || (start && end)) {
      setStart(point);
      setEnd(null);
      setAnalysis(null);
      setRoute([]);
      setOptions([]);
      setSelectedRouteId(null);
      setStage("entry");
      setStatus("Start set. Pick destination station.");
      return;
    }

    setEnd(point);
    setStage("entry");
    setStatus("Destination set. Analyze when ready.");
  }

  function selectStart(point: LatLng, name: string) {
    setStart(point);
    setAnalysis(null);
    setOptions([]);
    setSelectedRouteId(null);
    setRoute([]);
    setStage("entry");
    setStatus(`Start: ${name}`);
  }

  function selectEnd(point: LatLng, name: string) {
    setEnd(point);
    setAnalysis(null);
    setOptions([]);
    setSelectedRouteId(null);
    setRoute([]);
    setStage("entry");
    setStatus(`Destination: ${name}`);
  }

  async function analyzeTrain() {
    if (!start || !end) return;
    setStatus("Finding rail route.");

    try {
      const rail = await fetchRailRoute({
        start,
        end,
        departureTime: new Date().toISOString()
      });

      const option =
        rail.options.find((candidate) => candidate.id === rail.recommendedOptionId) ?? rail.options[0];
      setOptions(rail.options);
      setSelectedRouteId(option?.id ?? rail.recommendedOptionId ?? null);
      setRoute(option?.coordinates ?? rail.coordinates);
      setAnalysis(option?.analysis ?? rail.analysis);
      await weather.fetchWeather(start);
      setStage("routes");
      setStatus(`${rail.from.name} to ${rail.to.name}. Pick a rail route.`);
    } catch {
      setStatus("Could not analyze this rail route.");
      setStage("entry");
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Train seat picker</Text>
      <PlaceSearch label="Boarding station" searcher={searchRailStations} onSelect={selectStart} />
      <PlaceSearch label="Destination station" searcher={searchRailStations} onSelect={selectEnd} />
      {stage === "map" ? (
        <MapPicker
          start={start}
          end={end}
          route={route}
          routes={options}
          activeRouteId={selectedRouteId}
          onPick={onPick}
        />
      ) : (
        <View style={styles.entryCard}>
          <Text style={styles.entryTitle}>Search railway stations first</Text>
          <Text style={styles.entryBody}>
            Thanal will compare coastal and Kottayam-side rail corridors before opening the map.
          </Text>
        </View>
      )}

      <Text style={styles.status}>{status}</Text>

      <Pressable style={styles.button} onPress={analyzeTrain}>
        <Text style={styles.buttonText}>Analyze train sun side</Text>
      </Pressable>

      <RouteOptions
        options={options}
        selectedId={selectedRouteId}
        onSelect={(option) => {
          setSelectedRouteId(option.id);
          setRoute(option.coordinates);
          setAnalysis(option.analysis);
          setStage("map");
        }}
      />

      {analysis && stage === "map" ? (
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
      <AssistantCard mode="train" start={start} end={end} />
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
  status: {
    color: "#66736d",
    lineHeight: 20
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
  entryCard: {
    backgroundColor: "rgba(255,255,255,0.92)",
    borderColor: "#d7e0db",
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
    padding: 16
  },
  entryTitle: {
    color: "#17211f",
    fontSize: 16,
    fontWeight: "800"
  },
  entryBody: {
    color: "#66736d",
    lineHeight: 20
  }
});
