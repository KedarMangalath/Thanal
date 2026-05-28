import { StyleSheet, Text, View } from "react-native";

export default function ComfortScore({ score, label }: { score: number; label: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>Comfort score</Text>
      <Text style={styles.value}>{score}</Text>
      <Text style={styles.meta}>{label.toUpperCase()} conditions</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderColor: "#d7e0db",
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    padding: 16
  },
  label: {
    color: "#66736d"
  },
  value: {
    color: "#17211f",
    fontSize: 28,
    fontWeight: "900"
  },
  meta: {
    color: "#66736d"
  }
});
