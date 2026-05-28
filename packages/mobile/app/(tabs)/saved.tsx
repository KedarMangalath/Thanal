import type { RouteAnalysis } from "@thanal/shared";
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useCommuteNotifications } from "../../hooks/useCommuteNotifications";
import { API_BASE_URL, deleteSavedRoute } from "../../utils/api";

type SavedRoute = {
  id: number;
  name: string;
  mode: "bus" | "bike" | "walk" | "train";
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  departureTime: string | null;
};

export default function SavedScreen() {
  const [routes, setRoutes] = useState<SavedRoute[]>([]);
  const [recommendations, setRecommendations] = useState<Record<number, RouteAnalysis>>({});
  const [status, setStatus] = useState("Loading saved commutes.");
  const { notificationStatus, scheduleReminder } = useCommuteNotifications();

  const loadRoutes = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/saved-routes`);
      if (!response.ok) throw new Error("Saved route request failed.");
      setRoutes(await response.json());
      setStatus("Saved commutes loaded.");
    } catch {
      setStatus("Backend is not reachable yet. Start it with npm run dev:backend.");
    }
  }, []);

  useEffect(() => {
    loadRoutes();
  }, [loadRoutes]);

  async function createDemoRoute() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/saved-routes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "TVM to Thrissur",
          mode: "bus",
          start: { lat: 8.5241, lng: 76.9366 },
          end: { lat: 10.5276, lng: 76.2144 },
          departureTime: new Date().toISOString()
        })
      });

      if (!response.ok) throw new Error("Save failed.");
      await loadRoutes();
    } catch {
      setStatus("Could not save the demo commute.");
    }
  }

  async function refreshRoute(route: SavedRoute) {
    setStatus(`Refreshing ${route.name}.`);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/saved-routes/${route.id}/refresh?departureTime=${encodeURIComponent(
          new Date().toISOString()
        )}`
      );

      if (!response.ok) throw new Error("Refresh failed.");
      const data = (await response.json()) as { analysis: RouteAnalysis };
      setRecommendations((current) => ({ ...current, [route.id]: data.analysis }));
      setStatus(`${route.name} refreshed.`);
    } catch {
      setStatus("Could not refresh that commute.");
    }
  }

  async function removeRoute(route: SavedRoute) {
    try {
      await deleteSavedRoute(route.id);
      setRoutes((current) => current.filter((saved) => saved.id !== route.id));
      setRecommendations((current) => {
        const next = { ...current };
        delete next[route.id];
        return next;
      });
      setStatus(`${route.name} deleted.`);
    } catch {
      setStatus("Could not delete that commute.");
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Saved commutes</Text>
      <Pressable style={styles.button} onPress={createDemoRoute}>
        <Text style={styles.buttonText}>Save sample commute</Text>
      </Pressable>
      <Text style={styles.status}>{status}</Text>
      {notificationStatus ? <Text style={styles.status}>{notificationStatus}</Text> : null}
      {routes.map((route) => (
        <View key={route.id} style={styles.card}>
          <Text style={styles.cardTitle}>{route.name}</Text>
          <Text style={styles.cardBody}>
            {route.mode.toUpperCase()} - {route.startLat.toFixed(3)}, {route.startLng.toFixed(3)} to{" "}
            {route.endLat.toFixed(3)}, {route.endLng.toFixed(3)}
          </Text>
          {recommendations[route.id] ? (
            <Text style={styles.recommendation}>
              Today: {formatSeat(recommendations[route.id].recommendedSeat)} -{" "}
              {Math.round(recommendations[route.id].totalDurationMinutes)} min
            </Text>
          ) : null}
          <Pressable style={styles.secondaryButton} onPress={() => refreshRoute(route)}>
            <Text style={styles.secondaryButtonText}>Refresh today</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={() => scheduleReminder(route.name)}>
            <Text style={styles.secondaryButtonText}>Notify in 1 min</Text>
          </Pressable>
          <Pressable style={styles.deleteButton} onPress={() => removeRoute(route)}>
            <Text style={styles.deleteButtonText}>Delete</Text>
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

function formatSeat(seat: RouteAnalysis["recommendedSeat"]) {
  if (seat === "either") return "Either side";
  return seat === "left" ? "Sit left" : "Sit right";
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
  card: {
    backgroundColor: "#ffffff",
    borderColor: "#d7e0db",
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    padding: 16
  },
  cardTitle: {
    color: "#17211f",
    fontSize: 18,
    fontWeight: "800"
  },
  cardBody: {
    color: "#66736d",
    lineHeight: 22
  },
  recommendation: {
    color: "#0f766e",
    fontSize: 16,
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
  status: {
    color: "#66736d",
    lineHeight: 20
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: "#edf2f0",
    borderRadius: 8,
    marginTop: 4,
    padding: 12
  },
  secondaryButtonText: {
    color: "#17211f",
    fontWeight: "800"
  },
  deleteButton: {
    alignItems: "center",
    backgroundColor: "#fff1e8",
    borderRadius: 8,
    marginTop: 4,
    padding: 12
  },
  deleteButtonText: {
    color: "#8a3b12",
    fontWeight: "800"
  }
});
