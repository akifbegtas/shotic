import { useEffect, useRef } from "react";
import { Animated, Dimensions, Easing, View } from "react-native";
import { styles } from "../styles";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function ShimmerLine() {
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmer, { toValue: 1, duration: 3000, easing: Easing.linear, useNativeDriver: true })
    ).start();
  }, []);
  const translateX = shimmer.interpolate({ inputRange: [0, 1], outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH] });
  return (
    <View style={styles.shimmerLine}>
      <Animated.View style={[styles.shimmerGlow, { transform: [{ translateX }] }]} />
    </View>
  );
}
