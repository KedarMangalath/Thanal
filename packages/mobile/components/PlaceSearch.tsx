import type { LatLng } from "@thanal/shared";
import React, { useState, useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Keyboard
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme";
import { searchPlaces, searchRailStations, type PlaceResult } from "../utils/api";

type Props = {
  label: string;
  onSelect: (point: LatLng, name: string) => void;
  isTrain?: boolean;
};

export default function PlaceSearch({ label, onSelect, isTrain = false }: Props) {
  const { theme } = useTheme();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searcher = isTrain ? searchRailStations : searchPlaces;

  async function runSearch(term: string) {
    const trimmed = term.trim();
    if (term.trim().length < 2) {
      setResults([]);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      setResults(await searcher(trimmed));
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : "Search failed.");
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleChangeText(text: string) {
    setQuery(text);
    
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(text), 300);
  }

  function pickPlace(place: PlaceResult) {
    const name = shortName(place.display_name);
    onSelect(
      { lat: Number(place.lat), lng: Number(place.lon) },
      name
    );
    setQuery(name);
    setResults([]);
    setError(null);
    Keyboard.dismiss();
  }

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>{label}</Text>
        <TextInput
          value={query}
          onChangeText={handleChangeText}
          placeholder={isTrain ? "Search stations" : "Search places"}
          placeholderTextColor={theme.colors.textMuted}
          style={styles.input}
        />
        {isLoading && (
          <ActivityIndicator color={theme.colors.accent} style={styles.loader} />
        )}
        {query.length > 0 && !isLoading && (
          <Pressable onPress={() => { setQuery(""); setResults([]); }} style={styles.clearBtn}>
            <Ionicons name="close-circle" size={16} color={theme.colors.textMuted} />
          </Pressable>
        )}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      
      {results.length > 0 && (
        <View style={styles.resultsContainer}>
          {results.map((place) => (
            <Pressable
              key={place.place_id}
              style={styles.result}
              onPress={() => pickPlace(place)}
            >
              <Text style={styles.resultTitle}>{shortName(place.display_name)}</Text>
              <Text numberOfLines={1} style={styles.resultMeta}>
                {place.display_name}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

function shortName(displayName: string) {
  return displayName.split(",").slice(0, 2).join(",").trim();
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    zIndex: 10, // Ensure dropdown renders above other elements
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surfaceHover,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
  },
  label: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    marginRight: theme.spacing.sm,
    width: 32,
  },
  input: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: 14,
    paddingVertical: 10,
  },
  loader: {
    marginLeft: theme.spacing.sm,
  },
  clearBtn: {
    padding: theme.spacing.xs,
  },
  error: {
    color: theme.colors.danger,
    fontSize: 12,
    marginTop: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
  },
  resultsContainer: {
    position: "absolute",
    top: 45,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    maxHeight: 200,
    overflow: "hidden",
  },
  result: {
    paddingVertical: 10,
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  resultTitle: {
    color: theme.colors.textPrimary,
    fontWeight: "600",
    fontSize: 14,
  },
  resultMeta: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  }
});
