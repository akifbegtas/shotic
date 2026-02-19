import { StatusBar } from "expo-status-bar";
import {
  Animated, Easing, LayoutAnimation, Platform, Pressable,
  SafeAreaView, ScrollView, StyleSheet, Text, TextInput, UIManager, View
} from "react-native";
import { Component, useEffect, useRef, useState } from "react";
import * as Clipboard from "expo-clipboard";
import { io } from "socket.io-client";

const SERVER_URL =
  (process.env.EXPO_PUBLIC_SERVER_URL || "").trim() ||
  (Platform.OS === "android" ? "http://10.0.2.2:3003" : "http://localhost:3003");

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function GameButton({ label, onPress, variant = "primary", disabled = false }) {
  return (
    <Pressable
      onPress={disabled ? null : onPress}
      style={({ pressed }) => [
        styles.button,
        variant === "secondary" ? styles.secondaryButton : styles.primaryButton,
        (pressed && !disabled) && styles.buttonPressed,
        disabled && { opacity: 0.4 }
      ]}
    >
      <Text style={[styles.buttonText, variant === "secondary" ? styles.secondaryButtonText : styles.primaryButtonText]}>
        {label}
      </Text>
    </Pressable>
  );
}

function ShotGlassBackground() {
  const glasses = useRef(
    Array.from({ length: 12 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100 + "%",
      top: Math.random() * 100 + "%",
      rotate: Math.random() * 360 + "deg",
      scale: 0.5 + Math.random() * 0.8,
      opacity: 0.08 + Math.random() * 0.12
    }))
  ).current;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {glasses.map((g) => (
        <Text key={g.id} style={{
          position: "absolute", left: g.left, top: g.top, fontSize: 40,
          transform: [{ rotate: g.rotate }, { scale: g.scale }], opacity: g.opacity
        }}>🥃</Text>
      ))}
    </View>
  );
}

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error("Crash:", error, info); }
  render() {
    if (this.state.hasError) return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: "center", alignItems: "center", padding: 24 }]}> 
        <Text style={{ color: "#FF4D6D", fontSize: 22, fontWeight: "800", marginBottom: 12 }}>Bir hata oluştu</Text>
        <Text style={{ color: "#CBD5E1", textAlign: "center", marginBottom: 24 }}>{this.state.error?.toString()}</Text>
        <GameButton label="Tekrar Dene" onPress={() => this.setState({ hasError: false })} />
      </SafeAreaView>
    );
    return this.props.children;
  }
}

const SCREENS = {
  HOME: "home",
  MODE_MAIN: "mode_main",
  MODE_NEVER_SUB: "mode_never_sub",
  LOBBY: "lobby",
  GAME: "game"
};

const MAIN_GAME_TYPES = [
  { id: "never", label: "Ben Daha Önce Hiç" },
  { id: "dare", label: "Yap Ya da İç" }
];

const NEVER_SUB_MODES = [
  { id: "never_normal", label: "Normal", serverLabel: "Ben Daha Önce Hiç - Normal" },
  { id: "never_girls", label: "Kız Kıza", serverLabel: "Ben Daha Önce Hiç - Kız Kıza" }
];

const DARE_MODE = { id: "dare", label: "Yap Ya da İç" };

function AppContent() {
  const socketRef = useRef(null);
  const revealX = useRef(new Animated.Value(400)).current;
  const cardAnim = useRef(new Animated.Value(1)).current;
  const dareRevealScale = useRef(new Animated.Value(1)).current;
  const createTabAnim = useRef(new Animated.Value(1)).current;
  const joinTabAnim = useRef(new Animated.Value(0)).current;
  const phaseRef = useRef("lobby");
  const questionKeyRef = useRef("");

  const [screen, setScreen] = useState(SCREENS.HOME);

  const [playerName, setPlayerName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [tab, setTab] = useState("create");
  const [selectedMainMode, setSelectedMainMode] = useState(null);
  const [selectedNeverSubMode, setSelectedNeverSubMode] = useState(null);

  const [myId, setMyId] = useState(null);
  const [ownerId, setOwnerId] = useState(null);
  const [activeRoomCode, setActiveRoomCode] = useState("");
  const [modeId, setModeId] = useState(null);
  const [modeLabel, setModeLabel] = useState("");
  const [players, setPlayers] = useState([]);
  const [playerEntries, setPlayerEntries] = useState([]);
  const [currentTurnPlayerId, setCurrentTurnPlayerId] = useState(null);
  const [currentTurnPlayerName, setCurrentTurnPlayerName] = useState("");
  const [phase, setPhase] = useState("lobby");
  const [question, setQuestion] = useState("");
  const [questionType, setQuestionType] = useState(null);
  const [questionResult, setQuestionResult] = useState(null);
  const [answersCount, setAnswersCount] = useState(0);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [selectedVoteTarget, setSelectedVoteTarget] = useState(null);
  const [selectedTargetPlayer, setSelectedTargetPlayer] = useState(null);
  const [selectedTrueFalse, setSelectedTrueFalse] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [revealItem, setRevealItem] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [isConnected, setIsConnected] = useState(false);

  const isOwner = !!myId && myId === ownerId;
  const isNeverMode = modeId === "never_normal" || modeId === "never_girls";
  const isDareMode = modeId === "dare";

  const fadeTo = (val, cb) => {
    Animated.timing(cardAnim, {
      toValue: val,
      duration: val === 0 ? 120 : 220,
      easing: val === 0 ? Easing.in(Easing.quad) : Easing.out(Easing.cubic),
      useNativeDriver: true
    }).start(cb);
  };

  const switchHomeTab = (nextTab) => {
    if (nextTab === tab) return;
    setTab(nextTab);
    Animated.parallel([
      Animated.timing(createTabAnim, {
        toValue: nextTab === "create" ? 1 : 0,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }),
      Animated.timing(joinTabAnim, {
        toValue: nextTab === "join" ? 1 : 0,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      })
    ]).start();
  };

  const navigateTo = (next) => {
    if (next === screen) return;
    fadeTo(0, () => { setScreen(next); fadeTo(1); });
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
        Animated.timing(revealX, { toValue: 0, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.delay(500),
        Animated.timing(revealX, { toValue: -360, duration: 320, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      ]).start(next);
    };
    next();
  };

  useEffect(() => {
    const socket = io(SERVER_URL, { transports: ["websocket"], autoConnect: true });
    socketRef.current = socket;

    socket.on("connect", () => { setIsConnected(true); setMyId(socket.id); });
    socket.on("disconnect", () => { setIsConnected(false); });
    socket.on("connect_error", () => { setIsConnected(false); });

    socket.on("room_joined", (payload) => {
      phaseRef.current = payload.phase || "lobby";
      setActiveRoomCode(payload.roomCode || "");
      setModeId(payload.modeId || null);
      setModeLabel(payload.modeLabel || "");
      setOwnerId(payload.ownerId || null);
      setPlayers(payload.players || []);
      setPlayerEntries(payload.playerEntries || []);
      setCurrentTurnPlayerId(payload.currentTurnPlayerId || null);
      setCurrentTurnPlayerName(payload.currentTurnPlayerName || "");
      setPhase(payload.phase || "lobby");
      setQuestion(payload.currentQuestion || "");
      setQuestionType(payload.currentQuestionType || null);
      setQuestionResult(payload.currentResult || null);
      questionKeyRef.current = `${payload.currentQuestion || ""}|${payload.currentQuestionType || ""}`;
      setAnswersCount(payload.answersCount || 0);
      setTotalPlayers(payload.totalPlayers || 0);
      setRevealItem(null);
      setError("");
      navigateTo(SCREENS.LOBBY);
    });

    socket.on("room_state", (payload) => {
      const newPhase = payload.phase || "lobby";
      const phaseChanged = newPhase !== phaseRef.current;

      const apply = () => {
        phaseRef.current = newPhase;
        setActiveRoomCode(payload.roomCode || "");
        setModeId(payload.modeId || null);
        setModeLabel(payload.modeLabel || "");
        setOwnerId(payload.ownerId || null);
        setPlayers(payload.players || []);
        setPlayerEntries(payload.playerEntries || []);
        setCurrentTurnPlayerId(payload.currentTurnPlayerId || null);
        setCurrentTurnPlayerName(payload.currentTurnPlayerName || "");
        setPhase(newPhase);
        setQuestion(payload.currentQuestion || "");
        setQuestionType(payload.currentQuestionType || null);
        setQuestionResult(payload.currentResult || null);
        const nextQuestionKey = `${payload.currentQuestion || ""}|${payload.currentQuestionType || ""}`;
        if (newPhase === "question" && questionKeyRef.current !== nextQuestionKey) {
          setSelectedVoteTarget(null);
          setSelectedTargetPlayer(null);
          setSelectedTrueFalse(null);
          setInputValue("");
        }
        questionKeyRef.current = nextQuestionKey;
        setAnswersCount(payload.answersCount || 0);
        setTotalPlayers(payload.totalPlayers || 0);
        if (newPhase === "question" || newPhase === "reveal") {
          setScreen(SCREENS.GAME);
        }
      };

      if (phaseChanged) {
        fadeTo(0, () => { apply(); fadeTo(1); });
      } else {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        apply();
      }
    });

    socket.on("reveal_sequence", ({ sequence }) => runRevealSequence(sequence || []));
    socket.on("room_error", ({ message }) => setError(message || "Bir hata oluştu."));

    return () => socket.disconnect();
  }, []);

  const createRoomWithMode = (mode) => {
    if (!playerName.trim()) return setError("Önce ismini yaz.");
    setError("");
    socketRef.current?.emit("create_room", {
      playerName: playerName.trim(),
      modeId: mode.id,
      modeLabel: mode.serverLabel || mode.label
    });
  };

  const continueCreateFlow = () => {
    if (!playerName.trim()) return setError("Önce ismini yaz.");
    setError("");
    setSelectedMainMode(null);
    setSelectedNeverSubMode(null);
    navigateTo(SCREENS.MODE_MAIN);
  };

  const onMainModeNext = () => {
    if (!selectedMainMode) return setError("Bir oyun seç.");
    setError("");

    if (selectedMainMode === "never") {
      setSelectedNeverSubMode(null);
      navigateTo(SCREENS.MODE_NEVER_SUB);
      return;
    }

    createRoomWithMode(DARE_MODE);
  };

  const onNeverSubModeCreate = () => {
    if (!selectedNeverSubMode) return setError("Bir mod seç.");
    const mode = NEVER_SUB_MODES.find((m) => m.id === selectedNeverSubMode);
    if (!mode) return setError("Geçersiz mod.");
    createRoomWithMode(mode);
  };

  const joinRoom = () => {
    if (!playerName.trim()) return setError("Önce ismini yaz.");
    if (!joinCode.trim()) return setError("Oda kodunu gir.");
    setError("");
    socketRef.current?.emit("join_room", {
      playerName: playerName.trim(),
      roomCode: joinCode.trim().toUpperCase()
    });
  };

  const startGame = () => socketRef.current?.emit("start_game");
  const submitAnswer = (answer) => socketRef.current?.emit("submit_answer", { answer });
  const submitVote = () => {
    if (!selectedVoteTarget) return;
    socketRef.current?.emit("submit_vote", { targetId: selectedVoteTarget });
  };
  const submitInput = () => {
    if (!inputValue.trim()) return;
    socketRef.current?.emit("submit_input", { value: Number(inputValue) });
  };
  const submitTarget = () => {
    if (!selectedTargetPlayer) return;
    socketRef.current?.emit("submit_target", { targetId: selectedTargetPlayer });
  };
  const submitTrueFalse = () => {
    if (selectedTrueFalse === null) return;
    socketRef.current?.emit("submit_true_false", { answer: selectedTrueFalse });
  };
  const nextQuestion = () => socketRef.current?.emit("next_question");
  const forceReveal = () => socketRef.current?.emit("force_reveal");

  const leaveRoom = () => {
    socketRef.current?.emit("leave_room");
    phaseRef.current = "lobby";
    setModeId(null);
    setModeLabel("");
    setPhase("lobby");
    setRevealItem(null);
    setQuestion("");
    setQuestionType(null);
    setQuestionResult(null);
    setSelectedVoteTarget(null);
    setSelectedTargetPlayer(null);
    setSelectedTrueFalse(null);
    setInputValue("");
    setPlayers([]);
    setPlayerEntries([]);
    setCurrentTurnPlayerId(null);
    setCurrentTurnPlayerName("");
    navigateTo(SCREENS.HOME);
  };

  const onBack = () => {
    if (screen === SCREENS.MODE_NEVER_SUB) {
      navigateTo(SCREENS.MODE_MAIN);
      return;
    }
    if (screen === SCREENS.MODE_MAIN) {
      navigateTo(SCREENS.HOME);
      return;
    }
    if (screen === SCREENS.LOBBY || screen === SCREENS.GAME) {
      leaveRoom();
    }
  };

  const copyCode = async () => {
    await Clipboard.setStringAsync(activeRoomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const cardOpacity = cardAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });
  const cardTranslateY = cardAnim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] });

  const showBack = screen !== SCREENS.HOME;
  const useCompactCard =
    screen === SCREENS.HOME ||
    screen === SCREENS.MODE_MAIN ||
    screen === SCREENS.MODE_NEVER_SUB;
  const useLobbyCard = screen === SCREENS.LOBBY || screen === SCREENS.GAME;
  const isMyTurn = !!myId && myId === currentTurnPlayerId;

  useEffect(() => {
    if (!(isDareMode && phase === "reveal" && questionResult)) return;
    dareRevealScale.setValue(0.92);
    Animated.sequence([
      Animated.timing(dareRevealScale, { toValue: 1.06, duration: 180, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(dareRevealScale, { toValue: 1, duration: 160, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]).start();
  }, [isDareMode, phase, questionResult, dareRevealScale]);
  const title =
    screen === SCREENS.HOME ? "Shot Challenge" :
    screen === SCREENS.MODE_MAIN ? "Oyun Seç" :
    screen === SCREENS.MODE_NEVER_SUB ? "Mod Seç" :
    screen === SCREENS.LOBBY ? "Lobi" : "Oyun";

  const subtitle =
    screen === SCREENS.HOME ? "İsmini yaz, oda oluştur veya katıl." :
    screen === SCREENS.MODE_MAIN ? "Önce ana oyun türünü seç." :
    screen === SCREENS.MODE_NEVER_SUB ? "" :
    screen === SCREENS.LOBBY ? `Mod: ${modeLabel || "—"}` :
    modeLabel;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={[styles.page, useCompactCard && styles.pageCentered]}>
        <ShotGlassBackground />
        <View style={styles.topGlow} />
        <View style={styles.bottomGlow} />

        {showBack && (
          <Pressable style={styles.backButton} onPress={onBack}>
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>
        )}
        {screen === SCREENS.MODE_NEVER_SUB && (
          <View style={styles.modeTag}>
            <Text style={styles.modeTagText}>Ben Daha Önce Hiç</Text>
          </View>
        )}

        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        <Animated.View style={[
          styles.card,
          useCompactCard && styles.cardCompact,
          useLobbyCard && styles.cardLobby,
          { opacity: cardOpacity, transform: [{ translateY: cardTranslateY }] }
        ]}>
          {useCompactCard ? (
            <View style={[styles.stack, styles.stackCentered]}>

              {screen === SCREENS.HOME && (
                <>
                  <TextInput
                    placeholder="İsmin"
                    placeholderTextColor="#94A3B8"
                    value={playerName}
                    onChangeText={setPlayerName}
                    style={styles.input}
                  />

                  <View style={styles.segmentWrap}>
                    <Pressable style={[styles.segmentButton, tab === "create" && styles.segmentButtonActive]} onPress={() => switchHomeTab("create")}>
                      <Text style={[styles.segmentText, tab === "create" && styles.segmentTextActive]}>Oda Oluştur</Text>
                    </Pressable>
                    <Pressable style={[styles.segmentButton, tab === "join" && styles.segmentButtonActive]} onPress={() => switchHomeTab("join")}>
                      <Text style={[styles.segmentText, tab === "join" && styles.segmentTextActive]}>Odaya Katıl</Text>
                    </Pressable>
                  </View>

                  <Animated.View
                    pointerEvents={tab === "create" ? "auto" : "none"}
                    style={{
                      opacity: createTabAnim,
                      transform: [{
                        translateX: createTabAnim.interpolate({ inputRange: [0, 1], outputRange: [-18, 0] })
                      }],
                      display: tab === "create" ? "flex" : "none"
                    }}
                  >
                    <GameButton label="Devam Et" onPress={continueCreateFlow} disabled={!playerName.trim()} />
                  </Animated.View>

                  <Animated.View
                    pointerEvents={tab === "join" ? "auto" : "none"}
                    style={{
                      opacity: joinTabAnim,
                      transform: [{
                        translateX: joinTabAnim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] })
                      }],
                      display: tab === "join" ? "flex" : "none"
                    }}
                  >
                    <>
                      <TextInput
                        placeholder="Oda kodu"
                        placeholderTextColor="#94A3B8"
                        value={joinCode}
                        onChangeText={(v) => setJoinCode(v.toUpperCase())}
                        style={styles.input}
                        autoCapitalize="characters"
                      />
                      <GameButton label="Odaya Katıl" onPress={joinRoom} variant="secondary" />
                    </>
                  </Animated.View>

                  {!!error && <Text style={styles.errorText}>{error}</Text>}
                  {!isConnected && (
                    <Text style={[styles.errorText, { color: "#FBBF24" }]}>Sunucuya bağlanılamadı. URL: {SERVER_URL}</Text>
                  )}
                </>
              )}

              {screen === SCREENS.MODE_MAIN && (
                <>
                  {MAIN_GAME_TYPES.map((item) => (
                    <Pressable
                      key={item.id}
                      onPress={() => setSelectedMainMode(item.id)}
                      style={[styles.modeOption, selectedMainMode === item.id && styles.modeOptionActive]}
                    >
                      <Text style={[styles.modeOptionText, selectedMainMode === item.id && styles.modeOptionTextActive]}>
                        {item.label}
                      </Text>
                      {selectedMainMode === item.id && <Text style={styles.modeCheck}>✓</Text>}
                    </Pressable>
                  ))}
                  <GameButton label="Devam" onPress={onMainModeNext} disabled={!selectedMainMode} />
                  {!!error && <Text style={styles.errorText}>{error}</Text>}
                </>
              )}

              {screen === SCREENS.MODE_NEVER_SUB && (
                <>
                  {NEVER_SUB_MODES.map((item) => (
                    <Pressable
                      key={item.id}
                      onPress={() => setSelectedNeverSubMode(item.id)}
                      style={[styles.modeOption, selectedNeverSubMode === item.id && styles.modeOptionActive]}
                    >
                      <Text style={[styles.modeOptionText, selectedNeverSubMode === item.id && styles.modeOptionTextActive]}>
                        {item.label}
                      </Text>
                      {selectedNeverSubMode === item.id && <Text style={styles.modeCheck}>✓</Text>}
                    </Pressable>
                  ))}
                  <GameButton label="Oda Oluştur" onPress={onNeverSubModeCreate} disabled={!selectedNeverSubMode} />
                  {!!error && <Text style={styles.errorText}>{error}</Text>}
                </>
              )}

              {screen === SCREENS.LOBBY && (
                <>
                  <View style={styles.lobbyInfoBox}>
                    <View style={styles.codeHeaderRow}>
                      <Text style={styles.lobbyLabel}>Oda Kodu</Text>
                      <Pressable style={styles.copyBtn} onPress={copyCode}>
                        <Text style={styles.copyBtnIcon}>{copied ? "✓" : "⧉"}</Text>
                      </Pressable>
                    </View>
                    <Text style={styles.lobbyCode}>{activeRoomCode}</Text>
                    <Text style={styles.lobbyHint}>Bu kodu arkadaşlarınla paylaş</Text>
                  </View>

                  <View style={styles.lobbyInfoBox}>
                    <Text style={styles.lobbyLabel}>Oyuncular ({players.length})</Text>
                    {players.map((name, idx) => (
                      <Text key={`${name}-${idx}`} style={styles.lobbyValue}>• {name}</Text>
                    ))}
                  </View>

                  {isOwner ? (
                    <GameButton label="Oyunu Başlat 🚀" onPress={startGame} />
                  ) : (
                    <View style={styles.lobbyInfoBox}>
                      <Text style={styles.emptyText}>Host oyunu başlatmayı bekliyor...</Text>
                    </View>
                  )}

                  {!!error && <Text style={styles.errorText}>{error}</Text>}
                </>
              )}

              {screen === SCREENS.GAME && (
                <>
                  {isNeverMode && phase === "question" && (
                    <View style={styles.lobbyInfoBox}>
                      <Text style={styles.lobbyLabel}>Soru</Text>
                      <Text style={styles.questionText}>{question}</Text>
                      <View style={styles.answerRow}>
                        <GameButton label="Yaptım ✅" onPress={() => submitAnswer("did")} />
                        <GameButton label="Yapmadım ❌" onPress={() => submitAnswer("didNot")} variant="secondary" />
                      </View>
                      <Text style={styles.emptyText}>Cevaplayan: {answersCount}/{totalPlayers}</Text>
                      {isOwner && answersCount > 0 && (
                        <GameButton label="Sonuçları Göster" onPress={forceReveal} variant="secondary" />
                      )}
                    </View>
                  )}

                  {isNeverMode && phase === "reveal" && (
                    <View style={styles.lobbyInfoBox}>
                      <Text style={styles.lobbyLabel}>Sonuçlar</Text>
                      <View style={styles.revealStage}>
                        {revealItem ? (
                          <Animated.Text style={[styles.revealText, { transform: [{ translateX: revealX }] }]}> 
                            {revealItem.name}: {revealItem.answer === "did" ? "Yaptım 🥂" : "Yapmadım 😇"}
                          </Animated.Text>
                        ) : (
                          <Text style={styles.emptyText}>Tüm sonuçlar gösterildi.</Text>
                        )}
                      </View>
                      {isOwner && <GameButton label="Sonraki Soru →" onPress={nextQuestion} variant="secondary" />}
                    </View>
                  )}

                  {isDareMode && phase === "question" && (
                    <View style={styles.lobbyInfoBox}>
                      <Text style={styles.lobbyLabel}>Görev</Text>
                      <Text style={styles.questionText}>{question}</Text>
                      {isOwner ? (
                        <GameButton label="Sonraki Görev →" onPress={nextQuestion} variant="secondary" />
                      ) : (
                        <Text style={styles.emptyText}>Host sonraki görevi açacak.</Text>
                      )}
                    </View>
                  )}
                </>
              )}

            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={styles.stack}>
                {screen === SCREENS.LOBBY && (
                  <>
                    <View style={styles.lobbyInfoBox}>
                      <View style={styles.codeHeaderRow}>
                        <Text style={styles.lobbyLabel}>Oda Kodu</Text>
                        <Pressable style={styles.copyBtn} onPress={copyCode}>
                          <Text style={styles.copyBtnIcon}>{copied ? "✓" : "⧉"}</Text>
                        </Pressable>
                      </View>
                      <Text style={styles.lobbyCode}>{activeRoomCode}</Text>
                      <Text style={styles.lobbyHint}>Bu kodu arkadaşlarınla paylaş</Text>
                    </View>

                    <View style={styles.lobbyInfoBox}>
                      <Text style={styles.lobbyLabel}>Oyuncular ({players.length})</Text>
                      {players.map((name, idx) => (
                        <Text key={`${name}-${idx}`} style={styles.lobbyValue}>• {name}</Text>
                      ))}
                    </View>

                    {isOwner ? (
                      <GameButton label="Oyunu Başlat 🚀" onPress={startGame} />
                    ) : (
                      <View style={styles.lobbyInfoBox}>
                        <Text style={styles.emptyText}>Host oyunu başlatmayı bekliyor...</Text>
                      </View>
                    )}

                    {!!error && <Text style={styles.errorText}>{error}</Text>}
                  </>
                )}

                {screen === SCREENS.GAME && (
                  <>
                    {isNeverMode && phase === "question" && (
                      <View style={styles.lobbyInfoBox}>
                        <Text style={styles.questionEyebrow}>BU TURUN SORUSU</Text>
                        <View style={styles.questionHero}>
                          <View style={styles.questionCardInner}>
                            <View style={styles.questionCardTop}>
                              <Text style={styles.questionIllustration}>🤝💔🤝</Text>
                            </View>
                            <Text style={styles.questionTextNever}>{question}</Text>
                          </View>
                        </View>
                        <View style={styles.answerRow}>
                          <GameButton label="Yaptım ✅" onPress={() => submitAnswer("did")} />
                          <GameButton label="Yapmadım ❌" onPress={() => submitAnswer("didNot")} variant="secondary" />
                        </View>
                        <Text style={styles.emptyText}>Cevaplayan: {answersCount}/{totalPlayers}</Text>
                        {isOwner && answersCount > 0 && (
                          <GameButton label="Sonuçları Göster" onPress={forceReveal} variant="secondary" />
                        )}
                      </View>
                    )}

                    {isNeverMode && phase === "reveal" && (
                      <View style={styles.lobbyInfoBox}>
                        <Text style={styles.lobbyLabel}>Sonuçlar</Text>
                        <View style={styles.revealStage}>
                          {revealItem ? (
                            <Animated.Text style={[styles.revealText, { transform: [{ translateX: revealX }] }]}>
                              {revealItem.name}: {revealItem.answer === "did" ? "Yaptım 🥂" : "Yapmadım 😇"}
                            </Animated.Text>
                          ) : (
                            <Text style={styles.emptyText}>Tüm sonuçlar gösterildi.</Text>
                          )}
                        </View>
                        {isOwner && <GameButton label="Sonraki Soru →" onPress={nextQuestion} variant="secondary" />}
                      </View>
                    )}

                    {isDareMode && phase === "question" && (
                      <View style={styles.lobbyInfoBox}>
                        <View style={styles.turnBadge}>
                          <Text style={styles.turnBadgeText}>Sıra: {currentTurnPlayerName || "—"}</Text>
                        </View>
                        <Text style={styles.questionEyebrow}>BU TURUN GÖREVİ</Text>
                        <View style={styles.questionHero}>
                          <View style={styles.questionCardInner}>
                            <View style={styles.questionCardTop}>
                              <Text style={styles.questionIllustration}>⚡🎯⚡</Text>
                            </View>
                            <Text style={styles.questionTextDare}>{question}</Text>
                          </View>
                        </View>
                        {questionType === "vote" ? (
                          <>
                            <Text style={styles.lobbyLabel}>Kimi seçiyorsun?</Text>
                            {playerEntries.map((p) => (
                              <Pressable
                                key={p.id}
                                onPress={() => setSelectedVoteTarget(p.id)}
                                style={[styles.modeOption, selectedVoteTarget === p.id && styles.modeOptionActive]}
                              >
                                <Text style={[styles.modeOptionText, selectedVoteTarget === p.id && styles.modeOptionTextActive]}>
                                  {p.name}
                                </Text>
                              </Pressable>
                            ))}
                            <Text style={styles.emptyText}>Oy veren: {answersCount}/{totalPlayers}</Text>
                            <GameButton label="Oyumu Gönder" onPress={submitVote} disabled={!selectedVoteTarget} />
                          </>
                        ) : questionType === "input_number" ? (
                          <>
                            <Text style={styles.lobbyLabel}>Cevabını sayı olarak gir</Text>
                            <TextInput
                              placeholder="Örn: 3"
                              placeholderTextColor="#94A3B8"
                              value={inputValue}
                              onChangeText={(v) => setInputValue(v.replace(/[^0-9]/g, ""))}
                              keyboardType="number-pad"
                              style={styles.input}
                            />
                            <Text style={styles.emptyText}>Gönderen: {answersCount}/{totalPlayers}</Text>
                            <GameButton label="Cevabı Gönder" onPress={submitInput} disabled={!inputValue.trim()} />
                          </>
                        ) : questionType === "target_select" ? (
                          <>
                            {isMyTurn ? (
                              <>
                                <Text style={styles.lobbyLabel}>Kimi seçiyorsun?</Text>
                                {playerEntries.map((p) => (
                                  <Pressable
                                    key={p.id}
                                    onPress={() => setSelectedTargetPlayer(p.id)}
                                    style={[styles.modeOption, selectedTargetPlayer === p.id && styles.modeOptionActive]}
                                  >
                                    <Text style={[styles.modeOptionText, selectedTargetPlayer === p.id && styles.modeOptionTextActive]}>
                                      {p.name}
                                    </Text>
                                  </Pressable>
                                ))}
                                <GameButton label="Kişiyi Gönder" onPress={submitTarget} disabled={!selectedTargetPlayer} />
                              </>
                            ) : (
                              <Text style={styles.emptyText}>Sıra {currentTurnPlayerName || "oyuncuda"}, seçmesini bekleyin.</Text>
                            )}
                          </>
                        ) : questionType === "true_false" ? (
                          <>
                            <Text style={styles.lobbyLabel}>Doğru mu, yanlış mı?</Text>
                            <View style={styles.answerRow}>
                              <Pressable
                                onPress={() => setSelectedTrueFalse(true)}
                                style={[styles.modeOption, selectedTrueFalse === true && styles.modeOptionActive]}
                              >
                                <Text style={[styles.modeOptionText, selectedTrueFalse === true && styles.modeOptionTextActive]}>
                                  Doğru
                                </Text>
                              </Pressable>
                              <Pressable
                                onPress={() => setSelectedTrueFalse(false)}
                                style={[styles.modeOption, selectedTrueFalse === false && styles.modeOptionActive]}
                              >
                                <Text style={[styles.modeOptionText, selectedTrueFalse === false && styles.modeOptionTextActive]}>
                                  Yanlış
                                </Text>
                              </Pressable>
                            </View>
                            <Text style={styles.emptyText}>Cevaplayan: {answersCount}/{totalPlayers}</Text>
                            <GameButton label="Cevabı Gönder" onPress={submitTrueFalse} disabled={selectedTrueFalse === null} />
                          </>
                        ) : null}
                        {questionType !== "vote" && questionType !== "input_number" && questionType !== "target_select" && questionType !== "true_false" && isOwner ? (
                          <GameButton label="Sonraki Görev →" onPress={nextQuestion} variant="secondary" />
                        ) : !isOwner ? (
                          <Text style={styles.emptyText}>Host sonraki görevi açacak.</Text>
                        ) : null}
                      </View>
                    )}
                    {isDareMode && phase === "reveal" && (
                      <View style={styles.lobbyInfoBox}>
                        <Text style={styles.lobbyLabel}>Sonuç</Text>
                        <Animated.View style={{ transform: [{ scale: dareRevealScale }] }}>
                          <Text style={styles.revealText}>{questionResult || "Sonuç hesaplanıyor..."}</Text>
                        </Animated.View>
                        {isOwner && <GameButton label="Sonraki Görev →" onPress={nextQuestion} variant="secondary" />}
                      </View>
                    )}
                  </>
                )}
              </View>
            </ScrollView>
          )}
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return <ErrorBoundary><AppContent /></ErrorBoundary>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#05070F" },
  page: { flex: 1, paddingHorizontal: 18, paddingTop: 12, paddingBottom: 16 },
  pageCentered: { justifyContent: "center" },
  topGlow: { position: "absolute", top: -120, right: -80, width: 300, height: 300, borderRadius: 160, backgroundColor: "#FF4D6D", opacity: 0.18 },
  bottomGlow: { position: "absolute", bottom: -130, left: -110, width: 320, height: 320, borderRadius: 160, backgroundColor: "#00D4FF", opacity: 0.14 },
  backButton: { position: "absolute", top: 6, left: 0, zIndex: 10, width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: "#334B7A", backgroundColor: "#111A30", alignItems: "center", justifyContent: "center" },
  backIcon: { color: "#E2E8F0", fontSize: 28, lineHeight: 28, marginTop: -2, fontWeight: "700" },
  modeTag: { position: "absolute", top: 8, right: 0, zIndex: 10, borderRadius: 12, borderWidth: 1, borderColor: "#355082", backgroundColor: "#111C35", paddingHorizontal: 10, paddingVertical: 6 },
  modeTagText: { color: "#C7D2FE", fontSize: 12, fontWeight: "800" },
  header: { alignItems: "center", marginBottom: 14, marginTop: 0 },
  title: { fontSize: 34, fontWeight: "900", color: "#F8FAFC", letterSpacing: 0.2 },
  subtitle: { marginTop: 6, fontSize: 13, color: "#AAB8D6", textAlign: "center" },
  card: { flex: 1, borderRadius: 26, backgroundColor: "#0D162C", padding: 16, borderWidth: 1, borderColor: "#2A3D67" },
  cardCompact: { flex: 0, paddingVertical: 14, marginTop: 0 },
  cardLobby: { flex: 0, marginTop: 8 },
  stack: { gap: 10 },
  stackCentered: { justifyContent: "center" },
  segmentWrap: { flexDirection: "row", backgroundColor: "#111C35", borderRadius: 16, padding: 5, borderWidth: 1, borderColor: "#2A3A63" },
  segmentButton: { flex: 1, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  segmentButtonActive: { backgroundColor: "#FF4D6D" },
  segmentText: { color: "#9EB1DF", fontSize: 14, fontWeight: "700" },
  segmentTextActive: { color: "#FFF" },
  input: { height: 54, borderRadius: 16, borderWidth: 1, borderColor: "#314874", backgroundColor: "#111C35", color: "#E2E8F0", paddingHorizontal: 14, fontSize: 16, fontWeight: "600" },
  modeOption: { borderRadius: 16, borderWidth: 1, borderColor: "#30466F", backgroundColor: "#111C35", paddingVertical: 15, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  modeOptionActive: { borderColor: "#FF4D6D", backgroundColor: "#321325" },
  modeOptionText: { color: "#D5DDF0", fontSize: 15, fontWeight: "700" },
  modeOptionTextActive: { color: "#FF4D6D" },
  modeCheck: { color: "#FF4D6D", fontSize: 18, fontWeight: "800" },
  button: { paddingVertical: 16, paddingHorizontal: 16, borderRadius: 16, borderWidth: 1, alignItems: "center" },
  primaryButton: { backgroundColor: "#FF4D6D", borderColor: "#FF7B96" },
  secondaryButton: { backgroundColor: "#1B2746", borderColor: "#355082" },
  buttonText: { fontWeight: "900", fontSize: 16, letterSpacing: 0.2 },
  primaryButtonText: { color: "#FFF" },
  secondaryButtonText: { color: "#C7D2FE" },
  buttonPressed: { transform: [{ scale: 0.98 }], opacity: 0.92 },
  errorText: { color: "#FCA5A5", fontSize: 13, fontWeight: "700", textAlign: "center" },
  lobbyInfoBox: { borderRadius: 16, borderWidth: 1, borderColor: "#30466F", backgroundColor: "#111C35", paddingVertical: 13, paddingHorizontal: 14, gap: 4 },
  turnBadge: { alignSelf: "flex-start", borderRadius: 10, backgroundColor: "#1A2A50", borderWidth: 1, borderColor: "#4163A0", paddingHorizontal: 10, paddingVertical: 5, marginBottom: 6 },
  turnBadgeText: { color: "#C7D2FE", fontSize: 12, fontWeight: "800" },
  codeHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  copyBtn: { width: 30, height: 30, borderRadius: 10, borderWidth: 1, borderColor: "#4163A0", backgroundColor: "#1A2A50", alignItems: "center", justifyContent: "center" },
  copyBtnIcon: { color: "#E2E8F0", fontSize: 14, fontWeight: "800" },
  lobbyLabel: { color: "#94A3B8", fontSize: 12, textTransform: "uppercase", letterSpacing: 1 },
  lobbyCode: { color: "#F8FAFC", fontSize: 32, fontWeight: "900", letterSpacing: 2, textAlign: "center", marginVertical: 4 },
  lobbyHint: { color: "#64748B", fontSize: 12, textAlign: "center" },
  lobbyValue: { color: "#E2E8F0", fontSize: 16, fontWeight: "800" },
  questionEyebrow: { color: "#7DD3FC", fontSize: 11, fontWeight: "900", letterSpacing: 1.1, marginBottom: 8 },
  questionHero: {
    position: "relative",
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 10,
    shadowColor: "#020617",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 7 },
    elevation: 8
  },
  questionCardInner: { borderRadius: 2, borderWidth: 1, borderColor: "#F1F5F9", paddingHorizontal: 10, paddingVertical: 12 },
  questionCardTop: { alignItems: "center", marginBottom: 10 },
  questionIllustration: { fontSize: 26 },
  questionTextNever: { color: "#C24148", fontSize: 28, lineHeight: 37, fontWeight: "900", textAlign: "center", textTransform: "uppercase", letterSpacing: 0.4 },
  questionTextDare: { color: "#C24148", fontSize: 26, lineHeight: 35, fontWeight: "900", textAlign: "center", textTransform: "uppercase", letterSpacing: 0.4 },
  answerRow: { gap: 8, marginBottom: 8 },
  revealStage: { minHeight: 60, alignItems: "center", justifyContent: "center", overflow: "hidden", marginBottom: 10 },
  revealText: { color: "#F8FAFC", fontSize: 20, fontWeight: "800", textAlign: "center" },
  emptyText: { color: "#94A3B8", fontStyle: "italic", textAlign: "center" },
});
