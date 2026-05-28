import type { RainBucket } from "@thanal/shared";
import { StyleSheet, Text, View } from "react-native";

export default function RainWindow({
  probability,
  timeline
}: {
  probability: number;
  timeline?: RainBucket[];
}) {
  const buckets =
    timeline && timeline.length > 0
      ? timeline
      : Array.from({ length: 8 }, (_, index) => ({
          time: new Date(Date.now() + index * 60 * 60 * 1000).toISOString(),
          probability: Math.max(0, probability - index * 4)
        }));
  const peak = Math.max(...buckets.map((bucket) => bucket.probability), probability);

  return (
    <View style={styles.card}>
      <View style={styles.heading}>
        <Text style={styles.label}>Rain window</Text>
        <Text style={styles.peak}>{Math.round(peak)}% peak</Text>
      </View>
      <View style={styles.strip}>
        {buckets.map((bucket, index) => (
          <View
            key={`${bucket.time}-${index}`}
            style={[styles.bucket, { opacity: 0.25 + bucket.probability / 130 }]}
          />
        ))}
      </View>
      <View style={styles.labels}>
        <Text style={styles.timeLabel}>{formatHour(buckets[0]?.time)}</Text>
        <Text style={styles.timeLabel}>{formatHour(buckets[buckets.length - 1]?.time)}</Text>
      </View>
    </View>
  );
}

function formatHour(value?: string) {
  if (!value) return "";
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderColor: "#d7e0db",
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    padding: 16
  },
  label: {
    color: "#66736d"
  },
  heading: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  peak: {
    color: "#17211f",
    fontWeight: "800"
  },
  strip: {
    flexDirection: "row",
    gap: 3,
    height: 12
  },
  bucket: {
    backgroundColor: "#0891b2",
    borderRadius: 3,
    flex: 1
  },
  labels: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  timeLabel: {
    color: "#66736d",
    fontSize: 12
  }
});
