import type { RouteAnalysis } from "@thanal/shared";
import React, { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View, FlatList, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useCommuteNotifications } from "../../hooks/useCommuteNotifications";
import { API_BASE_URL, deleteSavedRoute } from "../../utils/api";
import { useTheme } from "../../theme";

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
  const { theme } = useTheme();
  const [routes, setRoutes] = useState<SavedRoute[]>([]);
  const [recommendations, setRecommendations] = useState<Record<number, RouteAnalysis>>({});
  const [status, setStatus] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { notificationStatus, scheduleReminder } = useCommuteNotifications();

  const loadRoutes = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/saved-routes`);
      if (!response.ok) throw new Error("Saved route request failed.");
      setRoutes(await response.json());
      setStatus("");
    } catch {
      setStatus("Could not load saved commutes. Is the backend running?");
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadRoutes();
  }, [loadRoutes]);

  async function refreshRoute(route: SavedRoute) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/saved-routes/${route.id}/refresh?departureTime=${encodeURIComponent(
          new Date().toISOString()
        )}`
      );

      if (!response.ok) throw new Error("Refresh failed.");
      const data = (await response.json()) as { analysis: RouteAnalysis };
      setRecommendations((current) => ({ ...current, [route.id]: data.analysis }));
    } catch {
      setStatus(`Could not refresh ${route.name}.`);
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
    } catch {
      setStatus(`Could not delete ${route.name}.`);
    }
  }

  const styles = createStyles(theme);

  const renderItem = ({ item: route }: { item: SavedRoute }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <Ionicons 
            name={route.mode === 'train' ? 'train' : route.mode === 'bike' ? 'bicycle' : 'bus'} 
            size={18} 
            color={theme.colors.accent} 
          />
          <Text style={styles.cardTitle}>{route.name}</Text>
        </View>
        <Pressable 
          style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.7 }]} 
          onPress={() => removeRoute(route)}
        >
          <Ionicons name="trash-outline" size={18} color={theme.colors.danger} />
        </Pressable>
      </View>
      
      {recommendations[route.id] ? (
        <View style={styles.recommendationBox}>
          <Text style={styles.recommendationLabel}>Recommendation for today</Text>
          <Text style={styles.recommendationText}>
            {formatSeat(recommendations[route.id].recommendedSeat)} · {Math.round(recommendations[route.id].totalDurationMinutes)} min
          </Text>
        </View>
      ) : null}
      
      <View style={styles.actionRow}>
        <Pressable 
          style={({ pressed }) => [styles.secondaryButton, pressed && { backgroundColor: theme.colors.surfaceActive }]} 
          onPress={() => refreshRoute(route)}
        >
          <Ionicons name="refresh" size={14} color={theme.colors.textPrimary} />
          <Text style={styles.secondaryButtonText}>Refresh</Text>
        </Pressable>
        <Pressable 
          style={({ pressed }) => [styles.secondaryButton, pressed && { backgroundColor: theme.colors.surfaceActive }]} 
          onPress={() => scheduleReminder(route.name)}
        >
          <Ionicons name="notifications-outline" size={14} color={theme.colors.textPrimary} />
          <Text style={styles.secondaryButtonText}>Remind</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Saved commutes</Text>
      </View>
      
      {(status || notificationStatus) && (
        <View style={styles.statusBox}>
          <Text style={styles.statusText}>{status || notificationStatus}</Text>
        </View>
      )}

      <FlatList
        data={routes}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl 
            refreshing={isRefreshing} 
            onRefresh={loadRoutes} 
            tintColor={theme.colors.accent}
          />
        }
        ListEmptyComponent={
          !isRefreshing ? (
            <View style={styles.emptyState}>
              <Ionicons name="bookmark-outline" size={48} color={theme.colors.borderStrong} />
              <Text style={styles.emptyText}>No saved commutes yet.</Text>
              <Text style={styles.emptySubtext}>Save a route from the Trip planner.</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

function formatSeat(seat: RouteAnalysis["recommendedSeat"]) {
  if (seat === "either") return "Either side";
  return seat === "left" ? "Sit left" : "Sit right";
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 24,
    fontWeight: "800",
  },
  statusBox: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surfaceHover,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statusText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
  },
  listContent: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    padding: theme.spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    flex: 1,
  },
  cardTitle: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
  },
  deleteBtn: {
    padding: theme.spacing.xs,
  },
  recommendationBox: {
    backgroundColor: theme.colors.accentSoft,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.sm,
  },
  recommendationLabel: {
    color: theme.colors.accent,
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  recommendationText: {
    color: theme.colors.accent,
    fontSize: 16,
    fontWeight: "800",
  },
  actionRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: theme.colors.surfaceHover,
    borderRadius: theme.radius.md,
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: theme.colors.textPrimary,
    fontWeight: "600",
    fontSize: 13,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: theme.spacing.sm,
  },
  emptyText: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: "600",
    marginTop: theme.spacing.md,
  },
  emptySubtext: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  }
});
