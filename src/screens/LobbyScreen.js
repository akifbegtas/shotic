import { Pressable, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import GlassCard from "../components/GlassCard";
import GameButton from "../components/GameButton";
import ShimmerLine from "../components/ShimmerLine";
import PlayerAvatar from "../components/PlayerAvatar";
import { styles } from "../styles";

export default function LobbyScreen({
  t, activeRoomCode, copied, copyCode, players, isOwner, startGame,
}) {
  return (
    <View style={styles.stack}>
      <GlassCard>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>{t('lobby.roomCode')}</Text>
          <Pressable style={styles.copyBtn} onPress={copyCode}>
            <LinearGradient
              colors={copied ? ["#22C55E", "#16A34A"] : ["#3F3F46", "#27272A"]}
              style={styles.copyBtnGradient}
            >
              <Text style={styles.copyBtnIcon}>{copied ? "✓" : "⧉"}</Text>
            </LinearGradient>
          </Pressable>
        </View>
        <Text style={styles.lobbyCode}>{activeRoomCode}</Text>
        <Text style={styles.lobbyHint}>{t('lobby.shareHint')}</Text>
      </GlassCard>

      <GlassCard>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>{t('lobby.players')}</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{players.length}</Text>
          </View>
        </View>
        <ShimmerLine />
        {players.map((name, idx) => (
          <PlayerAvatar key={`${name}-${idx}`} name={name} index={idx} isHost={idx === 0} />
        ))}
      </GlassCard>

      {isOwner && (
        <GameButton label={t('lobby.startGame')} onPress={startGame} />
      )}

      {!isOwner && (
        <View style={styles.waitingBox}>
          <Text style={styles.waitingDots}>...</Text>
          <Text style={styles.waitingText}>{t('lobby.waitingHost')}</Text>
        </View>
      )}
    </View>
  );
}
