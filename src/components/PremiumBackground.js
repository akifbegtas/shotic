import { useEffect, useRef } from "react";
import { Animated, Dimensions, Easing, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

function Star({ x, y, size, delay = 0 }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: 1200 + Math.random() * 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 1200 + Math.random() * 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.delay(Math.random() * 2000),
      ])
    ).start();
  }, []);

  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.05, 0.35] });
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.2] });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: "#C0C8D8",
        opacity,
        transform: [{ scale }],
        shadowColor: "#8090A8",
        shadowOpacity: 0.4,
        shadowRadius: size,
        shadowOffset: { width: 0, height: 0 },
      }}
    />
  );
}

function ShootingStar({ delay = 0 }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const shoot = () => {
      anim.setValue(0);
      Animated.sequence([
        Animated.delay(delay + Math.random() * 8000),
        Animated.timing(anim, { toValue: 1, duration: 700, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      ]).start(() => shoot());
    };
    shoot();
  }, []);

  const startX = Math.random() * SCREEN_WIDTH * 0.6;
  const startY = Math.random() * SCREEN_HEIGHT * 0.4;

  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [startX, startX + SCREEN_WIDTH * 0.5] });
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [startY, startY + SCREEN_HEIGHT * 0.3] });
  const opacity = anim.interpolate({ inputRange: [0, 0.2, 0.7, 1], outputRange: [0, 0.8, 0.6, 0] });
  const scaleX = anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 0.3] });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        width: 40,
        height: 2,
        borderRadius: 1,
        backgroundColor: "#B0BED0",
        opacity,
        transform: [{ translateX }, { translateY }, { rotate: "35deg" }, { scaleX }],
        shadowColor: "#8090A8",
        shadowOpacity: 1,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 0 },
      }}
    />
  );
}

const STARS = Array.from({ length: 35 }, (_, i) => ({
  id: i,
  x: Math.random() * SCREEN_WIDTH,
  y: Math.random() * SCREEN_HEIGHT,
  size: 1.5 + Math.random() * 3,
  delay: Math.random() * 4000,
}));

export default function PremiumBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={["#030308", "#080810", "#050509", "#020206"]}
        locations={[0, 0.35, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />

      {STARS.map((s) => (
        <Star key={s.id} x={s.x} y={s.y} size={s.size} delay={s.delay} />
      ))}

      <ShootingStar delay={2000} />
      <ShootingStar delay={7000} />
      <ShootingStar delay={12000} />
    </View>
  );
}
