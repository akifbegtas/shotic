import { Pressable, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { styles } from "../styles";

export default function ModeMainScreen({ t, navigateTo, selectMode }) {
  return (
    <View style={styles.stack}>
      <Pressable style={styles.modeCard} onPress={() => navigateTo("mode_never_sub")}>
        <LinearGradient colors={["rgba(236,72,153,0.15)", "rgba(168,85,247,0.08)"]} style={styles.modeCardGlow} />
        <Text style={styles.modeCardEmoji}>🤝</Text>
        <View style={styles.modeCardTextWrap}>
          <Text style={styles.modeCardTitle}>{t('modes.neverTitle')}</Text>
          <Text style={styles.modeCardDesc}>{t('modes.neverDesc')}</Text>
        </View>
      </Pressable>

      <Pressable
        style={styles.modeCard}
        onPress={() => selectMode({ id: "dare_basic", label: t('modes.dareLabel') })}
      >
        <LinearGradient colors={["rgba(251,146,60,0.15)", "rgba(236,72,153,0.08)"]} style={styles.modeCardGlow} />
        <Text style={styles.modeCardEmoji}>🥃</Text>
        <View style={styles.modeCardTextWrap}>
          <Text style={styles.modeCardTitle}>{t('modes.dareTitle')}</Text>
          <Text style={styles.modeCardDesc}>{t('modes.dareDesc')}</Text>
        </View>
      </Pressable>

      <Pressable
        style={styles.modeCard}
        onPress={() => selectMode({ id: "challenger", label: t('modes.challengerLabel') })}
      >
        <LinearGradient colors={["rgba(6,182,212,0.15)", "rgba(99,102,241,0.08)"]} style={styles.modeCardGlow} />
        <Text style={styles.modeCardEmoji}>⚡</Text>
        <View style={styles.modeCardTextWrap}>
          <Text style={styles.modeCardTitle}>{t('modes.challengerTitle')}</Text>
          <Text style={styles.modeCardDesc}>{t('modes.challengerDesc')}</Text>
        </View>
      </Pressable>
    </View>
  );
}
