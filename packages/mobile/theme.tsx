import React, { createContext, useContext, useEffect, useState } from "react";
import { useColorScheme as useSystemColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ThemeName = "light" | "dark";

export const lightTheme = {
  colors: {
    bg: "#FAFBFC",
    surface: "#FFFFFF",
    surfaceHover: "#F5F7FA",
    surfaceActive: "#E5E7EB",
    border: "#E8ECF0",
    borderStrong: "#D1D5DB",
    textPrimary: "#1A1D21",
    textSecondary: "#6B7280",
    textMuted: "#9CA3AF",
    accent: "#0D9488",
    accentSoft: "#CCFBF1",
    accentText: "#FFFFFF",
    route1: "#0D9488",
    route2: "#6366F1",
    route3: "#D97706",
    warning: "#F59E0B",
    warningSoft: "#FEF3C7",
    danger: "#EF4444",
    dangerSoft: "#FEE2E2",
    success: "#10B981",
    successSoft: "#D1FAE5",
    mapOverlayBg: "rgba(255, 255, 255, 0.88)",
    sunLeft: "#F97316",
    sunRight: "#0891B2",
    sunNeutral: "#D1D5DB"
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 999
  }
};

export const darkTheme = {
  ...lightTheme,
  colors: {
    ...lightTheme.colors,
    bg: "#0A0A0B",
    surface: "#141416",
    surfaceHover: "#1C1C1F",
    surfaceActive: "#27272A",
    border: "#2A2A2E",
    borderStrong: "#3F3F46",
    textPrimary: "#F0F0F2",
    textSecondary: "#9CA3AF",
    textMuted: "#6B7280",
    accent: "#2DD4BF",
    accentSoft: "#0D3D38",
    accentText: "#0A0A0B",
    route1: "#2DD4BF",
    route2: "#818CF8",
    route3: "#FBBF24",
    warning: "#FBBF24",
    warningSoft: "#422006",
    danger: "#F87171",
    dangerSoft: "#450A0A",
    success: "#34D399",
    successSoft: "#052E16",
    mapOverlayBg: "rgba(20, 20, 22, 0.9)",
    sunLeft: "#FB923C",
    sunRight: "#22D3EE",
    sunNeutral: "#3F3F46"
  }
};

type ThemeContextType = {
  theme: typeof lightTheme;
  themeName: ThemeName;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }): React.ReactElement | null {
  const systemScheme = useSystemColorScheme();
  const [themeName, setThemeName] = useState<ThemeName>("light");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("thanal-theme").then((stored) => {
      if (stored === "light" || stored === "dark") {
        setThemeName(stored);
      } else if (systemScheme === "dark") {
        setThemeName("dark");
      }
      setIsLoaded(true);
    });
  }, [systemScheme]);

  const toggleTheme = () => {
    setThemeName((prev) => {
      const next = prev === "light" ? "dark" : "light";
      AsyncStorage.setItem("thanal-theme", next);
      return next;
    });
  };

  if (!isLoaded) return null;

  return (
    <ThemeContext.Provider
      value={{
        theme: themeName === "light" ? lightTheme : darkTheme,
        themeName,
        toggleTheme
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}

export type Language = "english" | "manglish" | "malayalam";
type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
};
const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("english");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("thanal-language").then((stored) => {
      if (stored === "english" || stored === "manglish" || stored === "malayalam") {
        setLanguageState(stored as Language);
      }
      setIsLoaded(true);
    });
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    AsyncStorage.setItem("thanal-language", lang);
  };

  if (!isLoaded) return null;

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}
