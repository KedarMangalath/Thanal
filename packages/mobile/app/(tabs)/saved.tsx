import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { API_BASE_URL } from "../../utils/api";

type SavedRoute = {
  id: number;
  name: string;
  mode: "bus" | "bike" | "walk";
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  departureTime: string | null;
};

export default function SavedScreen() {
  const [routes, setRoutes] = useState<SavedRoute[]>([]);
  const [status, setStatus] = useState("Loading saved commutes.");

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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Saved commutes</Text>
      <Pressable style={styles.button} onPress={createDemoRoute}>
        <Text style={styles.buttonText}>Save sample commute</Text>
      </Pressable>
      <Text style={styles.status}>{status}</Text>
      {routes.map((route) => (
        <View key={route.id} style={styles.card}>
          <Text style={styles.cardTitle}>{route.name}</Text>
          <Text style={styles.cardBody}>
            {route.mode.toUpperCase()} · {route.startLat.toFixed(3)}, {route.startLng.toFixed(3)} to{" "}
            {route.endLat.toFixed(3)}, {route.endLng.toFixed(3)}
          </Text>
        </View>
      ))}
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
  }
});
