import { useEffect, useRef } from "react";
import { Animated, Easing, ImageBackground, PanResponder, Pressable, Text, View, StyleSheet, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { SWIPE_THRESHOLD } from "../constants/config";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - 48;

const BG_IMAGE = require("../../assets/daremodukart.png");

export default function DareCard({ question, nextLabel, onNext, playerName, turnLabel }) {
  /* ── İÇ! glow pulse ── */
  const glowAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  const drinkGlow = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });
  const drinkScale = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] });

  /* ── Card enter animation ── */
  const enterAnim = useRef(new Animated.Value(0)).current;

  /* ── Swipe ── */
  const swipeX = useRef(new Animated.Value(0)).current;
  const swiped = useRef(false);
  const onNextRef = useRef(onNext);
  useEffect(() => { onNextRef.current = onNext; });

  useEffect(() => {
    swiped.current = false;
    swipeX.setValue(0);
    enterAnim.setValue(0);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    Animated.timing(enterAnim, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [question]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 15 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderMove: (_, g) => { if (!swiped.current) swipeX.setValue(g.dx); },
      onPanResponderRelease: (_, g) => {
        if (swiped.current) return;
        if (g.dx < -SWIPE_THRESHOLD) {
          swiped.current = true;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          Animated.timing(swipeX, { toValue: -SCREEN_WIDTH * 1.5, duration: 250, useNativeDriver: true }).start(() => {
            onNextRef.current?.();
          });
        } else {
          Animated.spring(swipeX, { toValue: 0, speed: 20, bounciness: 8, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  const swipeRotate = swipeX.interpolate({ inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH], outputRange: ["-15deg", "0deg", "15deg"] });

  /* ── Enter interpolations (sağdan gelme) ── */
  const enterTranslateX = enterAnim.interpolate({ inputRange: [0, 0.3, 0.6, 0.85, 1], outputRange: [SCREEN_WIDTH * 0.9, SCREEN_WIDTH * 0.25, -12, 4, 0] });
  const enterTranslateY = enterAnim.interpolate({ inputRange: [0, 0.3, 0.6, 0.85, 1], outputRange: [60, 20, -8, 2, 0] });
  const enterRotateY = enterAnim.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: ["-55deg", "-35deg", "-10deg", "4deg", "0deg"] });
  const enterRotateZ = enterAnim.interpolate({ inputRange: [0, 0.3, 0.6, 0.85, 1], outputRange: ["-8deg", "-5deg", "-1deg", "0.5deg", "0deg"] });
  const enterScale = enterAnim.interpolate({ inputRange: [0, 0.3, 0.7, 0.9, 1], outputRange: [0.75, 0.88, 0.98, 1.02, 1] });
  const enterOpacity = enterAnim.interpolate({ inputRange: [0, 0.1, 0.35], outputRange: [0, 0.6, 1], extrapolate: "clamp" });
  const enterSkewY = enterAnim.interpolate({ inputRange: [0, 0.3, 0.6, 1], outputRange: ["6deg", "3deg", "-1deg", "0deg"] });

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onNext?.();
  };

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[s.wrapper, {
        opacity: enterOpacity,
        transform: [
          { perspective: 800 },
          { translateX: Animated.add(swipeX, enterTranslateX) },
          { translateY: enterTranslateY },
          { rotateY: enterRotateY },
          { rotateZ: enterRotateZ },
          { skewY: enterSkewY },
          { scale: enterScale },
          { rotate: swipeRotate },
        ],
      }]}
    >
      <View style={s.glowOuter} />
      <ImageBackground
        source={BG_IMAGE}
        style={s.card}
        imageStyle={s.cardImage}
        resizeMode="cover"
      >
        <View style={s.content}>
          {/* Top spacer - shot glass area in image */}
          <View style={s.topSpacer} />

          {/* Question text - centered in the middle empty area */}
          <View style={s.questionWrap}>
            <Text style={s.questionText}>
              {question.replace(/\s*ya da iç\.?$/i, '').replace(/\s*or drink\.?$/i, '').replace(/\s*oder trink\.?$/i, '')}
            </Text>

            {/* YA DA badge with side lines */}
            <View style={s.orRow}>
              <View style={s.orSideLine} />
              <View style={s.orBadge}>
                <LinearGradient
                  colors={["rgba(55, 48, 120, 0.85)", "rgba(40, 35, 90, 0.9)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={s.orBadgeGradient}
                >
                  <Text style={s.orBadgeText}>YA DA</Text>
                </LinearGradient>
              </View>
              <View style={s.orSideLine} />
            </View>

            {/* İÇ! with pulse */}
            <Animated.Text style={[s.drinkLabel, { opacity: drinkGlow, transform: [{ scale: drinkScale }] }]}>
              İÇ!
            </Animated.Text>
          </View>

          {/* Bottom spacer */}
          <View style={s.bottomSpacer} />
        </View>

      </ImageBackground>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrapper: {
    alignSelf: "center",
    width: CARD_WIDTH,
  },
  playerBadge: {
    alignSelf: "center",
    marginBottom: 14,
    borderRadius: 20,
    overflow: "hidden",
  },
  playerBadgeGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  playerBadgeLabel: {
    color: "#06B6D4",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 2,
  },
  playerBadgeName: {
    color: "#FAFAFA",
    fontSize: 18,
    fontWeight: "900",
  },
  glowOuter: {
    position: "absolute",
    top: 6,
    left: 10,
    right: 10,
    bottom: -8,
    borderRadius: 22,
    backgroundColor: "rgba(60, 60, 180, 0.15)",
    shadowColor: "#3838CC",
    shadowOpacity: 0.45,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 10 },
  },
  card: {
    width: "100%",
    aspectRatio: 0.68,
    justifyContent: "center",
    alignItems: "center",
  },
  cardImage: {
    borderRadius: 18,
  },
  content: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "space-between",
  },

  /* Top spacer for shot glass in image */
  topSpacer: {
    height: "20%",
  },

  /* Question area */
  questionWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    gap: 10,
  },
  questionText: {
    color: "#A8D4F0",
    fontSize: 24,
    fontFamily: "NotoRashiHebrew",
    fontWeight: "400",
    textAlign: "center",
    lineHeight: 36,
    letterSpacing: 0.2,
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  orRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
    marginBottom: 6,
    width: "100%",
    paddingHorizontal: 10,
  },
  orSideLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(180, 175, 255, 0.25)",
  },
  orBadge: {
    marginHorizontal: 14,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "rgba(120, 110, 220, 0.4)",
    shadowColor: "#6C63FF",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  orBadgeGradient: {
    alignItems: "center",
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 24,
  },
  orBadgeText: {
    color: "#B8C0FF",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 4,
    textShadowColor: "rgba(140, 150, 255, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  drinkLabel: {
    color: "#E0D4FF",
    fontSize: 36,
    fontWeight: "900",
    fontStyle: "italic",
    letterSpacing: 4,
    marginTop: 8,
    textShadowColor: "rgba(139, 92, 246, 0.6)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },


  /* Next button - absolute positioned over button area in image */
  nextBtn: {
    position: "absolute",
    bottom: "7%",
    alignSelf: "center",
    left: "20%",
    right: "20%",
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  nextBtnPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },
  nextBtnText: {
    color: "#D0D4FF",
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: 1.5,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },

  /* Bottom spacer for button + lemon area */
  bottomSpacer: {
    height: "18%",
  },
});
