import { Animated, Pressable, Text, TextInput, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import GlassCard from "../components/GlassCard";
import GameButton from "../components/GameButton";
import GameCard from "../components/GameCard";
import ShimmerLine from "../components/ShimmerLine";
import { CARD_FRAMES, CARD_TEXT_COLORS } from "../constants/theme";
import { styles } from "../styles";

export default function GameScreen({
  t, modeId, modeType, phase, question, questionType, questionNum,
  currentTurnPlayerName, currentTurnPlayerId, myId, isMyTurn,
  playerEntries, selectedVoteTarget, setSelectedVoteTarget,
  inputNumber, setInputNumber, answersCount, totalPlayers,
  currentResult, revealStep, revealItem, revealX, dareResultScale,
  nextQuestion, submitVote, submitInput, submitTarget,
}) {
  const isNever = modeType === "never";
  const isDareBasic = modeType === "dare_basic";
  const isChallenger = modeType === "dare";

  return (
    <View style={styles.gameStack}>
      {isNever && phase === "question" && (
        <>
          <GameCard
            icon="🤝"
            modeId={modeId}
            questionKey={question}
            onSwipeLeft={() => nextQuestion()}
            onSwipeRight={() => nextQuestion()}
          >
            <Text style={[styles.questionTextNever, modeId && CARD_FRAMES[modeId] && styles.questionTextOnFrame, CARD_TEXT_COLORS[modeId] && { color: CARD_TEXT_COLORS[modeId].main }]}>{question}</Text>
          </GameCard>
          <View style={styles.swipeHintWrap}>
            <View style={styles.swipeArrow}><Text style={styles.swipeArrowText}>←</Text></View>
            <Text style={styles.swipeHint}>{t('game.swipe')}</Text>
            <View style={styles.swipeArrow}><Text style={styles.swipeArrowText}>→</Text></View>
          </View>
        </>
      )}

      {isNever && phase === "reveal" && revealItem && (
        <GlassCard>
          <Text style={styles.sectionLabel}>{t('game.results')}</Text>
          <ShimmerLine />
          <View style={styles.revealStage}>
            <Animated.Text style={[styles.revealText, { transform: [{ translateX: revealX }] }]}>
              {revealItem.name}: {revealItem.answer === "did" ? t('game.did') : t('game.didNot')}
            </Animated.Text>
          </View>
        </GlassCard>
      )}

      {isDareBasic && phase === "question" && (
        <>
          {currentTurnPlayerName && (
            <View style={styles.turnBadge}>
              <LinearGradient colors={["rgba(6,182,212,0.2)", "rgba(99,102,241,0.15)"]} style={styles.turnBadgeGradient}>
                <Text style={styles.turnBadgeLabel}>{t('game.turn')}</Text>
                <Text style={styles.turnBadgeName}>{currentTurnPlayerName}</Text>
              </LinearGradient>
            </View>
          )}

          <GameCard
            icon="🍺"
            modeId={modeId}
            questionKey={question}
            onSwipeLeft={() => nextQuestion()}
            onSwipeRight={() => nextQuestion()}
          >
            <Text style={[styles.questionTextDare, modeId && CARD_FRAMES[modeId] && styles.questionTextOnFrame, CARD_TEXT_COLORS[modeId] && { color: CARD_TEXT_COLORS[modeId].main }]}>{question}</Text>
          </GameCard>
          <View style={styles.swipeHintWrap}>
            <View style={styles.swipeArrow}><Text style={styles.swipeArrowText}>←</Text></View>
            <Text style={styles.swipeHint}>{t('game.swipe')}</Text>
            <View style={styles.swipeArrow}><Text style={styles.swipeArrowText}>→</Text></View>
          </View>
        </>
      )}

      {isChallenger && phase === "question" && (
        <>
          {currentTurnPlayerName && (
            <View style={styles.turnBadge}>
              <LinearGradient colors={["rgba(6,182,212,0.2)", "rgba(99,102,241,0.15)"]} style={styles.turnBadgeGradient}>
                <Text style={styles.turnBadgeLabel}>{t('game.turn')}</Text>
                <Text style={styles.turnBadgeName}>{currentTurnPlayerName}</Text>
              </LinearGradient>
            </View>
          )}

          <GameCard icon="⚡" modeId={modeId} questionKey={question}>
            <Text style={[styles.questionTextDare, modeId && CARD_FRAMES[modeId] && styles.questionTextOnFrame, CARD_TEXT_COLORS[modeId] && { color: CARD_TEXT_COLORS[modeId].main }]}>{question}</Text>
          </GameCard>

          {questionType === "vote" && (
            <GlassCard>
              <Text style={styles.sectionLabel}>{t('game.vote')}</Text>
              <ShimmerLine />
              {playerEntries.map((p) => (
                <Pressable
                  key={p.id}
                  style={[styles.modeOption, selectedVoteTarget === p.id && styles.modeOptionActive]}
                  onPress={() => setSelectedVoteTarget(p.id)}
                >
                  <View style={styles.modeOptionLeft}>
                    <Text style={styles.modeOptionIcon}>{selectedVoteTarget === p.id ? "✓" : ""}</Text>
                    <Text style={[styles.modeOptionText, selectedVoteTarget === p.id && styles.modeOptionTextActive]}>
                      {p.name}{p.id === myId ? ` ${t('game.me')}` : ""}
                    </Text>
                  </View>
                </Pressable>
              ))}
              <GameButton label={t('game.submitVote')} onPress={submitVote} disabled={!selectedVoteTarget} />
            </GlassCard>
          )}

          {questionType === "input_number" && (
            <GlassCard>
              <Text style={styles.sectionLabel}>{t('game.enterNumber')}</Text>
              <ShimmerLine />
              <TextInput
                placeholder="0"
                placeholderTextColor="#52525B"
                value={inputNumber}
                onChangeText={setInputNumber}
                keyboardType="numeric"
                style={styles.input}
              />
              <GameButton label={t('game.submit')} onPress={submitInput} disabled={!inputNumber} />
            </GlassCard>
          )}

          {questionType === "target_select" && isMyTurn && (
            <GlassCard>
              <Text style={styles.sectionLabel}>{t('game.selectOne')}</Text>
              <ShimmerLine />
              {playerEntries.filter((p) => p.id !== myId).map((p) => (
                <GameButton key={p.id} label={p.name} onPress={() => submitTarget(p.id)} variant="secondary" />
              ))}
            </GlassCard>
          )}

          {questionType === "target_select" && !isMyTurn && (
            <View style={styles.waitingBox}>
              <Text style={styles.waitingDots}>...</Text>
              <Text style={styles.waitingText}>{t('format.selecting')(currentTurnPlayerName || t('game.nextPlayer'))}</Text>
            </View>
          )}
        </>
      )}

      {isChallenger && phase === "reveal" && currentResult && (() => {
        const parts = currentResult.split("|");
        const answerPart = parts[0];
        const drinkerPart = parts.length > 1 ? parts[1] : null;
        return (
          <>
            <Animated.View style={{ transform: [{ scale: dareResultScale }] }}>
              <GlassCard>
                <Text style={styles.questionEyebrow}>{t('game.result')}</Text>
                <Text style={styles.revealText}>{answerPart}</Text>
              </GlassCard>
            </Animated.View>
            {revealStep >= 2 && drinkerPart && (
              <GlassCard>
                <Text style={styles.revealDrinker}>{drinkerPart}</Text>
              </GlassCard>
            )}
          </>
        );
      })()}
    </View>
  );
}
