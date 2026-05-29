import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ThemeProvider, LanguageProvider } from "../theme";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }} />
      </LanguageProvider>
    </ThemeProvider>
  );
}
