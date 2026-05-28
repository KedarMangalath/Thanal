import type { RouteAnalysis, VehicleSide } from "@thanal/shared";
import { StyleSheet, View } from "react-native";

export default function SunTimeline({ analysis }: { analysis: RouteAnalysis }) {
  return (
    <View style={styles.card}>
      <View style={styles.timeline}>
        {analysis.timeline.map((segment) => (
          <View
            key={segment.segmentIndex}
            style={[
              styles.segment,
              { flexGrow: Math.max(1, segment.distanceMeters) },
              sideStyle(segment.sunSide)
            ]}
          />
        ))}
      </View>
    </View>
  );
}

function sideStyle(side: VehicleSide) {
  if (side === "left") return styles.left;
  if (side === "right") return styles.right;
  return styles.neutral;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderColor: "#d7e0db",
    borderRadius: 8,
    borderWidth: 1,
    padding: 16
  },
  timeline: {
    backgroundColor: "#edf2f0",
    borderRadius: 6,
    flexDirection: "row",
    height: 18,
    overflow: "hidden"
  },
  segment: {
    minWidth: 2
  },
  left: {
    backgroundColor: "#f97316"
  },
  right: {
    backgroundColor: "#0891b2"
  },
  neutral: {
    backgroundColor: "#b7c4bd"
  }
});
