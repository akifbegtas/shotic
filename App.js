import { StatusBar } from "expo-status-bar";
import {
  Animated,
  Dimensions,
  Easing,
  ImageBackground,
  PanResponder,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Component, useCallback, useEffect, useRef, useState } from "react";
import * as Clipboard from "expo-clipboard";
import { io } from "socket.io-client";

const SCREENS = {
  HOME: "home",
  MODE_MAIN: "mode_main",
  MODE_NEVER_SUB: "mode_never_sub",
  LOBBY: "lobby",
  GAME: "game",
};

const SERVER_URL = "http://localhost:3003";

const CARD_FRAMES = {
  never_normal: require("./assets/card_questions.png"),
  never_girls: require("./assets/card_hearts.png"),
  dare_basic: require("./assets/card_party.png"),
  challenger: require("./assets/card_party.png"),
};

// Kart kenar baskın renklerine göre metin renkleri
const CARD_TEXT_COLORS = {
  never_normal: { main: "#3B1845", counter: "#6B4C78" },   // koyu mor
  never_girls:  { main: "#8B1A2B", counter: "#A0505E" },   // koyu kırmızı/bordo
  dare_basic:   { main: "#352060", counter: "#605080" },    // koyu indigo-mor
  challenger:   { main: "#352060", counter: "#605080" },    // koyu indigo-mor
};

/* ── Error Boundary ── */
class ErrorBoundary extends Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: "#09090B", alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: "#F43F5E", fontSize: 18, fontWeight: "800" }}>Bir hata oluştu</Text>
          <Pressable onPress={() => this.setState({ hasError: false })} style={{ marginTop: 16 }}>
            <Text style={{ color: "#EC4899", fontSize: 16, fontWeight: "700" }}>Tekrar Dene</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

/* ── Toast ── */
function Toast({ visible, message, type = "error", onHide }) {
  const translateY = useRef(new Animated.Value(-100)).current;
  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, { toValue: 16, useNativeDriver: true, speed: 14, bounciness: 8 }).start();
      const t = setTimeout(() => {
        Animated.timing(translateY, { toValue: -100, duration: 250, useNativeDriver: true }).start(() => onHide());
      }, 3000);
      return () => clearTimeout(t);
    } else {
      Animated.timing(translateY, { toValue: -100, duration: 250, useNativeDriver: true }).start();
    }
  }, [visible, message]);
  return (
    <Animated.View style={[styles.toastContainer, { transform: [{ translateY }] }]}>
      <Text style={[styles.toastText, type === "error" && styles.toastTextError]}>{message}</Text>
    </Animated.View>
  );
}

/* ── GameButton with spring ── */
function GameButton({ label, onPress, variant = "primary", disabled = false }) {
  const scale = useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    if (disabled) return;
    Animated.spring(scale, { toValue: 0.94, useNativeDriver: true, speed: 24, bounciness: 12 }).start();
  };
  const handlePressOut = () => {
    if (disabled) return;
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 10 }).start();
  };
  return (
    <Pressable onPress={disabled ? null : onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View
        style={[
          styles.button,
          variant === "secondary" ? styles.secondaryButton : styles.primaryButton,
          disabled && { opacity: 0.4 },
          { transform: [{ scale }] },
        ]}
      >
        <Text style={[styles.buttonText, variant === "secondary" ? styles.secondaryButtonText : styles.primaryButtonText]}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

/* ── Ambient Background (Figma export) ── */
function AmbientBackground() {
  return (
    <ImageBackground
      source={require("./assets/bg.png")}
      style={StyleSheet.absoluteFill}
      resizeMode="cover"
      pointerEvents="none"
    />
  );
}

/* ── GameCard (hero question card with card-draw animation + swipe) ── */
const SCREEN_WIDTH = Dimensions.get("window").width;
const SWIPE_THRESHOLD = 80;

function GameCard({ icon, children, modeId, questionKey, onSwipeLeft, onSwipeRight }) {
  const anim = useRef(new Animated.Value(0)).current;
  const swipeX = useRef(new Animated.Value(0)).current;
  const swiped = useRef(false);

  useEffect(() => {
    swiped.current = false;
    swipeX.setValue(0);
    anim.setValue(0);
    Animated.sequence([
      Animated.timing(anim, { toValue: 0.6, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.spring(anim, { toValue: 1, speed: 14, bounciness: 4, useNativeDriver: true }),
    ]).start();
  }, [questionKey]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 15 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderMove: (_, g) => { if (!swiped.current) swipeX.setValue(g.dx); },
      onPanResponderRelease: (_, g) => {
        if (swiped.current) return;
        if (g.dx < -SWIPE_THRESHOLD && onSwipeLeft) {
          swiped.current = true;
          Animated.timing(swipeX, { toValue: -SCREEN_WIDTH * 1.5, duration: 250, useNativeDriver: true }).start(() => onSwipeLeft());
        } else if (g.dx > SWIPE_THRESHOLD && onSwipeRight) {
          swiped.current = true;
          Animated.timing(swipeX, { toValue: SCREEN_WIDTH * 1.5, duration: 250, useNativeDriver: true }).start(() => onSwipeRight());
        } else {
          Animated.spring(swipeX, { toValue: 0, speed: 20, bounciness: 8, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  // Card slides from far right
  const translateX = anim.interpolate({ inputRange: [0, 0.4, 0.6, 1], outputRange: [320, 40, -8, 0] });
  // Slight vertical lift as card is drawn
  const translateY = anim.interpolate({ inputRange: [0, 0.3, 0.6, 1], outputRange: [20, -6, -2, 0] });
  // 3D rotation: card starts angled, flattens as it arrives
  const rotateY = anim.interpolate({ inputRange: [0, 0.4, 0.7, 1], outputRange: ["-35deg", "-12deg", "3deg", "0deg"] });
  // Slight Z-rotation for natural card-pull feel
  const rotateZ = anim.interpolate({ inputRange: [0, 0.3, 0.6, 1], outputRange: ["-4deg", "-1.5deg", "0.5deg", "0deg"] });
  // Scale: starts slightly smaller (perspective), grows to full
  const scale = anim.interpolate({ inputRange: [0, 0.4, 0.7, 1], outputRange: [0.88, 0.96, 1.01, 1] });
  // Fade in quickly
  const opacity = anim.interpolate({ inputRange: [0, 0.15, 0.4], outputRange: [0, 0.7, 1], extrapolate: "clamp" });
  // Swipe rotation
  const swipeRotate = swipeX.interpolate({ inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH], outputRange: ["-15deg", "0deg", "15deg"] });

  const cardFrame = modeId && CARD_FRAMES[modeId] ? CARD_FRAMES[modeId] : null;
  const hasSwipe = onSwipeLeft || onSwipeRight;

  const cardContent = (
    <Animated.View style={[
      styles.questionHero,
      cardFrame && styles.questionHeroWithFrame,
      {
        opacity,
        transform: [
          { perspective: 1200 },
          { translateX },
          { translateY },
          { rotateY },
          { rotateZ },
          { scale },
        ]
      }
    ]}>
      {cardFrame ? (
        <ImageBackground
          source={cardFrame}
          style={styles.cardFrameImage}
          imageStyle={styles.cardFrameImageStyle}
          resizeMode="cover"
        >
          <View style={styles.cardFrameContent}>
            {children}
          </View>
        </ImageBackground>
      ) : (
        <View style={styles.questionCardInner}>
          {icon && (
            <View style={styles.questionCardTop}>
              <Text style={styles.questionIllustration}>{icon}</Text>
            </View>
          )}
          {children}
        </View>
      )}
    </Animated.View>
  );

  if (!hasSwipe) return cardContent;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={{ transform: [{ translateX: swipeX }, { rotate: swipeRotate }] }}
    >
      {cardContent}
    </Animated.View>
  );
}

/* ══════════════ MAIN APP ══════════════ */
function AppContent() {
  const socketRef = useRef(null);
  const revealX = useRef(new Animated.Value(400)).current;
  const cardAnim = useRef(new Animated.Value(1)).current;
  const setupTabAnim = useRef(new Animated.Value(0)).current;
  const dareResultAnim = useRef(new Animated.Value(0)).current;

  const [screen, setScreenRaw] = useState(SCREENS.HOME);
  const screenRef = useRef(SCREENS.HOME);
  const setScreen = (s) => { screenRef.current = s; setScreenRaw(s); };
  const isNavigating = useRef(false);
  const [playerName, setPlayerName] = useState("");
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [setupTab, setSetupTab] = useState("create");
  const [setupPanelWidth, setSetupPanelWidth] = useState(0);

  const [selectedMode, setSelectedMode] = useState(null);
  const [activeRoomCode, setActiveRoomCode] = useState("");
  const [modeId, setModeId] = useState(null);
  const [modeLabel, setModeLabel] = useState(null);
  const [modeType, setModeType] = useState(null);
  const [ownerId, setOwnerIdRaw] = useState(null);
  const ownerIdRef = useRef(null);
  const setOwnerId = (v) => { ownerIdRef.current = v; setOwnerIdRaw(v); };
  const [myId, setMyIdRaw] = useState(null);
  const myIdRef = useRef(null);
  const setMyId = (v) => { myIdRef.current = v; setMyIdRaw(v); };
  const [players, setPlayers] = useState([]);
  const [playerEntries, setPlayerEntries] = useState([]);
  const [phase, setPhase] = useState("lobby");
  const [question, setQuestion] = useState("");
  const [questionType, setQuestionType] = useState(null);
  const [answersCount, setAnswersCount] = useState(0);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [currentResult, setCurrentResult] = useState(null);
  const [revealStep, setRevealStep] = useState(0); // 0: ilk, 1: cevap, 2: kim içiyor
  const [currentTurnPlayerName, setCurrentTurnPlayerName] = useState(null);
  const [currentTurnPlayerId, setCurrentTurnPlayerId] = useState(null);
  const [copied, setCopied] = useState(false);
  const [revealItem, setRevealItem] = useState(null);

  const [selectedVoteTarget, setSelectedVoteTarget] = useState(null);
  const [inputNumber, setInputNumber] = useState("");
  const [questionNum, setQuestionNum] = useState(0);

  const [toast, setToast] = useState({ visible: false, message: "", type: "error" });
  const showToast = useCallback((msg, type = "error") => setToast({ visible: true, message: msg, type }), []);
  const hideToast = useCallback(() => setToast((p) => ({ ...p, visible: false })), []);



  const isOwner = !!myId && myId === ownerId;
  const isNever = modeType === "never";
  const isDareBasic = modeType === "dare_basic";
  const isChallenger = modeType === "dare";
  const isMyTurn = !!myId && myId === currentTurnPlayerId;

  /* ── navigation ── */
  const navigateTo = (next) => {
    if (next === screenRef.current || isNavigating.current) return;
    isNavigating.current = true;
    Animated.timing(cardAnim, {
      toValue: 0,
      duration: 80,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      setScreen(next);
      Animated.timing(cardAnim, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => { isNavigating.current = false; });
    });
  };

  /* ── reveal sequence (never mode) ── */
  const autoNextTimerRef = useRef(null);

  const runRevealSequence = (sequence) => {
    if (!sequence?.length) return setRevealItem(null);
    let i = 0;
    const next = () => {
      if (i >= sequence.length) {
        setRevealItem(null);
        // Animasyon bitti → owner ise otomatik sonraki soruya geç
        autoNextTimerRef.current = setTimeout(() => {
          if (myIdRef.current && myIdRef.current === ownerIdRef.current) {
            socketRef.current?.emit("next_question");
          }
        }, 500);
        return;
      }
      const item = sequence[i++];
      setRevealItem(item);
      revealX.setValue(360);
      Animated.sequence([
        Animated.timing(revealX, { toValue: 0, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.delay(450),
        Animated.timing(revealX, { toValue: -360, duration: 320, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      ]).start(next);
    };
    next();
  };

  /* ── dare result bounce animation (iki aşamalı: cevap → kim içiyor) ── */
  const revealStepTimerRef = useRef(null);

  const animateDareResult = () => {
    setRevealStep(1); // ilk adım: cevap göster
    dareResultAnim.setValue(0);
    Animated.spring(dareResultAnim, { toValue: 1, speed: 8, bounciness: 14, useNativeDriver: true }).start();
  };

  // currentResult değiştiğinde iki aşamalı zamanlama başlat
  useEffect(() => {
    if (!currentResult || phase !== "reveal") return;
    const hasTwoParts = currentResult.includes("|");
    if (hasTwoParts) {
      // 1.5 sn sonra kim içiyor göster
      revealStepTimerRef.current = setTimeout(() => {
        setRevealStep(2);
        // 1.5 sn sonra otomatik sonraki soru
        autoNextTimerRef.current = setTimeout(() => {
          if (myIdRef.current && myIdRef.current === ownerIdRef.current) {
            socketRef.current?.emit("next_question");
          }
        }, 1500);
      }, 1500);
    } else {
      // Tek parçalı sonuç → 1 sn sonra direkt sonraki soru
      autoNextTimerRef.current = setTimeout(() => {
        if (myIdRef.current && myIdRef.current === ownerIdRef.current) {
          socketRef.current?.emit("next_question");
        }
      }, 1000);
    }
    return () => {
      if (revealStepTimerRef.current) { clearTimeout(revealStepTimerRef.current); revealStepTimerRef.current = null; }
    };
  }, [currentResult, phase]);

  /* ── socket setup ── */
  useEffect(() => {
    const socket = io(SERVER_URL, { transports: ["websocket"], autoConnect: true });
    socketRef.current = socket;
    socket.on("connect", () => setMyId(socket.id));

    const applyState = (payload) => {
      setActiveRoomCode(payload.roomCode || "");
      setModeId(payload.modeId || null);
      setModeLabel(payload.modeLabel || null);
      setModeType(payload.modeType || null);
      setOwnerId(payload.ownerId || null);
      setPlayers(payload.players || []);
      setPlayerEntries(payload.playerEntries || []);
      setPhase(payload.phase || "lobby");
      setQuestion(payload.currentQuestion || "");
      setQuestionType(payload.currentQuestionType || null);
      if (payload.currentQuestion && payload.phase === "question") {
        setQuestionNum((prev) => prev + 1);
      }
      setAnswersCount(payload.answersCount || 0);
      setTotalPlayers(payload.totalPlayers || 0);
      setCurrentResult(payload.currentResult || null);
      setCurrentTurnPlayerName(payload.currentTurnPlayerName || null);
      setCurrentTurnPlayerId(payload.currentTurnPlayerId || null);
    };

    socket.on("room_joined", (payload) => {
      applyState(payload);
      navigateTo(SCREENS.LOBBY);
    });

    socket.on("room_state", (payload) => {
      // Yeni state geldiğinde eski timer'ları temizle
      if (autoNextTimerRef.current) { clearTimeout(autoNextTimerRef.current); autoNextTimerRef.current = null; }
      if (revealStepTimerRef.current) { clearTimeout(revealStepTimerRef.current); revealStepTimerRef.current = null; }
      applyState(payload);
      if (payload.phase === "reveal" && payload.currentResult) animateDareResult();
      if (payload.phase === "question") {
        setRevealStep(0);
        setSelectedVoteTarget(null);
        setInputNumber("");
      }
    });

    socket.on("reveal_sequence", ({ sequence }) => {
      if (autoNextTimerRef.current) {
        clearTimeout(autoNextTimerRef.current);
        autoNextTimerRef.current = null;
      }
      runRevealSequence(sequence || []);
    });
    socket.on("room_error", ({ message }) => showToast(message || "Bir hata oluştu."));

    return () => socket.disconnect();
  }, []);

  /* ── tab animation ── */
  useEffect(() => {
    Animated.timing(setupTabAnim, { toValue: setupTab === "join" ? 1 : 0, duration: 180, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [setupTab]);

  /* ── actions ── */
  const createRoom = () => {
    if (!playerName.trim()) return showToast("Önce ismini yaz.");
    if (!selectedMode) return showToast("Bir oyun modu seç.");
    socketRef.current?.emit("create_room", {
      playerName: playerName.trim(),
      modeId: selectedMode.id,
      modeLabel: selectedMode.label,
    });
  };

  const joinRoom = () => {
    if (!playerName.trim()) return showToast("Önce ismini yaz.");
    if (!roomCodeInput.trim()) return showToast("Oda kodunu gir.");
    socketRef.current?.emit("join_room", { playerName: playerName.trim(), roomCode: roomCodeInput.trim().toUpperCase() });
  };

  const leaveRoom = () => {
    socketRef.current?.emit("leave_room");
    setSelectedMode(null);
    setModeLabel(null);
    setQuestion("");
    setRevealItem(null);
    setCurrentResult(null);
    navigateTo(SCREENS.HOME);
  };

  const startGame = () => socketRef.current?.emit("start_game");
  const submitAnswer = (answer) => socketRef.current?.emit("submit_answer", { answer });
  const submitVote = () => { if (selectedVoteTarget) socketRef.current?.emit("submit_vote", { targetId: selectedVoteTarget }); };
  const submitInput = () => { if (inputNumber) socketRef.current?.emit("submit_input", { value: Number(inputNumber) }); };
  const submitTarget = (targetId) => socketRef.current?.emit("submit_target", { targetId });
  const forceReveal = () => socketRef.current?.emit("force_reveal");
  const nextQuestion = () => socketRef.current?.emit("next_question");

  const copyCode = async () => {
    if (!activeRoomCode) return;
    await Clipboard.setStringAsync(activeRoomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const selectMode = (mode) => {
    setSelectedMode(mode);
    navigateTo(SCREENS.HOME);
  };

  /* ── interpolations ── */
  const setupSlideX = setupTabAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -(setupPanelWidth || 1)] });
  const setupCreateOpacity = setupTabAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.35] });
  const setupJoinOpacity = setupTabAnim.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] });
  const cardOpacity = cardAnim.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] });
  const cardTranslateY = cardAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });
  const dareResultScale = dareResultAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.92, 1.06, 1] });

  /* ── determine card style ── */
  const useCompactCard = screen === SCREENS.HOME || screen === SCREENS.MODE_MAIN || screen === SCREENS.MODE_NEVER_SUB;
  const useLobbyCard = screen === SCREENS.LOBBY;
  const useScrollable = screen === SCREENS.GAME;

  /* ── header text ── */
  const headerTitle = (() => {
    if (screen === SCREENS.HOME) return "Shot Challenge";
    if (screen === SCREENS.MODE_MAIN) return "Oyun Seç";
    if (screen === SCREENS.MODE_NEVER_SUB) return "Mod Seç";
    if (screen === SCREENS.LOBBY) return "Lobi";
    if (screen === SCREENS.GAME) return modeLabel || "Oyun";
    return "";
  })();

  const headerSubtitle = (() => {
    if (screen === SCREENS.HOME) return selectedMode ? selectedMode.label : "Önce oyun modu seç, sonra oda kur.";
    if (screen === SCREENS.MODE_MAIN) return "Nasıl oynamak istersin?";
    if (screen === SCREENS.MODE_NEVER_SUB) return "Hangi versiyonu tercih edersin?";
    if (screen === SCREENS.LOBBY) return `${players.length} oyuncu bekleniyor`;
    if (screen === SCREENS.GAME && phase === "question") return `Cevaplayan: ${answersCount}/${totalPlayers}`;
    if (screen === SCREENS.GAME && phase === "reveal") return "Sonuçlar";
    return "";
  })();

  /* ── render content ── */
  const renderCardContent = () => {
    /* ── HOME ── */
    if (screen === SCREENS.HOME) {
      return (
        <View style={styles.stack}>
          <TextInput
            placeholder="İsmin"
            placeholderTextColor="#71717A"
            value={playerName}
            onChangeText={setPlayerName}
            style={styles.input}
          />

          <Pressable
            style={[styles.modeOption, selectedMode && styles.modeOptionActive]}
            onPress={() => navigateTo(SCREENS.MODE_MAIN)}
          >
            <Text style={[styles.modeOptionText, selectedMode && styles.modeOptionTextActive]}>
              {selectedMode ? selectedMode.label : "Oyun Modu Seç"}
            </Text>
            <Text style={{ color: "#71717A", fontSize: 18 }}>›</Text>
          </Pressable>

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
                <GameButton label="Yeni Oda Oluştur" onPress={createRoom} disabled={!selectedMode} />
              </Animated.View>
              <Animated.View style={[styles.panelPage, { width: setupPanelWidth || 1, opacity: setupJoinOpacity }]}>
                <View style={styles.stack}>
                  <TextInput
                    placeholder="Oda kodu"
                    placeholderTextColor="#71717A"
                    value={roomCodeInput}
                    onChangeText={(v) => setRoomCodeInput(v.toUpperCase())}
                    style={styles.input}
                  />
                  <GameButton label="Odaya Katıl" onPress={joinRoom} variant="secondary" />
                </View>
              </Animated.View>
            </Animated.View>
          </View>
        </View>
      );
    }

    /* ── MODE MAIN ── */
    if (screen === SCREENS.MODE_MAIN) {
      return (
        <View style={styles.stack}>
          <Pressable style={styles.modeCard} onPress={() => navigateTo(SCREENS.MODE_NEVER_SUB)}>
            <Text style={styles.modeCardEmoji}>🤝</Text>
            <Text style={styles.modeCardTitle}>Ben Daha Önce Hiç</Text>
            <Text style={styles.modeCardDesc}>Klasik oyun, kaydır ve geç</Text>
            <View style={[styles.playerBadge, styles.playerBadgePink]}>
              <Text style={[styles.playerBadgeText, { color: "#F472B6" }]}>2-10 oyuncu</Text>
            </View>
          </Pressable>

          <Pressable
            style={styles.modeCard}
            onPress={() => selectMode({ id: "dare_basic", label: "Yap Ya da İç" })}
          >
            <Text style={styles.modeCardEmoji}>🍺</Text>
            <Text style={styles.modeCardTitle}>Yap Ya da İç</Text>
            <Text style={styles.modeCardDesc}>Sırayla cesaret soruları, ya yap ya iç</Text>
            <View style={[styles.playerBadge, styles.playerBadgeOrange]}>
              <Text style={[styles.playerBadgeText, { color: "#FB923C" }]}>2-10 oyuncu</Text>
            </View>
          </Pressable>

          <Pressable
            style={styles.modeCard}
            onPress={() => selectMode({ id: "challenger", label: "Challenger" })}
          >
            <Text style={styles.modeCardEmoji}>⚡</Text>
            <Text style={styles.modeCardTitle}>Challenger</Text>
            <Text style={styles.modeCardDesc}>Oylama, sayı yarışı, hedef seçme</Text>
            <View style={[styles.playerBadge, styles.playerBadgeCyan]}>
              <Text style={[styles.playerBadgeText, { color: "#22D3EE" }]}>3-8 oyuncu</Text>
            </View>
          </Pressable>

          <GameButton label="Geri" onPress={() => navigateTo(SCREENS.HOME)} variant="secondary" />
        </View>
      );
    }

    /* ── MODE NEVER SUB ── */
    if (screen === SCREENS.MODE_NEVER_SUB) {
      return (
        <View style={styles.stack}>
          <Pressable
            style={styles.modeCard}
            onPress={() => selectMode({ id: "never_normal", label: "Ben Daha Önce Hiç - Normal" })}
          >
            <Text style={styles.modeCardEmoji}>🎯</Text>
            <Text style={styles.modeCardTitle}>Normal</Text>
            <Text style={styles.modeCardDesc}>Herkes için uygun sorular</Text>
          </Pressable>

          <Pressable
            style={styles.modeCard}
            onPress={() => selectMode({ id: "never_girls", label: "Ben Daha Önce Hiç - Kız Kıza" })}
          >
            <Text style={styles.modeCardEmoji}>💕</Text>
            <Text style={styles.modeCardTitle}>Kız Kıza</Text>
            <Text style={styles.modeCardDesc}>Sadece kızlar arasında</Text>
          </Pressable>

          <GameButton label="Geri" onPress={() => navigateTo(SCREENS.MODE_MAIN)} variant="secondary" />
        </View>
      );
    }

    /* ── LOBBY ── */
    if (screen === SCREENS.LOBBY) {
      return (
        <View style={styles.stack}>
          <View style={styles.lobbyInfoBox}>
            <View style={styles.codeHeaderRow}>
              <Text style={styles.lobbyLabel}>Oda Kodu</Text>
              <Pressable style={styles.copyBtn} onPress={copyCode}>
                <Text style={styles.copyBtnIcon}>{copied ? "✓" : "⧉"}</Text>
              </Pressable>
            </View>
            <Text style={styles.lobbyCode}>{activeRoomCode}</Text>
            <Text style={styles.lobbyHint}>Arkadaşlarınla paylaş</Text>
          </View>

          <View style={styles.lobbyInfoBox}>
            <Text style={styles.lobbyLabel}>Oyuncular ({players.length})</Text>
            {players.map((name, idx) => (
              <View key={`${name}-${idx}`} style={styles.playerRow}>
                <View style={styles.onlineDot} />
                <Text style={styles.lobbyValue}>{name}</Text>
                {idx === 0 && (
                  <View style={styles.hostBadge}>
                    <Text style={styles.hostBadgeText}>HOST</Text>
                  </View>
                )}
              </View>
            ))}
          </View>

          {isOwner && (
            <GameButton label="Oyunu Başlat" onPress={startGame} />
          )}

          {!isOwner && (
            <Text style={styles.emptyText}>Host oyunu başlatacak...</Text>
          )}
        </View>
      );
    }

    /* ── GAME ── */
    if (screen === SCREENS.GAME) {
      return (
        <View style={styles.gameStack}>
          {/* ── Never Mode: Question Phase ── */}
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
                {questionNum > 0 && <Text style={[styles.questionCounter, modeId && CARD_FRAMES[modeId] && styles.questionCounterOnFrame, CARD_TEXT_COLORS[modeId] && { color: CARD_TEXT_COLORS[modeId].counter }]}>Soru {questionNum}</Text>}
              </GameCard>
              <Text style={styles.swipeHint}>← Kaydır →</Text>
            </>
          )}

          {/* ── Never Mode: Reveal Phase (only multiplayer) ── */}
          {isNever && phase === "reveal" && revealItem && (
            <>
              <View style={styles.lobbyInfoBox}>
                <Text style={styles.lobbyLabel}>Sonuçlar</Text>
                <View style={styles.revealStage}>
                  <Animated.Text style={[styles.revealText, { transform: [{ translateX: revealX }] }]}>
                    {revealItem.name}: {revealItem.answer === "did" ? "Yaptım ✅" : "Yapmadım ❌"}
                  </Animated.Text>
                </View>
              </View>
            </>
          )}

          {/* ── Dare Basic (Yap Ya da İç): Question Phase ── */}
          {isDareBasic && phase === "question" && (
            <>
              {currentTurnPlayerName && (
                <View style={styles.turnBadge}>
                  <Text style={styles.turnBadgeText}>Sıra: {currentTurnPlayerName}</Text>
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
                {questionNum > 0 && <Text style={[styles.questionCounter, modeId && CARD_FRAMES[modeId] && styles.questionCounterOnFrame, CARD_TEXT_COLORS[modeId] && { color: CARD_TEXT_COLORS[modeId].counter }]}>Soru {questionNum}</Text>}
              </GameCard>
              <Text style={styles.swipeHint}>← Kaydır →</Text>
            </>
          )}

          {/* ── Challenger Mode: Question Phase ── */}
          {isChallenger && phase === "question" && (
            <>
              {currentTurnPlayerName && (
                <View style={styles.turnBadge}>
                  <Text style={styles.turnBadgeText}>Sıra: {currentTurnPlayerName}</Text>
                </View>
              )}

              <GameCard icon="⚡" modeId={modeId} questionKey={question}>
                <Text style={[styles.questionTextDare, modeId && CARD_FRAMES[modeId] && styles.questionTextOnFrame, CARD_TEXT_COLORS[modeId] && { color: CARD_TEXT_COLORS[modeId].main }]}>{question}</Text>
                {questionNum > 0 && <Text style={[styles.questionCounter, modeId && CARD_FRAMES[modeId] && styles.questionCounterOnFrame, CARD_TEXT_COLORS[modeId] && { color: CARD_TEXT_COLORS[modeId].counter }]}>Soru {questionNum}</Text>}
              </GameCard>

              {/* Vote type */}
              {questionType === "vote" && (
                <View style={styles.lobbyInfoBox}>
                  <Text style={styles.lobbyLabel}>Oy Ver</Text>
                  {playerEntries.map((p) => (
                    <Pressable
                      key={p.id}
                      style={[styles.modeOption, selectedVoteTarget === p.id && styles.modeOptionActive]}
                      onPress={() => setSelectedVoteTarget(p.id)}
                    >
                      <Text style={[styles.modeOptionText, selectedVoteTarget === p.id && styles.modeOptionTextActive]}>
                        {p.name}{p.id === myId ? " (Ben)" : ""}
                      </Text>
                      {selectedVoteTarget === p.id && <Text style={styles.modeCheck}>✓</Text>}
                    </Pressable>
                  ))}
                  <GameButton label="Oyu Gönder" onPress={submitVote} disabled={!selectedVoteTarget} />
                </View>
              )}

              {/* Input number type */}
              {questionType === "input_number" && (
                <View style={styles.lobbyInfoBox}>
                  <Text style={styles.lobbyLabel}>Sayını Gir</Text>
                  <TextInput
                    placeholder="0"
                    placeholderTextColor="#71717A"
                    value={inputNumber}
                    onChangeText={setInputNumber}
                    keyboardType="numeric"
                    style={styles.input}
                  />
                  <GameButton label="Gönder" onPress={submitInput} disabled={!inputNumber} />
                </View>
              )}

              {/* Target select type */}
              {questionType === "target_select" && isMyTurn && (
                <View style={styles.lobbyInfoBox}>
                  <Text style={styles.lobbyLabel}>Birini Seç</Text>
                  {playerEntries.filter((p) => p.id !== myId).map((p) => (
                    <GameButton key={p.id} label={p.name} onPress={() => submitTarget(p.id)} variant="secondary" />
                  ))}
                </View>
              )}

              {questionType === "target_select" && !isMyTurn && (
                <View style={styles.lobbyInfoBox}>
                  <Text style={styles.emptyText}>{currentTurnPlayerName || "Sıradaki oyuncu"} seçim yapıyor...</Text>
                </View>
              )}
            </>
          )}

          {/* ── Challenger Mode: Reveal Phase ── */}
          {isChallenger && phase === "reveal" && currentResult && (() => {
            const parts = currentResult.split("|");
            const answerPart = parts[0];               // "Cevap: Yanlış" veya tek satır sonuç
            const drinkerPart = parts.length > 1 ? parts[1] : null; // "Akif içiyor! 🍺"
            return (
              <>
                <Animated.View style={[styles.lobbyInfoBox, { transform: [{ scale: dareResultScale }] }]}>
                  <Text style={styles.questionEyebrow}>SONUÇ</Text>
                  <Text style={styles.revealText}>{answerPart}</Text>
                </Animated.View>
                {revealStep >= 2 && drinkerPart && (
                  <View style={styles.lobbyInfoBox}>
                    <Text style={styles.revealDrinker}>{drinkerPart}</Text>
                  </View>
                )}
              </>
            );
          })()}
        </View>
      );
    }

    return null;
  };

  /* ── handle room_state screen transitions ── */
  useEffect(() => {
    if (phase === "question" && screen === SCREENS.LOBBY) {
      navigateTo(SCREENS.GAME);
    }
  }, [phase]);

  /* ── render ── */
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />
      <AmbientBackground />
      <View style={[styles.page, useCompactCard && styles.pageCentered]}>

        {screen !== SCREENS.HOME && screen !== SCREENS.MODE_MAIN && screen !== SCREENS.MODE_NEVER_SUB && (
          <Pressable style={styles.backButton} onPress={leaveRoom}>
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>
        )}

        {screen === SCREENS.GAME && modeLabel && (
          <View style={styles.modeTag}>
            <Text style={styles.modeTagText}>{modeLabel}</Text>
          </View>
        )}

        {screen !== SCREENS.GAME && (
          <View style={[styles.header, (screen === SCREENS.LOBBY) && styles.headerWithBack]}>
            {screen === SCREENS.HOME && (
              <View style={styles.logoCircle}>
                <Text style={styles.logoEmoji}>🥃</Text>
              </View>
            )}
            <Text style={styles.title}>{headerTitle}</Text>
            <Text style={styles.subtitle}>{headerSubtitle}</Text>
          </View>
        )}

        {screen === SCREENS.GAME ? (
          <Animated.View
            style={[styles.gameContainer, { opacity: cardOpacity, transform: [{ translateY: cardTranslateY }] }]}
          >
            {renderCardContent()}
          </Animated.View>
        ) : (
          <Animated.View
            style={[
              styles.card,
              useCompactCard && styles.cardCompact,
              useLobbyCard && styles.cardLobby,
              { opacity: cardOpacity, transform: [{ translateY: cardTranslateY }] },
            ]}
          >
            {renderCardContent()}
          </Animated.View>
        )}
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

/* ══════════════ STYLES ══════════════ */
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#09090B" },
  page: { flex: 1, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 },
  pageCentered: { justifyContent: "center" },
  topGlow: { position: "absolute", top: -140, right: -100, width: 340, height: 340, borderRadius: 170, backgroundColor: "#EC4899", opacity: 0.15 },
  bottomGlow: { position: "absolute", bottom: -140, left: -100, width: 340, height: 340, borderRadius: 170, backgroundColor: "#06B6D4", opacity: 0.12 },

  toastContainer: { position: "absolute", top: 0, alignSelf: "center", zIndex: 999, backgroundColor: "#18181B", borderWidth: 1, borderColor: "#27272A", borderRadius: 16, paddingHorizontal: 20, paddingVertical: 12, shadowColor: "#000", shadowOpacity: 0.5, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 10, minWidth: "80%", alignItems: "center" },
  toastText: { color: "#FAFAFA", fontSize: 14, fontWeight: "600" },
  toastTextError: { color: "#F43F5E" },

  backButton: { position: "absolute", top: 12, left: 12, zIndex: 10, width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: "#27272A", backgroundColor: "rgba(24, 24, 27, 0.7)", alignItems: "center", justifyContent: "center" },
  backIcon: { color: "#FAFAFA", fontSize: 26, lineHeight: 28, marginTop: -2, fontWeight: "600" },

  modeTag: { position: "absolute", top: 14, right: 14, zIndex: 10, borderRadius: 16, borderWidth: 1, borderColor: "#27272A", backgroundColor: "rgba(24, 24, 27, 0.8)", paddingHorizontal: 12, paddingVertical: 6 },
  modeTagText: { color: "#A1A1AA", fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5 },

  header: { alignItems: "center", marginBottom: 16, marginTop: 4 },
  logoCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: "rgba(236,72,153,0.15)", borderWidth: 1, borderColor: "rgba(236,72,153,0.3)", alignItems: "center", justifyContent: "center", marginBottom: 10 },
  logoEmoji: { fontSize: 26 },
  headerWithBack: { marginTop: 54 },
  title: { fontSize: 36, fontWeight: "900", color: "#FAFAFA", letterSpacing: 0.5 },
  subtitle: { marginTop: 6, fontSize: 14, color: "#A1A1AA", textAlign: "center", paddingHorizontal: 20 },

  card: { flex: 1, borderRadius: 32, backgroundColor: "rgba(24, 24, 27, 0.65)", padding: 20, paddingBottom: 16, borderWidth: 1, borderColor: "rgba(63, 63, 70, 0.5)" },
  cardCompact: { flex: 0, paddingVertical: 24, marginTop: 0 },
  cardLobby: { flex: 0, marginTop: 12 },

  stack: { gap: 14 },
  gameContainer: { flex: 1, marginTop: 8 },
  gameStack: { flex: 1, justifyContent: "center", gap: 16 },
  gameButtonRow: { flexDirection: "row", gap: 12, paddingHorizontal: 4 },
  gameAnswerBtn: { flex: 1, backgroundColor: "#EC4899", borderRadius: 16, paddingVertical: 16, alignItems: "center", justifyContent: "center", shadowColor: "#EC4899", shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  gameAnswerBtnSecondary: { backgroundColor: "#1C1C24", borderWidth: 1, borderColor: "#3F3F46", shadowOpacity: 0 },
  gameAnswerBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800", letterSpacing: 0.5 },
  gameAnswerBtnTextSecondary: { color: "#A1A1AA" },
  swipeHint: { color: "rgba(161,161,170,0.6)", fontSize: 14, textAlign: "center", marginTop: 12, letterSpacing: 1 },

  segmentWrap: { flexDirection: "row", backgroundColor: "rgba(9, 9, 11, 0.5)", borderRadius: 16, padding: 6, borderWidth: 1, borderColor: "#27272A" },
  segmentButton: { flex: 1, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  segmentButtonActive: { backgroundColor: "#EC4899", shadowColor: "#EC4899", shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  segmentText: { color: "#71717A", fontSize: 14, fontWeight: "700" },
  segmentTextActive: { color: "#FAFAFA" },

  panelViewport: { overflow: "hidden" },
  panelTrack: { flexDirection: "row" },
  panelPage: { justifyContent: "flex-start" },

  input: { height: 56, borderRadius: 16, borderWidth: 1, borderColor: "#3F3F46", backgroundColor: "rgba(9, 9, 11, 0.5)", color: "#FAFAFA", paddingHorizontal: 16, fontSize: 16, fontWeight: "600" },

  modeCard: { borderRadius: 24, borderWidth: 1, borderColor: "#27272A", backgroundColor: "rgba(24, 24, 27, 0.8)", paddingVertical: 22, paddingHorizontal: 20, alignItems: "center", gap: 6 },
  modeCardEmoji: { fontSize: 36, marginBottom: 4 },
  modeCardTitle: { color: "#FAFAFA", fontSize: 20, fontWeight: "800" },
  modeCardDesc: { color: "#71717A", fontSize: 13, fontWeight: "600" },
  playerBadge: { marginTop: 10, paddingHorizontal: 14, paddingVertical: 5, borderRadius: 14, alignSelf: "center" },
  playerBadgePink: { backgroundColor: "rgba(236,72,153,0.12)", borderWidth: 1, borderColor: "rgba(236,72,153,0.2)" },
  playerBadgeOrange: { backgroundColor: "rgba(251,146,60,0.12)", borderWidth: 1, borderColor: "rgba(251,146,60,0.2)" },
  playerBadgeCyan: { backgroundColor: "rgba(6,182,212,0.12)", borderWidth: 1, borderColor: "rgba(6,182,212,0.2)" },
  playerBadgeText: { fontSize: 11, fontWeight: "600" },

  modeOption: { borderRadius: 20, borderWidth: 1, borderColor: "#3F3F46", backgroundColor: "rgba(24, 24, 27, 0.8)", paddingVertical: 18, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  modeOptionActive: { borderColor: "#EC4899", backgroundColor: "rgba(236, 72, 153, 0.1)" },
  modeOptionText: { color: "#D4D4D8", fontSize: 16, fontWeight: "700" },
  modeOptionTextActive: { color: "#EC4899" },
  modeCheck: { color: "#EC4899", fontSize: 18, fontWeight: "800" },

  button: { paddingVertical: 18, paddingHorizontal: 20, borderRadius: 20, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  primaryButton: { backgroundColor: "#EC4899", borderColor: "#F472B6", shadowColor: "#EC4899", shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 5 },
  secondaryButton: { backgroundColor: "#18181B", borderColor: "#3F3F46" },
  buttonText: { fontWeight: "800", fontSize: 16, letterSpacing: 0.5, textTransform: "uppercase" },
  primaryButtonText: { color: "#FFFFFF" },
  secondaryButtonText: { color: "#A1A1AA" },

  lobbyInfoBox: { borderRadius: 24, borderWidth: 1, borderColor: "#27272A", backgroundColor: "rgba(24, 24, 27, 0.7)", paddingVertical: 18, paddingHorizontal: 18, gap: 6 },
  turnBadge: { alignSelf: "flex-start", borderRadius: 12, backgroundColor: "rgba(6, 182, 212, 0.15)", borderWidth: 1, borderColor: "rgba(6, 182, 212, 0.3)", paddingHorizontal: 12, paddingVertical: 6, marginBottom: 8 },
  turnBadgeText: { color: "#22D3EE", fontSize: 12, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5 },

  codeHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  copyBtn: { width: 36, height: 36, borderRadius: 12, borderWidth: 1, borderColor: "#3F3F46", backgroundColor: "#18181B", alignItems: "center", justifyContent: "center" },
  copyBtnIcon: { color: "#FAFAFA", fontSize: 14, fontWeight: "800" },

  lobbyLabel: { color: "#71717A", fontSize: 12, textTransform: "uppercase", letterSpacing: 1.2, fontWeight: "700" },
  lobbyCode: { color: "#FAFAFA", fontSize: 36, fontWeight: "900", letterSpacing: 3, textAlign: "center", marginVertical: 8 },
  lobbyHint: { color: "#52525B", fontSize: 12, textAlign: "center" },
  lobbyValue: { color: "#E4E4E7", fontSize: 16, fontWeight: "700", paddingLeft: 4, marginVertical: 2 },
  playerRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#22C55E", marginRight: 10 },
  hostBadge: { marginLeft: "auto", backgroundColor: "rgba(236,72,153,0.15)", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 11 },
  hostBadgeText: { color: "#EC4899", fontSize: 10, fontWeight: "800" },

  questionEyebrow: { color: "#06B6D4", fontSize: 11, fontWeight: "900", letterSpacing: 1.5, marginBottom: 12, textAlign: "center" },
  questionHero: { borderRadius: 20, borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.08)", backgroundColor: "rgba(39, 39, 42, 0.6)", paddingHorizontal: 6, paddingVertical: 6, marginBottom: 16, shadowColor: "#000", shadowOpacity: 0.5, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  questionHeroWithFrame: { backgroundColor: "transparent", borderWidth: 0, padding: 0, overflow: "hidden", borderRadius: 16, marginBottom: 0, shadowColor: "#000", shadowOpacity: 0.7, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 12 },
  cardFrameImage: { width: "100%", aspectRatio: 0.72, justifyContent: "center", alignItems: "center" },
  cardFrameImageStyle: { borderRadius: 16 },
  cardFrameContent: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: "20%", paddingTop: "12%", paddingBottom: "20%" },
  questionCardInner: { borderRadius: 16, backgroundColor: "rgba(24, 24, 27, 0.9)", paddingHorizontal: 16, paddingVertical: 24, alignItems: "center", justifyContent: "center", minHeight: 140 },
  questionCardTop: { alignItems: "center", marginBottom: 16 },
  questionIllustration: { fontSize: 32 },
  questionTextNever: { color: "#FAFAFA", fontSize: 26, lineHeight: 36, fontWeight: "800", textAlign: "center", letterSpacing: 0.2 },
  questionTextDare: { color: "#FAFAFA", fontSize: 24, lineHeight: 34, fontWeight: "800", textAlign: "center", letterSpacing: 0.2 },
  questionTextOnFrame: { color: "#2D2D3A", fontSize: 20, lineHeight: 30, fontWeight: "600", fontFamily: "Georgia", letterSpacing: 0.3 },
  questionCounter: { fontSize: 12, color: "#52525B", textAlign: "center", marginTop: 12 },
  questionCounterOnFrame: { color: "#999", fontFamily: "Georgia", fontStyle: "italic", fontSize: 13 },

  answerRow: { flexDirection: "row", gap: 10, alignSelf: "stretch" },
  revealStage: { minHeight: 80, alignItems: "center", justifyContent: "center", overflow: "hidden", marginBottom: 16, paddingVertical: 10, borderRadius: 16, backgroundColor: "rgba(9, 9, 11, 0.4)" },
  revealText: { color: "#FAFAFA", fontSize: 22, fontWeight: "900", textAlign: "center", letterSpacing: 0.5 },
  revealDrinker: { color: "#F472B6", fontSize: 24, fontWeight: "900", textAlign: "center", letterSpacing: 0.5 },
  emptyText: { color: "#71717A", fontStyle: "italic", textAlign: "center", fontSize: 14, marginTop: 4 },
});
