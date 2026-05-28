import { StyleSheet, Text, View } from "react-native";

export default function RainWindow({ probability }: { probability: number }) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>Rain window</Text>
      <View style={styles.strip}>
        {Array.from({ length: 8 }, (_, index) => (
          <View
            key={index}
            style={[styles.bucket, { opacity: 0.25 + Math.max(0, probability - index * 4) / 130 }]}
          />
        ))}
      </View>
    </View>
  );
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
  strip: {
    flexDirection: "row",
    gap: 3,
    height: 12
  },
  bucket: {
    backgroundColor: "#0891b2",
    borderRadius: 3,
    flex: 1
  }
});
