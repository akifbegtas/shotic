import { Animated, Pressable, Text, TextInput, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import GameButton from "../components/GameButton";
import { styles } from "../styles";

export default function HomeScreen({
  t, selectedMode, navigateTo, playerName, setPlayerName,
  setupTab, setSetupTab, setupPanelWidth, setSetupPanelWidth,
  setupSlideX, setupCreateOpacity, setupJoinOpacity,
  createRoom, joinRoom, roomCodeInput, setRoomCodeInput,
}) {
  return (
    <View style={styles.stack}>
      <Pressable
        style={[styles.modeOption, selectedMode && styles.modeOptionActive]}
        onPress={() => navigateTo("mode_main")}
      >
        <View style={styles.modeOptionLeft}>
          <Text style={styles.modeOptionIcon}>{selectedMode ? "✓" : "+"}</Text>
          <Text style={[styles.modeOptionText, selectedMode && styles.modeOptionTextActive]}>
            {selectedMode ? selectedMode.label : t('home.selectMode')}
          </Text>
        </View>
        <Text style={{ color: "#71717A", fontSize: 20 }}>›</Text>
      </Pressable>

      {selectedMode && (
        <>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>{t('home.yourName')}</Text>
            <TextInput
              placeholder={t('home.namePlaceholder')}
              placeholderTextColor="#52525B"
              value={playerName}
              onChangeText={setPlayerName}
              style={styles.input}
            />
          </View>

          <View style={styles.segmentWrap}>
            <Pressable style={[styles.segmentButton, setupTab === "create" && styles.segmentButtonActive]} onPress={() => setSetupTab("create")}>
              {setupTab === "create" ? (
                <LinearGradient colors={["#EC4899", "#A855F7"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.segmentGradient}>
                  <Text style={styles.segmentTextActive}>{t('home.createRoom')}</Text>
                </LinearGradient>
              ) : (
                <Text style={styles.segmentText}>{t('home.createRoom')}</Text>
              )}
            </Pressable>
            <Pressable style={[styles.segmentButton, setupTab === "join" && styles.segmentButtonActive]} onPress={() => setSetupTab("join")}>
              {setupTab === "join" ? (
                <LinearGradient colors={["#EC4899", "#A855F7"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.segmentGradient}>
                  <Text style={styles.segmentTextActive}>{t('home.joinRoom')}</Text>
                </LinearGradient>
              ) : (
                <Text style={styles.segmentText}>{t('home.joinRoom')}</Text>
              )}
            </Pressable>
          </View>

          <View style={styles.panelViewport} onLayout={(e) => setSetupPanelWidth(e.nativeEvent.layout.width)}>
            <Animated.View style={[styles.panelTrack, { width: (setupPanelWidth || 1) * 2, transform: [{ translateX: setupSlideX }] }]}>
              <Animated.View style={[styles.panelPage, { width: setupPanelWidth || 1, opacity: setupCreateOpacity }]}>
                <GameButton label={t('home.newRoom')} onPress={createRoom} />
              </Animated.View>
              <Animated.View style={[styles.panelPage, { width: setupPanelWidth || 1, opacity: setupJoinOpacity }]}>
                <View style={styles.stack}>
                  <TextInput
                    placeholder={t('home.roomCode')}
                    placeholderTextColor="#52525B"
                    value={roomCodeInput}
                    onChangeText={(v) => setRoomCodeInput(v.toUpperCase())}
                    style={styles.input}
                  />
                  <GameButton label={t('home.joinRoom')} onPress={joinRoom} variant="secondary" />
                </View>
              </Animated.View>
            </Animated.View>
          </View>
        </>
      )}
    </View>
  );
}
