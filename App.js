import { StatusBar } from "expo-status-bar";
import { Animated, Easing, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from "react-native";
import { useEffect, useRef, useState } from "react";
import * as Clipboard from "expo-clipboard";
import { io } from "socket.io-client";

const SCREENS = { HOME: "home", LOBBY: "lobby" };
const SERVER_URL = "http://localhost:3005";

function GameButton({ label, onPress, variant = "primary" }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === "secondary" ? styles.secondaryButton : styles.primaryButton,
        pressed && styles.buttonPressed
      ]}
    >
      <Text style={[styles.buttonText, variant === "secondary" ? styles.secondaryButtonText : styles.primaryButtonText]}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function App() {
  const socketRef = useRef(null);
  const revealX = useRef(new Animated.Value(400)).current;
  const cardAnim = useRef(new Animated.Value(1)).current;
  const setupTabAnim = useRef(new Animated.Value(0)).current;

  const [screen, setScreen] = useState(SCREENS.HOME);
  const [playerName, setPlayerName] = useState("");
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [setupTab, setSetupTab] = useState("create");
  const [setupPanelWidth, setSetupPanelWidth] = useState(0);

  const [activeRoomCode, setActiveRoomCode] = useState("");
  const [modeLabel, setModeLabel] = useState(null);
  const [modePickerStep, setModePickerStep] = useState("main");
  const [ownerId, setOwnerId] = useState(null);
  const [myId, setMyId] = useState(null);
  const [players, setPlayers] = useState([]);
  const [phase, setPhase] = useState("lobby");
  const [question, setQuestion] = useState("");
  const [answersCount, setAnswersCount] = useState(0);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [revealItem, setRevealItem] = useState(null);

  const isOwner = !!myId && myId === ownerId;
  const isNormalNever = modeLabel === "Ben Daha Önce Hiç - Normal";

  const navigateTo = (next) => {
    if (next === screen) return;
    Animated.timing(cardAnim, {
      toValue: 0,
      duration: 120,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true
    }).start(() => {
      setScreen(next);
      Animated.timing(cardAnim, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }).start();
    });
  };

  const runRevealSequence = (sequence) => {
    if (!sequence?.length) return setRevealItem(null);
    let i = 0;
    const next = () => {
      if (i >= sequence.length) return setRevealItem(null);
      const item = sequence[i++];
      setRevealItem(item);
      revealX.setValue(360);
      Animated.sequence([
        Animated.timing(revealX, {
          toValue: 0,
          duration: 420,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true
        }),
        Animated.delay(450),
        Animated.timing(revealX, {
          toValue: -360,
          duration: 320,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true
        })
      ]).start(next);
    };
    next();
  };

  useEffect(() => {
    const socket = io(SERVER_URL, { transports: ["websocket"], autoConnect: true });
    socketRef.current = socket;

    socket.on("connect", () => setMyId(socket.id));

    const applyState = (payload) => {
      setActiveRoomCode(payload.roomCode || "");
      setModeLabel(payload.modeLabel || null);
      setModePickerStep(payload.modeLabel ? "done" : "main");
      setOwnerId(payload.ownerId || null);
      setPlayers(payload.players || []);
      setPhase(payload.phase || "lobby");
      setQuestion(payload.currentQuestion || "");
      setAnswersCount(payload.answersCount || 0);
      setTotalPlayers(payload.totalPlayers || 0);
    };

    socket.on("room_joined", (payload) => {
      applyState(payload);
      setError("");
      navigateTo(SCREENS.LOBBY);
    });

    socket.on("room_state", applyState);
    socket.on("reveal_sequence", ({ sequence }) => runRevealSequence(sequence || []));
    socket.on("room_error", ({ message }) => setError(message || "Bir hata oluştu."));

    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    Animated.timing(setupTabAnim, {
      toValue: setupTab === "join" ? 1 : 0,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true
    }).start();
  }, [setupTab, setupTabAnim]);

  const createRoom = () => {
    if (!playerName.trim()) return setError("Önce ismini yaz.");
    setError("");
    socketRef.current?.emit("create_room", { playerName: playerName.trim() });
  };

  const joinRoom = () => {
    if (!playerName.trim()) return setError("Önce ismini yaz.");
    if (!roomCodeInput.trim()) return setError("Oda kodunu gir.");
    setError("");
    socketRef.current?.emit("join_room", {
      playerName: playerName.trim(),
      roomCode: roomCodeInput.trim().toUpperCase()
    });
  };

  const leaveRoom = () => {
    socketRef.current?.emit("leave_room");
    setModeLabel(null);
    setQuestion("");
    setRevealItem(null);
    navigateTo(SCREENS.HOME);
  };

  const enterModeSelect = () => socketRef.current?.emit("enter_mode_select");
  const setMode = (m) => socketRef.current?.emit("set_mode", { modeLabel: m });
  const startGame = () => socketRef.current?.emit("start_game");
  const submitAnswer = (answer) => socketRef.current?.emit("submit_answer", { answer });
  const nextQuestion = () => socketRef.current?.emit("next_question");

  const copyCode = async () => {
    if (!activeRoomCode || phase !== "lobby") return;
    await Clipboard.setStringAsync(activeRoomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const setupSlideX = setupTabAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -(setupPanelWidth || 1)] });
  const setupCreateOpacity = setupTabAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.35] });
  const setupJoinOpacity = setupTabAnim.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] });

  const cardOpacity = cardAnim.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] });
  const cardTranslateY = cardAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.page}>
        <View style={styles.topGlow} />
        <View style={styles.bottomGlow} />

        {screen === SCREENS.LOBBY && (
          <Pressable style={styles.backButton} onPress={leaveRoom}>
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>
        )}

        <View style={styles.header}>
          <Text style={styles.title}>{screen === SCREENS.HOME ? "Oda" : "Lobi"}</Text>
          <Text style={styles.subtitle}>
            {screen === SCREENS.HOME
              ? "Önce oda kur veya odaya katıl."
              : phase === "mode_select"
                ? "Oyun modu seçiliyor"
                : `Mod: ${modeLabel || "Henüz seçilmedi"}`}
          </Text>
        </View>

        <Animated.View style={[styles.card, { opacity: cardOpacity, transform: [{ translateY: cardTranslateY }] }]}>
          {screen === SCREENS.HOME && (
            <View style={styles.stack}>
              <TextInput
                placeholder="İsmin"
                placeholderTextColor="#94A3B8"
                value={playerName}
                onChangeText={setPlayerName}
                style={styles.input}
              />

              <View style={styles.segmentWrap}>
                <Pressable style={[styles.segmentButton, setupTab === "create" && styles.segmentButtonActive]} onPress={() => setSetupTab("create")}>
                  <Text style={[styles.segmentText, setupTab === "create" && styles.segmentTextActive]}>Oda Oluştur</Text>
                </Pressable>
                <Pressable style={[styles.segmentButton, setupTab === "join" && styles.segmentButtonActive]} onPress={() => setSetupTab("join")}>
                  <Text style={[styles.segmentText, setupTab === "join" && styles.segmentTextActive]}>Odaya Katıl</Text>
                </Pressable>
              </View>

              <View style={styles.panelViewport} onLayout={(e) => setSetupPanelWidth(e.nativeEvent.layout.width)}>
                <Animated.View style={[styles.panelTrack, { width: (setupPanelWidth || 1) * 2, transform: [{ translateX: setupSlideX }] }]}>
                  <Animated.View style={[styles.panelPage, { width: setupPanelWidth || 1, opacity: setupCreateOpacity }]}>
                    <GameButton label="Yeni Oda Oluştur" onPress={createRoom} />
                  </Animated.View>
                  <Animated.View style={[styles.panelPage, { width: setupPanelWidth || 1, opacity: setupJoinOpacity }]}>
                    <View style={styles.stack}>
                      <TextInput
                        placeholder="Oda kodu"
                        placeholderTextColor="#94A3B8"
                        value={roomCodeInput}
                        onChangeText={(v) => setRoomCodeInput(v.toUpperCase())}
                        style={styles.input}
                      />
                      <GameButton label="Odaya Katıl" onPress={joinRoom} variant="secondary" />
                    </View>
                  </Animated.View>
                </Animated.View>
              </View>

              {!!error && <Text style={styles.errorText}>{error}</Text>}
            </View>
          )}

          {screen === SCREENS.LOBBY && (
            <View style={styles.stack}>
              {phase === "lobby" && (
                <>
                  <View style={styles.lobbyInfoBox}>
                    <View style={styles.codeHeaderRow}>
                      <Text style={styles.lobbyLabel}>Oda Kodu</Text>
                      <Pressable style={styles.copyBtn} onPress={copyCode}>
                        <Text style={styles.copyBtnIcon}>{copied ? "✓" : "⧉"}</Text>
                      </Pressable>
                    </View>
                    <Text style={styles.lobbyCode}>{activeRoomCode}</Text>
                  </View>

                  <View style={styles.lobbyInfoBox}>
                    <Text style={styles.lobbyLabel}>Oyuncular ({players.length})</Text>
                    {players.map((name, idx) => (
                      <Text key={`${name}-${idx}`} style={styles.lobbyValue}>• {name}</Text>
                    ))}
                  </View>

                  {!modeLabel && isOwner && (
                    <View style={styles.lobbyInfoBox}>
                      <GameButton label="Oyun Seç" onPress={enterModeSelect} />
                    </View>
                  )}

                  {!modeLabel && !isOwner && (
                    <View style={styles.lobbyInfoBox}>
                      <Text style={styles.emptyText}>Host "Oyun Seç" adımına geçecek.</Text>
                    </View>
                  )}
                </>
              )}

              {phase === "mode_select" && !modeLabel && (
                <View style={styles.lobbyInfoBox}>
                  <Text style={styles.lobbyLabel}>Mod Seçimi</Text>
                  {isOwner ? (
                    <View style={styles.stack}>
                      {modePickerStep === "main" && (
                        <>
                          <GameButton label="Ben Daha Önce Hiç" onPress={() => setModePickerStep("never_sub")} />
                          <GameButton label="Yap Ya da İç" onPress={() => setMode("Yap Ya da İç")} variant="secondary" />
                        </>
                      )}
                      {modePickerStep === "never_sub" && (
                        <>
                          <GameButton label="Kız Kıza" onPress={() => setMode("Ben Daha Önce Hiç - Kız Kıza")} />
                          <GameButton label="Normal" onPress={() => setMode("Ben Daha Önce Hiç - Normal")} variant="secondary" />
                          <GameButton label="Geri" onPress={() => setModePickerStep("main")} variant="secondary" />
                        </>
                      )}
                    </View>
                  ) : (
                    <Text style={styles.emptyText}>Host mod seçiyor...</Text>
                  )}
                </View>
              )}

              {phase === "mode_select" && !!modeLabel && (
                <View style={styles.lobbyInfoBox}>
                  <Text style={styles.waitingText}>Mod seçildi. Oyunu başlat.</Text>
                  {isOwner ? <GameButton label="Lobiyi Başlat" onPress={startGame} /> : <Text style={styles.emptyText}>Host başlatmayı bekliyorsun.</Text>}
                </View>
              )}

              {isNormalNever && phase === "question" && (
                <View style={styles.lobbyInfoBox}>
                  <Text style={styles.lobbyLabel}>Soru</Text>
                  <Text style={styles.questionText}>{question}</Text>
                  <View style={styles.answerRow}>
                    <GameButton label="Yaptım" onPress={() => submitAnswer("did")} />
                    <GameButton label="Yapmadım" onPress={() => submitAnswer("didNot")} variant="secondary" />
                  </View>
                  <Text style={styles.emptyText}>Cevaplayan: {answersCount}/{totalPlayers}</Text>
                </View>
              )}

              {isNormalNever && phase === "reveal" && (
                <View style={styles.lobbyInfoBox}>
                  <Text style={styles.lobbyLabel}>Sonuçlar</Text>
                  <View style={styles.revealStage}>
                    {revealItem ? (
                      <Animated.Text style={[styles.revealText, { transform: [{ translateX: revealX }] }]}>
                        {revealItem.name} {revealItem.answer === "did" ? "Yaptım" : "Yapmadım"}
                      </Animated.Text>
                    ) : (
                      <Text style={styles.emptyText}>Animasyon tamamlandı.</Text>
                    )}
                  </View>
                  {isOwner && <GameButton label="Sonraki Soru" onPress={nextQuestion} variant="secondary" />}
                </View>
              )}
            </View>
          )}
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#05070F" },
  page: { flex: 1, justifyContent: "center", paddingHorizontal: 22, paddingVertical: 18 },
  topGlow: { position: "absolute", top: -110, right: -90, width: 280, height: 280, borderRadius: 140, backgroundColor: "#FF4D6D", opacity: 0.22 },
  bottomGlow: { position: "absolute", bottom: -120, left: -100, width: 300, height: 300, borderRadius: 150, backgroundColor: "#00D4FF", opacity: 0.18 },
  backButton: { position: "absolute", top: 6, left: 4, zIndex: 10, width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: "#2A3A63", backgroundColor: "#131C34", alignItems: "center", justifyContent: "center" },
  backIcon: { color: "#E2E8F0", fontSize: 28, lineHeight: 28, marginTop: -2, fontWeight: "700" },
  header: { alignItems: "stretch", marginBottom: 22 },
  title: { fontSize: 38, fontWeight: "800", textAlign: "center", color: "#F8FAFC", letterSpacing: 0.3 },
  subtitle: { marginTop: 10, fontSize: 15, lineHeight: 22, textAlign: "center", color: "#CBD5E1", maxWidth: 320, alignSelf: "center" },
  card: { borderRadius: 24, backgroundColor: "#0E1529", padding: 18, borderWidth: 1, borderColor: "#24314F" },
  stack: { gap: 12 },
  segmentWrap: { flexDirection: "row", backgroundColor: "#131C34", borderRadius: 14, padding: 4, borderWidth: 1, borderColor: "#2A3A63" },
  segmentButton: { flex: 1, height: 42, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  segmentButtonActive: { backgroundColor: "#FF4D6D" },
  segmentText: { color: "#A5B4FC", fontSize: 14, fontWeight: "700" },
  segmentTextActive: { color: "#FFF" },
  panelViewport: { overflow: "hidden" },
  panelTrack: { flexDirection: "row" },
  panelPage: { justifyContent: "flex-start" },
  input: { height: 52, borderRadius: 14, borderWidth: 1, borderColor: "#2A3A63", backgroundColor: "#131C34", color: "#E2E8F0", paddingHorizontal: 14, fontSize: 16, fontWeight: "600" },
  button: { paddingVertical: 18, paddingHorizontal: 16, borderRadius: 16, borderWidth: 1 },
  primaryButton: { backgroundColor: "#FF4D6D", borderColor: "#FF6B86" },
  secondaryButton: { backgroundColor: "#1A2440", borderColor: "#2A3A63" },
  buttonText: { textAlign: "center", fontWeight: "800", fontSize: 17, letterSpacing: 0.2 },
  primaryButtonText: { color: "#FFF" },
  secondaryButtonText: { color: "#C7D2FE" },
  buttonPressed: { transform: [{ scale: 0.98 }], opacity: 0.92 },
  errorText: { color: "#FCA5A5", fontSize: 13, fontWeight: "600", textAlign: "center" },
  lobbyInfoBox: { borderRadius: 14, borderWidth: 1, borderColor: "#2A3A63", backgroundColor: "#131C34", paddingVertical: 12, paddingHorizontal: 14 },
  codeHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  copyBtn: { width: 28, height: 28, borderRadius: 8, borderWidth: 1, borderColor: "#334B7A", backgroundColor: "#172345", alignItems: "center", justifyContent: "center" },
  copyBtnIcon: { color: "#E2E8F0", fontSize: 14, fontWeight: "800" },
  lobbyLabel: { color: "#94A3B8", fontSize: 12, marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 },
  lobbyCode: { color: "#F8FAFC", fontSize: 30, fontWeight: "800", letterSpacing: 2, textAlign: "center" },
  questionText: { color: "#E2E8F0", fontSize: 16, lineHeight: 22, marginBottom: 10 },
  answerRow: { gap: 8, marginBottom: 8 },
  revealStage: { minHeight: 54, alignItems: "center", justifyContent: "center", overflow: "hidden", marginBottom: 10 },
  revealText: { color: "#F8FAFC", fontSize: 22, fontWeight: "800" },
  emptyText: { color: "#94A3B8", fontStyle: "italic" },
  lobbyValue: { color: "#E2E8F0", fontSize: 16, fontWeight: "700", marginBottom: 4 },
  waitingText: { color: "#CBD5E1", fontSize: 14, textAlign: "center" }
});
