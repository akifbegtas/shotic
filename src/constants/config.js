import { Platform } from "react-native";

const getServerUrl = () => {
  if (Platform.OS === "android") return "http://10.0.2.2:3003";
  return "http://localhost:3003";
};

export const SERVER_URL = getServerUrl();
export const SWIPE_THRESHOLD = 80;
