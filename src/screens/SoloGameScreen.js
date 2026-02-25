import { Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import GameCard from "../components/GameCard";
import { CARD_FRAMES, CARD_TEXT_COLORS } from "../constants/theme";
import { styles } from "../styles";

export default function SoloGameScreen({
  t, soloModeId, soloCurrentQuestion, questionNum,
  currentDarePlayer, nextDareQuestion, nextSoloQuestion,
}) {
  const isDareMode = soloModeId === "dare_basic";

  return (
    <View style={styles.gameStack}>
      {isDareMode && currentDarePlayer && (
        <View style={styles.turnBadge}>
          <LinearGradient colors={["rgba(6,182,212,0.2)", "rgba(99,102,241,0.15)"]} style={styles.turnBadgeGradient}>
            <Text style={styles.turnBadgeLabel}>{t('game.turn')}</Text>
            <Text style={styles.turnBadgeName}>{currentDarePlayer}</Text>
          </LinearGradient>
        </View>
      )}

      <GameCard
        icon={isDareMode ? "🍺" : "🤝"}
        modeId={soloModeId}
        questionKey={soloCurrentQuestion}
        onSwipeLeft={isDareMode ? nextDareQuestion : nextSoloQuestion}
        onSwipeRight={isDareMode ? nextDareQuestion : nextSoloQuestion}
      >
        <Text style={[
          isDareMode ? styles.questionTextDare : styles.questionTextNever,
          soloModeId && CARD_FRAMES[soloModeId] && styles.questionTextOnFrame,
          CARD_TEXT_COLORS[soloModeId] && { color: CARD_TEXT_COLORS[soloModeId].main }
        ]}>
          {soloCurrentQuestion}
        </Text>
      </GameCard>
      <View style={styles.swipeHintWrap}>
        <View style={styles.swipeArrow}><Text style={styles.swipeArrowText}>←</Text></View>
        <Text style={styles.swipeHint}>{t('game.swipe')}</Text>
        <View style={styles.swipeArrow}><Text style={styles.swipeArrowText}>→</Text></View>
      </View>
    </View>
  );
}
