import type { RouteAnalysis } from "@thanal/shared";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { RouteOption } from "../utils/api";
import Reveal from "./Reveal";

type Props = {
  options: RouteOption[];
  selectedId: string | null;
  onSelect: (option: RouteOption) => void;
  title?: string;
};

export default function RouteOptions({ options, selectedId, onSelect, title = "Choose a route" }: Props) {
  if (options.length === 0) return null;

  return (
    <Reveal style={styles.card}>
      <View style={styles.headingRow}>
        <Text style={styles.label}>{title}</Text>
        <Text style={styles.count}>{options.length}</Text>
      </View>
      {options.map((option) => (
        <Pressable
          key={option.id}
          style={[styles.option, selectedId === option.id ? styles.active : null]}
          onPress={() => onSelect(option)}
        >
          <Text style={styles.optionLabel}>{option.label}</Text>
          <Text style={styles.optionTitle}>{Math.round(option.analysis.totalDurationMinutes)} min</Text>
          <Text style={styles.optionMeta}>
            {(option.analysis.totalDistanceMeters / 1000).toFixed(1)} km -{" "}
            {formatSeat(option.analysis.recommendedSeat)}
          </Text>
          {option.serviceHint ? <Text style={styles.optionHint}>{option.serviceHint}</Text> : null}
          <Text style={styles.tapHint}>Tap to open map</Text>
        </Pressable>
      ))}
    </Reveal>
  );
}

function formatSeat(seat: RouteAnalysis["recommendedSeat"]) {
  if (seat === "either") return "Either side";
  return seat === "left" ? "Sit left" : "Sit right";
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(255,255,255,0.94)",
    borderColor: "#d7e0db",
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
    padding: 12
  },
  headingRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  label: {
    color: "#66736d",
    fontWeight: "800"
  },
  count: {
    color: "#17211f",
    fontWeight: "800"
  },
  option: {
    backgroundColor: "#f8faf9",
    borderColor: "#d7e0db",
    borderRadius: 12,
    borderWidth: 1,
    gap: 3,
    padding: 12
  },
  active: {
    backgroundColor: "#eef2ff",
    borderColor: "#8b7cf6"
  },
  optionLabel: {
    color: "#66736d",
    fontSize: 12,
    fontWeight: "700"
  },
  optionTitle: {
    color: "#17211f",
    fontSize: 18,
    fontWeight: "800"
  },
  optionMeta: {
    color: "#66736d",
    fontSize: 13
  },
  optionHint: {
    color: "#5b35f0",
    fontSize: 12,
    fontWeight: "700"
  },
  tapHint: {
    color: "#0f766e",
    fontSize: 12,
    fontWeight: "800"
  }
});
