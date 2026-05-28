import type { LatLng } from "@thanal/shared";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { searchPlaces, type PlaceResult } from "../utils/api";

type Props = {
  label: string;
  onSelect: (point: LatLng, name: string) => void;
  searcher?: (query: string) => Promise<PlaceResult[]>;
};

export default function PlaceSearch({ label, onSelect, searcher = searchPlaces }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runSearch() {
    const trimmed = query.trim();
    if (trimmed.length < 3) {
      setError("Type at least 3 letters.");
      setResults([]);
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

  function pickPlace(place: PlaceResult) {
    onSelect(
      { lat: Number(place.lat), lng: Number(place.lon) },
      shortName(place.display_name)
    );
    setQuery(shortName(place.display_name));
    setResults([]);
    setError(null);
  }

  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search Kerala places"
          placeholderTextColor="#8a9690"
          returnKeyType="search"
          onSubmitEditing={runSearch}
          style={styles.input}
        />
        <Pressable style={styles.button} onPress={runSearch}>
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Find</Text>
          )}
        </Pressable>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {results.map((place) => (
        <Pressable
          key={place.place_id}
          style={styles.result}
          onPress={() => pickPlace(place)}
        >
          <Text style={styles.resultTitle}>{shortName(place.display_name)}</Text>
          <Text numberOfLines={2} style={styles.resultMeta}>
            {place.display_name}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function shortName(displayName: string) {
  return displayName.split(",").slice(0, 2).join(",").trim();
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderColor: "#d7e0db",
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    padding: 12
  },
  label: {
    color: "#17211f",
    fontSize: 14,
    fontWeight: "800"
  },
  row: {
    flexDirection: "row",
    gap: 8
  },
  input: {
    backgroundColor: "#f5f7f3",
    borderColor: "#d7e0db",
    borderRadius: 8,
    borderWidth: 1,
    color: "#17211f",
    flex: 1,
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  button: {
    alignItems: "center",
    backgroundColor: "#0f766e",
    borderRadius: 8,
    justifyContent: "center",
    minWidth: 72,
    paddingHorizontal: 14
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "800"
  },
  error: {
    color: "#a15c00",
    fontSize: 13
  },
  result: {
    borderTopColor: "#e5ebe7",
    borderTopWidth: 1,
    gap: 3,
    paddingTop: 8
  },
  resultTitle: {
    color: "#17211f",
    fontWeight: "800"
  },
  resultMeta: {
    color: "#66736d",
    fontSize: 12,
    lineHeight: 16
  }
});
