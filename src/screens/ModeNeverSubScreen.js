import { Pressable, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { styles } from "../styles";

export default function ModeNeverSubScreen({ t, selectMode }) {
  return (
    <View style={styles.stack}>
      <Pressable
        style={styles.modeCard}
        onPress={() => selectMode({ id: "never_normal", label: t('modes.neverNormalLabel') })}
      >
        <LinearGradient colors={["rgba(168,85,247,0.15)", "rgba(99,102,241,0.08)"]} style={styles.modeCardGlow} />
        <Text style={styles.modeCardEmoji}>🎯</Text>
        <View style={styles.modeCardTextWrap}>
          <Text style={styles.modeCardTitle}>{t('modes.normalTitle')}</Text>
          <Text style={styles.modeCardDesc}>{t('modes.normalDesc')}</Text>
        </View>
      </Pressable>

      <Pressable
        style={styles.modeCard}
        onPress={() => selectMode({ id: "never_girls", label: t('modes.neverGirlsLabel') })}
      >
        <LinearGradient colors={["rgba(236,72,153,0.15)", "rgba(244,114,182,0.08)"]} style={styles.modeCardGlow} />
        <Text style={styles.modeCardEmoji}>💕</Text>
        <View style={styles.modeCardTextWrap}>
          <Text style={styles.modeCardTitle}>{t('modes.girlsTitle')}</Text>
          <Text style={styles.modeCardDesc}>{t('modes.girlsDesc')}</Text>
        </View>
      </Pressable>
    </View>
  );
}
