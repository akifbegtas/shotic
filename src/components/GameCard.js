import { useEffect, useRef } from "react";
import { Animated, Dimensions, Easing, ImageBackground, PanResponder, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { CARD_FRAMES } from "../constants/theme";
import { SWIPE_THRESHOLD } from "../constants/config";
import { styles } from "../styles";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function GameCard({ icon, children, modeId, questionKey, onSwipeLeft, onSwipeRight }) {
  const anim = useRef(new Animated.Value(0)).current;
  const swipeX = useRef(new Animated.Value(0)).current;
  const swiped = useRef(false);

  useEffect(() => {
    swiped.current = false;
    swipeX.setValue(0);
    anim.setValue(0);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    Animated.timing(anim, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [questionKey]);

  const onSwipeLeftRef = useRef(onSwipeLeft);
  const onSwipeRightRef = useRef(onSwipeRight);
  useEffect(() => {
    onSwipeLeftRef.current = onSwipeLeft;
    onSwipeRightRef.current = onSwipeRight;
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 15 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderMove: (_, g) => { if (!swiped.current) swipeX.setValue(g.dx); },
      onPanResponderRelease: (_, g) => {
        if (swiped.current) return;
        if (g.dx < -SWIPE_THRESHOLD && onSwipeLeftRef.current) {
          swiped.current = true;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          Animated.timing(swipeX, { toValue: -SCREEN_WIDTH * 1.5, duration: 250, useNativeDriver: true }).start(() => onSwipeLeftRef.current());
        } else if (g.dx > SWIPE_THRESHOLD && onSwipeRightRef.current) {
          swiped.current = true;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          Animated.timing(swipeX, { toValue: SCREEN_WIDTH * 1.5, duration: 250, useNativeDriver: true }).start(() => onSwipeRightRef.current());
        } else {
          Animated.spring(swipeX, { toValue: 0, speed: 20, bounciness: 8, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  const translateX = anim.interpolate({ inputRange: [0, 0.3, 0.6, 0.85, 1], outputRange: [SCREEN_WIDTH * 0.9, SCREEN_WIDTH * 0.25, -12, 4, 0] });
  const translateY = anim.interpolate({ inputRange: [0, 0.3, 0.6, 0.85, 1], outputRange: [60, 20, -8, 2, 0] });
  const rotateY = anim.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: ["-55deg", "-35deg", "-10deg", "4deg", "0deg"] });
  const rotateZ = anim.interpolate({ inputRange: [0, 0.3, 0.6, 0.85, 1], outputRange: ["-8deg", "-5deg", "-1deg", "0.5deg", "0deg"] });
  const scale = anim.interpolate({ inputRange: [0, 0.3, 0.7, 0.9, 1], outputRange: [0.75, 0.88, 0.98, 1.02, 1] });
  const opacity = anim.interpolate({ inputRange: [0, 0.1, 0.35], outputRange: [0, 0.6, 1], extrapolate: "clamp" });
  const skewY = anim.interpolate({ inputRange: [0, 0.3, 0.6, 1], outputRange: ["6deg", "3deg", "-1deg", "0deg"] });
  const swipeRotate = swipeX.interpolate({ inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH], outputRange: ["-15deg", "0deg", "15deg"] });

  const cardFrame = modeId && CARD_FRAMES[modeId] ? CARD_FRAMES[modeId] : null;
  const hasSwipe = onSwipeLeft || onSwipeRight;

  const cardContent = (
    <Animated.View style={[
      styles.questionHero,
      cardFrame && styles.questionHeroWithFrame,
      {
        opacity,
        transform: [
          { perspective: 800 },
          { translateX },
          { translateY },
          { rotateY },
          { rotateZ },
          { skewY },
          { scale },
        ]
      }
    ]}>
      {cardFrame ? (
        <ImageBackground
          source={cardFrame}
          style={styles.cardFrameImage}
          imageStyle={styles.cardFrameImageStyle}
          resizeMode="cover"
        >
          <View style={styles.cardFrameContent}>
            {children}
          </View>
        </ImageBackground>
      ) : (
        <View style={styles.questionCardInner}>
          {icon && (
            <View style={styles.questionCardTop}>
              <Text style={styles.questionIllustration}>{icon}</Text>
            </View>
          )}
          {children}
        </View>
      )}
    </Animated.View>
  );

  if (!hasSwipe) return cardContent;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={{ transform: [{ translateX: swipeX }, { rotate: swipeRotate }] }}
    >
      {cardContent}
    </Animated.View>
  );
}
