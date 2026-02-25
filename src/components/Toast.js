import { useEffect, useRef } from "react";
import { Animated, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { BlurView } from "expo-blur";
import { styles } from "../styles";

export default function Toast({ visible, message, type = "error", onHide }) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const scale = useRef(new Animated.Value(0.9)).current;
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 16, useNativeDriver: true, speed: 14, bounciness: 8 }),
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 8 }),
      ]).start();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      const t = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, { toValue: -100, duration: 250, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 0.9, duration: 250, useNativeDriver: true }),
        ]).start(() => onHide());
      }, 3000);
      return () => clearTimeout(t);
    } else {
      Animated.timing(translateY, { toValue: -100, duration: 250, useNativeDriver: true }).start();
    }
  }, [visible, message]);
  return (
    <Animated.View style={[styles.toastContainer, { transform: [{ translateY }, { scale }] }]}>
      <BlurView intensity={40} tint="dark" style={styles.toastBlur}>
        <View style={styles.toastInner}>
          <View style={[styles.toastDot, type === "error" ? styles.toastDotError : styles.toastDotSuccess]} />
          <Text style={[styles.toastText, type === "error" && styles.toastTextError]}>{message}</Text>
        </View>
      </BlurView>
    </Animated.View>
  );
}
