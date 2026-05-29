import type { LatLng, RouteAnalysis } from "@thanal/shared";
import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, Pressable, ScrollView, Dimensions, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage, useTheme } from "../../theme";
import MapPicker from "../../components/MapPicker";
import PlaceSearch from "../../components/PlaceSearch";
import RouteOptions from "../../components/RouteOptions";
import SeatRecommendation from "../../components/SeatRecommendation";
import SunTimeline from "../../components/SunTimeline";
import ComfortScore from "../../components/ComfortScore";
import RainWindow from "../../components/RainWindow";
import GlareWarning from "../../components/GlareWarning";
import TripInsight from "../../components/TripInsight";
import SunTrajectoryChart from "../../components/SunTrajectoryChart";
import { useWeather } from "../../hooks/useWeather";
import { useComfortScore } from "../../hooks/useComfortScore";
import { fetchRouteOptions, fetchRailRoute, type RouteOption } from "../../utils/api";

type TravelMode = "bus" | "bike" | "walk" | "train";

export default function TripScreen() {
  const { theme } = useTheme();
  
  const [mode, setMode] = useState<TravelMode>("bus");
  const [start, setStart] = useState<LatLng | null>(null);
  const [end, setEnd] = useState<LatLng | null>(null);
  const [startName, setStartName] = useState("");
  const [endName, setEndName] = useState("");

  const [routeOptions, setRouteOptions] = useState<RouteOption[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [route, setRoute] = useState<LatLng[]>([]);
  const [analysis, setAnalysis] = useState<RouteAnalysis | null>(null);
  
  const [isRouting, setIsRouting] = useState(false);
  const [status, setStatus] = useState("");
  const { language } = useLanguage();
  
  const weather = useWeather();
  const comfort = useComfortScore(weather.weather);

  useEffect(() => {
    if (start && end) {
      void analyzeTrip();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start, end, mode]);

  function resetAnalysis() {
    setRouteOptions([]);
    setSelectedRouteId(null);
    setRoute([]);
    setAnalysis(null);
    setStatus("");
  }

  async function analyzeTrip() {
    if (!start || !end) return;
    
    setIsRouting(true);
    setStatus("Finding routes...");
    resetAnalysis();
    
    try {
      if (mode === "train") {
        const rail = await fetchRailRoute({ start, end, departureTime: new Date().toISOString() });
        const option = rail.options.find((c) => c.id === rail.recommendedOptionId) ?? rail.options[0];
        
        setRouteOptions(rail.options);
        setSelectedRouteId(option?.id ?? rail.recommendedOptionId);
        setRoute(option?.coordinates ?? rail.coordinates);
        setAnalysis(option?.analysis ?? rail.analysis);
        await weather.fetchWeather(start);
        setStatus("");
      } else {
        const response = await fetchRouteOptions({ start, end, departureTime: new Date().toISOString() });
        const options = mode === "bike" 
          ? response.options.map(o => ({ ...o, label: o.label.replace("road", "ride") }))
          : response.options;
          
        const option = options.find((c) => c.id === response.recommendedOptionId) ?? options[0];
        
        setRouteOptions(options);
        setSelectedRouteId(option?.id ?? response.recommendedOptionId);
        setRoute(option?.coordinates ?? []);
        setAnalysis(option?.analysis ?? null);
        await weather.fetchWeather(start);
        setStatus("");
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Route analysis failed");
    } finally {
      setIsRouting(false);
    }
  }

  function handleMapPick(point: LatLng) {
    if (start && end) return; // Map locked if both are set

    if (!start) {
      setStart(point);
      setStartName("Map point");
      setStatus("Start set. Tap destination.");
    } else {
      setEnd(point);
      setEndName("Map point");
      resetAnalysis();
    }
  }

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <View style={styles.mapLayer}>
        <MapPicker
          start={start}
          end={end}
          route={route}
          routes={routeOptions}
          activeRouteId={selectedRouteId}
          onPick={handleMapPick}
        />
      </View>

      <SafeAreaView style={styles.overlayContainer} pointerEvents="box-none">
        {/* Top Search Card */}
        <View style={styles.searchCard}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <View style={styles.modeTabs}>
              <ModeTab mode="bus" current={mode} icon="bus" label="Bus/Car" onChange={setMode} theme={theme} />
              <ModeTab mode="bike" current={mode} icon="bicycle" label="Bike" onChange={setMode} theme={theme} />
              <ModeTab mode="train" current={mode} icon="train" label="Train" onChange={setMode} theme={theme} />
            </View>
          </View>
          
          <PlaceSearch 
            label="From" 
            onSelect={(p, n) => { setStart(p); setStartName(n); }} 
            isTrain={mode === "train"}
          />
          <PlaceSearch 
            label="To" 
            onSelect={(p, n) => { setEnd(p); setEndName(n); }} 
            isTrain={mode === "train"}
          />
        </View>

        {isRouting && (
          <View style={styles.statusCard}>
            <ActivityIndicator color={theme.colors.accent} />
            <Text style={styles.statusText}>{status}</Text>
          </View>
        )}
        
        {!isRouting && status ? (
          <View style={styles.statusCard}>
            <Text style={[styles.statusText, { color: theme.colors.warning }]}>{status}</Text>
          </View>
        ) : null}

        {/* Bottom Sheet for Analysis (Simple View) */}
        {routeOptions.length > 0 && !isRouting && (
          <View style={styles.bottomSheet}>
            <ScrollView contentContainerStyle={styles.bottomSheetContent} showsVerticalScrollIndicator={false}>
              <RouteOptions
                options={routeOptions}
                selectedId={selectedRouteId}
                title="Routes"
                onSelect={(option) => {
                  setSelectedRouteId(option.id);
                  setRoute(option.coordinates);
                  setAnalysis(option.analysis);
                }}
              />
              
              {analysis && (
                <View style={styles.analysisContainer}>
                  <TripInsight
                    mode={mode}
                    start={start}
                    end={end}
                    departureTime={new Date().toISOString()}
                    analysis={analysis}
                    weather={weather.weather}
                    language={language}
                  />
                  <SeatRecommendation analysis={analysis} />
                  <SunTimeline analysis={analysis} />
                  <SunTrajectoryChart analysis={analysis} />
                  {mode === "bike" && analysis.glareWindows.length > 0 && (
                    <GlareWarning count={analysis.glareWindows.length} />
                  )}
                  {comfort && <ComfortScore score={comfort.score} label={comfort.label} />}
                  {weather.weather && (
                    <RainWindow
                      probability={weather.weather.precipitationProbability ?? 0}
                      timeline={weather.weather.rainTimeline}
                    />
                  )}
                </View>
              )}
            </ScrollView>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

function ModeTab({ 
  mode, current, icon, label, onChange, theme 
}: { 
  mode: TravelMode; current: TravelMode; icon: any; label: string; onChange: (m: TravelMode) => void; theme: any;
}) {
  const isActive = mode === current;
  return (
    <Pressable 
      style={[
        { flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: theme.radius.md },
        isActive ? { backgroundColor: theme.colors.accentSoft } : {}
      ]} 
      onPress={() => onChange(mode)}
    >
      <Ionicons name={icon} size={18} color={isActive ? theme.colors.accent : theme.colors.textSecondary} />
      <Text style={[
        { fontSize: 12, marginTop: 4, fontWeight: "600" },
        { color: isActive ? theme.colors.accent : theme.colors.textSecondary }
      ]}>
        {label}
      </Text>
    </Pressable>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  mapLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayContainer: {
    flex: 1,
    justifyContent: "space-between",
    padding: theme.spacing.lg,
  },
  searchCard: {
    backgroundColor: theme.colors.mapOverlayBg,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    gap: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  modeTabs: {
    flexDirection: "row",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statusCard: {
    backgroundColor: theme.colors.surface,
    alignSelf: "center",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.full,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statusText: {
    color: theme.colors.textPrimary,
    fontWeight: "600",
  },
  bottomSheet: {
    backgroundColor: theme.colors.mapOverlayBg,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    maxHeight: Dimensions.get("window").height * 0.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  bottomSheetContent: {
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  analysisContainer: {
    gap: theme.spacing.md,
  }
});
