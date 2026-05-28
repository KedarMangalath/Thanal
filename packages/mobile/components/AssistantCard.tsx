import type { LatLng } from "@thanal/shared";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { askAssistant } from "../utils/api";

type Props = {
  mode: "bus" | "bike" | "walk" | "train";
  start: LatLng | null;
  end: LatLng | null;
};

export default function AssistantCard({ mode, start, end }: Props) {
  const [message, setMessage] = useState("Which option is most comfortable?");
  const [answer, setAnswer] = useState<string | null>(null);
  const [model, setModel] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const trimmed = message.trim();
    if (!trimmed) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await askAssistant({
        message: trimmed,
        mode,
        start,
        end,
        departureTime: new Date().toISOString()
      });
      setAnswer(response.answer);
      setModel(response.model);
    } catch (assistantError) {
      setError(assistantError instanceof Error ? assistantError.message : "Assistant failed.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <View style={styles.card}>
      <Text style={styles.label}>Ask Thanal AI</Text>
      <TextInput
        value={message}
        onChangeText={setMessage}
        placeholder="Ask about sun, route choice, rain, or train side"
        placeholderTextColor="#8a9690"
        multiline
        style={styles.input}
      />
      <Pressable style={styles.button} onPress={submit}>
        {isLoading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.buttonText}>Ask</Text>}
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {answer ? (
        <View style={styles.answerBox}>
          <Text style={styles.answer}>{answer}</Text>
          {model ? <Text style={styles.model}>Model: {model}</Text> : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(255,255,255,0.92)",
    borderColor: "#d7e0db",
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    padding: 12
  },
  label: {
    color: "#17211f",
    fontSize: 14,
    fontWeight: "800"
  },
  input: {
    backgroundColor: "#f6f8f6",
    borderColor: "#d7e0db",
    borderRadius: 8,
    borderWidth: 1,
    color: "#17211f",
    minHeight: 74,
    padding: 10,
    textAlignVertical: "top"
  },
  button: {
    alignItems: "center",
    backgroundColor: "#5b35f0",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 44
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "800"
  },
  error: {
    color: "#a15c00",
    fontSize: 13
  },
  answerBox: {
    backgroundColor: "#f0edff",
    borderRadius: 8,
    gap: 6,
    padding: 10
  },
  answer: {
    color: "#17211f",
    lineHeight: 20
  },
  model: {
    color: "#66736d",
    fontSize: 12,
    fontWeight: "700"
  }
});
