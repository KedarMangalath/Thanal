import { StyleSheet, Text, View } from "react-native";

export default function GlareWarning({ count }: { count: number }) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>Glare warning</Text>
      <Text style={styles.value}>{count} stretches</Text>
      <Text style={styles.meta}>Sun is close to your forward heading.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderColor: "#f5b53f",
    borderRadius: 8,
    borderWidth: 1,
    gap: 5,
    padding: 16
  },
  label: {
    color: "#66736d"
  },
  value: {
    color: "#a15c00",
    fontSize: 22,
    fontWeight: "900"
  },
  meta: {
    color: "#66736d"
  }
});
