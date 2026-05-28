import { Link } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import ComfortScore from "../../components/ComfortScore";

export default function HomeScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.kicker}>Thanal</Text>
        <Text style={styles.title}>Kerala commute comfort, before you leave.</Text>
        <Text style={styles.body}>
          Check the shaded bus side, glare stretches, and rain risk for routes that actually feel
          like Kerala.
        </Text>
      </View>

      <Link href="/bus" style={styles.primaryLink}>
        Start bus seat picker
      </Link>

      <ComfortScore score={68} label="warm" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f5f7f3",
    flexGrow: 1,
    gap: 18,
    padding: 20,
    paddingTop: 58
  },
  header: {
    gap: 8
  },
  kicker: {
    color: "#0f766e",
    fontSize: 16,
    fontWeight: "700"
  },
  title: {
    color: "#17211f",
    fontSize: 30,
    fontWeight: "800",
    lineHeight: 36
  },
  body: {
    color: "#66736d",
    fontSize: 16,
    lineHeight: 23
  },
  primaryLink: {
    backgroundColor: "#0f766e",
    borderRadius: 8,
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    overflow: "hidden",
    padding: 14,
    textAlign: "center"
  }
});
