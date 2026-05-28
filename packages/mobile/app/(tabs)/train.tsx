import type { LatLng, RouteAnalysis } from "@thanal/shared";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import ComfortScore from "../../components/ComfortScore";
import MapPicker from "../../components/MapPicker";
import PlaceSearch from "../../components/PlaceSearch";
import RainWindow from "../../components/RainWindow";
import SeatRecommendation from "../../components/SeatRecommendation";
import SunTimeline from "../../components/SunTimeline";
import { useComfortScore } from "../../hooks/useComfortScore";
import { useWeather } from "../../hooks/useWeather";
import { fetchRailRoute, searchRailStations } from "../../utils/api";

export default function TrainScreen() {
  const [start, setStart] = useState<LatLng | null>(null);
  const [end, setEnd] = useState<LatLng | null>(null);
  const [route, setRoute] = useState<LatLng[]>([]);
  const [analysis, setAnalysis] = useState<RouteAnalysis | null>(null);
  const [status, setStatus] = useState("Search railway stations or tap the map.");
  const weather = useWeather();
  const comfort = useComfortScore(weather.weather);

  function onPick(point: LatLng) {
    if (!start || (start && end)) {
      setStart(point);
      setEnd(null);
      setAnalysis(null);
      setRoute([]);
      setStatus("Start set. Pick destination station.");
      return;
    }

    setEnd(point);
    setStatus("Destination set. Analyze when ready.");
  }

  function selectStart(point: LatLng, name: string) {
    setStart(point);
    setAnalysis(null);
    setStatus(`Start: ${name}`);
  }

  function selectEnd(point: LatLng, name: string) {
    setEnd(point);
    setAnalysis(null);
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

      setRoute(rail.coordinates);
      setAnalysis(rail.analysis);
      await weather.fetchWeather(start);
      setStatus(`${rail.from.name} to ${rail.to.name}. Confidence: ${rail.confidence}.`);
    } catch {
      setStatus("Could not analyze this rail route.");
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Train seat picker</Text>
      <PlaceSearch label="Boarding station" searcher={searchRailStations} onSelect={selectStart} />
      <PlaceSearch label="Destination station" searcher={searchRailStations} onSelect={selectEnd} />
      <MapPicker start={start} end={end} route={route} onPick={onPick} />

      <Text style={styles.status}>{status}</Text>

      <Pressable style={styles.button} onPress={analyzeTrain}>
        <Text style={styles.buttonText}>Analyze train sun side</Text>
      </Pressable>

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
  }
});
