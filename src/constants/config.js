import { Platform } from "react-native";

const getServerUrl = () => {
  if (Platform.OS === "android") return "http://10.0.2.2:3003"; // Android emulator
  // Cloudflare tunnel (her yerden erişim)
  return "https://guestbook-hints-rebound-updating.trycloudflare.com";
};

export const SERVER_URL = getServerUrl();
export const SWIPE_THRESHOLD = 80;
