import { useEffect, useRef } from "react";
import { Animated, Easing, Pressable, Text } from "react-native";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { styles } from "../styles";

export default function GameButton({ label, onPress, variant = "primary", disabled = false, icon, colors }) {
  const scale = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (variant === "primary" && !disabled) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      ).start();
    }
  }, [variant, disabled]);

  const handlePressIn = () => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    Animated.spring(scale, { toValue: 0.94, useNativeDriver: true, speed: 24, bounciness: 12 }).start();
  };
  const handlePressOut = () => {
    if (disabled) return;
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 10 }).start();
  };

  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.7] });

  if (variant === "primary") {
    return (
      <Pressable onPress={disabled ? null : onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <Animated.View style={[disabled && { opacity: 0.4 }, { transform: [{ scale }] }]}>
          <Animated.View style={[styles.buttonGlow, colors && { backgroundColor: colors[0] }, { opacity: glowOpacity }]} />
          <LinearGradient
            colors={colors || ["#EC4899", "#A855F7", "#8B5CF6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.primaryButtonGradient, colors && { shadowColor: colors[0] }]}
          >
            <Text style={styles.primaryButtonText}>
              {icon ? `${icon}  ` : ""}{label}
            </Text>
          </LinearGradient>
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={disabled ? null : onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View
        style={[
          styles.secondaryButton,
          disabled && { opacity: 0.4 },
          { transform: [{ scale }] },
        ]}
      >
        <Text style={styles.secondaryButtonText}>
          {icon ? `${icon}  ` : ""}{label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}
