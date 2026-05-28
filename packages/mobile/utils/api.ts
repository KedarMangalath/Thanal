import Constants from "expo-constants";

export const API_BASE_URL =
  typeof Constants.expoConfig?.extra?.apiBaseUrl === "string"
    ? Constants.expoConfig.extra.apiBaseUrl
    : "http://localhost:4010";
