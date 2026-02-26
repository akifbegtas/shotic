import { Dimensions, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import GlassCard from "../components/GlassCard";
import GameButton from "../components/GameButton";
import ShimmerLine from "../components/ShimmerLine";
import PlayerChip from "../components/PlayerChip";
import { styles } from "../styles";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function DareSetupScreen({
  t, dareNameInput, setDareNameInput, addDarePlayer,
  darePlayerNames, removeDarePlayer, startDareGame,
}) {
  return (
    <View style={styles.stack}>
      <View style={styles.inputWrapper}>
        <Text style={styles.inputLabel}>{t('dareSetup.playerName')}</Text>
        <View style={styles.inputRow}>
          <TextInput
            placeholder={t('dareSetup.namePlaceholder')}
            placeholderTextColor="#52525B"
            value={dareNameInput}
            onChangeText={setDareNameInput}
            onSubmitEditing={addDarePlayer}
            style={[styles.input, styles.inputFlex]}
            returnKeyType="done"
          />
          <Pressable style={styles.addBtn} onPress={addDarePlayer}>
            <LinearGradient
              colors={["#0EA5E9", "#06B6D4"]}
              style={styles.addBtnGradient}
            >
              <Text style={styles.addBtnText}>+</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>

      <GlassCard style={{ maxHeight: SCREEN_HEIGHT * 0.38 }}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>{t('dareSetup.players')}</Text>
          <View style={[styles.countBadge, { backgroundColor: "rgba(6,182,212,0.15)", borderColor: "rgba(6,182,212,0.3)" }]}>
            <Text style={[styles.countBadgeText, { color: "#06B6D4" }]}>{darePlayerNames.length}</Text>
          </View>
        </View>
        <ShimmerLine />
        {darePlayerNames.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>👥</Text>
            <Text style={styles.emptyStateText}>{t('dareSetup.noPlayers')}</Text>
            <Text style={styles.emptyStateHint}>{t('dareSetup.addHint')}</Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ maxHeight: SCREEN_HEIGHT * 0.28 }}
            contentContainerStyle={styles.playerGrid}
          >
            {darePlayerNames.map((name, idx) => (
              <PlayerChip
                key={idx}
                name={name}
                index={idx}
                onRemove={() => removeDarePlayer(idx)}
              />
            ))}
          </ScrollView>
        )}
      </GlassCard>

      <GameButton
        label={t('dareSetup.startGame')}
        onPress={startDareGame}
        disabled={darePlayerNames.length < 2}
        colors={["#0EA5E9", "#06B6D4", "#0891B2"]}
      />
    </View>
  );
}
