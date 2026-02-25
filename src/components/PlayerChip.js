import { Pressable, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { AVATAR_COLORS } from "../constants/theme";
import { styles } from "../styles";

export default function PlayerChip({ name, index, onRemove }) {
  const bgColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
  const initial = name.charAt(0).toUpperCase();

  return (
    <View style={styles.playerChip}>
      <LinearGradient
        colors={[bgColor, `${bgColor}88`]}
        style={styles.playerChipAvatar}
      >
        <Text style={styles.playerChipAvatarText}>{initial}</Text>
      </LinearGradient>
      <Text style={styles.playerChipName} numberOfLines={1}>{name}</Text>
      {onRemove && (
        <Pressable onPress={onRemove} style={styles.playerChipRemove}>
          <Text style={styles.playerChipRemoveText}>✕</Text>
        </Pressable>
      )}
    </View>
  );
}
