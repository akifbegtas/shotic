import { Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import GameCard from "../components/GameCard";
import DareCard from "../components/DareCard";
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

      {isDareMode ? (
        <DareCard
          question={soloCurrentQuestion}
          nextLabel={t('game.swipe')}
          onNext={nextDareQuestion}
        />
      ) : (
        <>
          <GameCard
            icon="🤝"
            modeId={soloModeId}
            questionKey={soloCurrentQuestion}
            onSwipeLeft={nextSoloQuestion}
          >
            <Text style={[
              styles.questionTextNever,
              soloModeId && CARD_FRAMES[soloModeId] && styles.questionTextOnFrame,
              CARD_TEXT_COLORS[soloModeId] && { color: CARD_TEXT_COLORS[soloModeId].main }
            ]}>
              {soloCurrentQuestion}
            </Text>
          </GameCard>
          <View style={styles.swipeHintWrap}>
            <View style={styles.swipeArrow}><Text style={styles.swipeArrowText}>←</Text></View>
            <Text style={styles.swipeHint}>{t('game.swipe')}</Text>
          </View>
        </>
      )}
    </View>
  );
}
