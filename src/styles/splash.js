import { StyleSheet, Dimensions } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export const splashStyles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    backgroundColor: "#030308",
  },
  logoContainer: {
    width: SCREEN_WIDTH * 0.65,
    aspectRatio: 1,
    position: "relative",
    borderRadius: SCREEN_WIDTH * 0.65 / 2,
    overflow: "hidden",
  },
  logoImage: {
    width: "100%",
    height: "100%",
  },
  logoGlow: {
    position: "absolute",
    top: "25%",
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
    borderRadius: SCREEN_WIDTH / 2,
    backgroundColor: "#2A2A40",
    opacity: 0.12,
  },
  edgeFadeTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "25%",
  },
  edgeFadeBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "25%",
  },
  shimmerOverlay: {
    ...StyleSheet.absoluteFillObject,
    width: SCREEN_WIDTH + 100,
  },
  titleRow: {
    position: "absolute",
    bottom: SCREEN_HEIGHT * 0.15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  titleChar: {
    fontSize: 19,
    fontWeight: "700",
    color: "#FAFAFA",
    letterSpacing: 0.5,
  },
});
