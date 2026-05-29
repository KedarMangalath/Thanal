import { Ionicons } from "@expo/vector-icons";
import { Linking, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { type Language, useLanguage, useTheme } from "../../theme";

export default function SettingsScreen() {
  const { theme, themeName, toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();

  const handleFeedback = () => {
    Linking.openURL("mailto:support@thanal.app?subject=Thanal Feedback");
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.header, { color: theme.colors.textPrimary }]}>Settings</Text>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>Preferences</Text>
          <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            
            <View style={styles.row}>
              <View>
                <Text style={[styles.rowTitle, { color: theme.colors.textPrimary }]}>Dark Theme</Text>
                <Text style={[styles.rowDesc, { color: theme.colors.textMuted }]}>Use a darker color palette</Text>
              </View>
              <Switch 
                value={themeName === "dark"} 
                onValueChange={toggleTheme}
                trackColor={{ false: theme.colors.border, true: theme.colors.accent }}
              />
            </View>

            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

            <View style={[styles.row, { paddingBottom: 0 }]}>
              <View>
                <Text style={[styles.rowTitle, { color: theme.colors.textPrimary }]}>Language</Text>
                <Text style={[styles.rowDesc, { color: theme.colors.textMuted }]}>For commute insights</Text>
              </View>
            </View>
            <View style={styles.languageOptions}>
              {(["english", "manglish", "malayalam"] as Language[]).map(lang => (
                <Pressable
                  key={lang}
                  style={[
                    styles.langPill,
                    { 
                      backgroundColor: language === lang ? theme.colors.accent : theme.colors.surfaceHover,
                      borderColor: language === lang ? theme.colors.accent : theme.colors.border
                    }
                  ]}
                  onPress={() => setLanguage(lang)}
                >
                  <Text style={{ 
                    fontSize: 13, 
                    fontWeight: "500", 
                    color: language === lang ? "#FFF" : theme.colors.textPrimary 
                  }}>
                    {lang === "english" ? "English" : lang === "manglish" ? "Manglish" : "മലയാളം"}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>About Thanal</Text>
          <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[styles.aboutText, { color: theme.colors.textSecondary }]}>
              Thanal uses high-precision astronomical algorithms combined with local routing APIs to calculate the exact sun position relative to your vehicle's heading.
            </Text>
            <Text style={[styles.aboutText, { color: theme.colors.textSecondary, marginBottom: 0 }]}>
              Whether taking a bus down the coast or a train across the hills, Thanal tells you exactly which side stays in the shade.
            </Text>
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Pressable 
            style={[styles.feedbackCard, { backgroundColor: theme.colors.accentSoft }]}
            onPress={handleFeedback}
          >
            <View>
              <Text style={[styles.rowTitle, { color: theme.colors.accent }]}>Send Feedback</Text>
              <Text style={[styles.rowDesc, { color: theme.colors.accent, opacity: 0.8 }]}>Report a bug or suggest a feature</Text>
            </View>
            <Ionicons name="chatbubble-ellipses" size={24} color={theme.colors.accent} />
          </Pressable>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  header: { fontSize: 28, fontWeight: "700", marginBottom: 24, paddingHorizontal: 4 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 13, fontWeight: "600", textTransform: "uppercase", marginBottom: 8, paddingHorizontal: 12, letterSpacing: 0.5 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 4 },
  rowTitle: { fontSize: 16, fontWeight: "600", marginBottom: 2 },
  rowDesc: { fontSize: 13 },
  divider: { height: 1, marginVertical: 16 },
  languageOptions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  langPill: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1 },
  aboutText: { fontSize: 14, lineHeight: 22, marginBottom: 12 },
  feedbackCard: { borderRadius: 16, padding: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }
});
