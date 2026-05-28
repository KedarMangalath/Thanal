import type { RouteAnalysis } from "@thanal/shared";
import { StyleSheet, Text, View } from "react-native";

export default function SeatRecommendation({ analysis }: { analysis: RouteAnalysis }) {
  const label =
    analysis.recommendedSeat === "either"
      ? "Either side"
      : analysis.recommendedSeat === "left"
        ? "Sit left"
        : "Sit right";

  return (
    <View style={styles.card}>
      <Text style={styles.label}>Recommended seat</Text>
      <Text style={styles.value}>{label}</Text>
      <Text style={styles.meta}>
        {Math.round(analysis.directSunMinutesBySide.left)} min left sun,{" "}
        {Math.round(analysis.directSunMinutesBySide.right)} min right sun
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderColor: "#d7e0db",
    borderRadius: 8,
    borderWidth: 1,
    gap: 5,
    padding: 16
  },
  label: {
    color: "#66736d"
  },
  value: {
    color: "#0f766e",
    fontSize: 30,
    fontWeight: "900"
  },
  meta: {
    color: "#66736d"
  }
});
