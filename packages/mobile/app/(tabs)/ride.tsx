import { StyleSheet, Text, View } from "react-native";
import GlareWarning from "../../components/GlareWarning";
import RainWindow from "../../components/RainWindow";

export default function RideScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ride planner</Text>
      <GlareWarning count={2} />
      <RainWindow probability={42} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f5f7f3",
    flex: 1,
    gap: 14,
    padding: 16,
    paddingTop: 54
  },
  title: {
    color: "#17211f",
    fontSize: 26,
    fontWeight: "800"
  }
});
