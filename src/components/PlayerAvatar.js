import { Pressable, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { AVATAR_COLORS } from "../constants/theme";
import { styles } from "../styles";

export default function PlayerAvatar({ name, index, isHost = false, onRemove }) {
  const bgColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
  const initial = name.charAt(0).toUpperCase();

  return (
    <View style={styles.playerAvatarRow}>
      <LinearGradient
        colors={[bgColor, `${bgColor}88`]}
        style={styles.playerAvatar}
      >
        <Text style={styles.playerAvatarText}>{initial}</Text>
      </LinearGradient>
      <View style={styles.playerAvatarInfo}>
        <Text style={styles.playerAvatarName}>{name}</Text>
        {isHost && (
          <View style={styles.hostBadge}>
            <Text style={styles.hostBadgeText}>HOST</Text>
          </View>
        )}
      </View>
      {onRemove ? (
        <Pressable onPress={onRemove} style={styles.removeBtn}>
          <Text style={styles.removeBtnText}>✕</Text>
        </Pressable>
      ) : (
        <View style={[styles.statusDot, { backgroundColor: "#22C55E" }]} />
      )}
    </View>
  );
}
