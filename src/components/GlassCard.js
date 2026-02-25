import { View } from "react-native";
import { BlurView } from "expo-blur";
import { styles } from "../styles";

export default function GlassCard({ children, style, intensity = 25 }) {
  return (
    <View style={[styles.glassOuter, style]}>
      <BlurView intensity={intensity} tint="dark" style={styles.glassBlur}>
        <View style={styles.glassInner}>
          {children}
        </View>
      </BlurView>
    </View>
  );
}
