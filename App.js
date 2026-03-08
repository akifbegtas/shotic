import { StatusBar } from "expo-status-bar";
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  LogBox,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
LogBox.ignoreLogs(["Non-serializable values", "Setting a timer", "AsyncStorage", "Possible Unhandled Promise", "SafeAreaView has been deprecated", "React DevTools"]);
import { Component, useCallback, useEffect, useRef, useState } from "react";
import * as Clipboard from "expo-clipboard";
import * as Font from "expo-font";
import * as Haptics from "expo-haptics";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { io } from "socket.io-client";

import { SCREENS } from "./src/constants/screens";
import { SERVER_URL } from "./src/constants/config";
import { TRANSLATIONS } from "./src/translations";
import { SafeStorage } from "./src/utils/storage";
import { shuffleArray } from "./src/utils/helpers";

import { ImageBackground } from "react-native";
import PremiumBackground from "./src/components/PremiumBackground";

const DARE_BG = require("./assets/dare_mode_background.jpg");
import Toast from "./src/components/Toast";
import LanguageToggle from "./src/components/LanguageToggle";
import SettingsModal from "./src/components/SettingsModal";

import HomeScreen from "./src/screens/HomeScreen";
import ModeMainScreen from "./src/screens/ModeMainScreen";
import ModeNeverSubScreen from "./src/screens/ModeNeverSubScreen";
import DareSetupScreen from "./src/screens/DareSetupScreen";
import LobbyScreen from "./src/screens/LobbyScreen";
import SoloGameScreen from "./src/screens/SoloGameScreen";
import GameScreen from "./src/screens/GameScreen";

import { styles } from "./src/styles";
import { splashStyles } from "./src/styles/splash";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

/* ── Error Boundary ── */
class ErrorBoundary extends Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: "#09090B", alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: "#F43F5E", fontSize: 18, fontWeight: "800" }}>{TRANSLATIONS[this.props.language || 'tr'].error.title}</Text>
          <Pressable onPress={() => this.setState({ hasError: false })} style={{ marginTop: 16 }}>
            <Text style={{ color: "#EC4899", fontSize: 16, fontWeight: "700" }}>{TRANSLATIONS[this.props.language || 'tr'].error.retry}</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

/* ══════════════ MAIN APP ══════════════ */
function AppContent() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  useEffect(() => {
    Font.loadAsync({ 'NotoRashiHebrew': require('./assets/fonts/NotoRashiHebrew-Variable.ttf') })
      .then(() => setFontsLoaded(true))
      .catch(() => setFontsLoaded(true));
  }, []);

  const socketRef = useRef(null);
  const revealX = useRef(new Animated.Value(400)).current;
  const cardAnim = useRef(new Animated.Value(1)).current;
  const setupTabAnim = useRef(new Animated.Value(0)).current;
  const dareResultAnim = useRef(new Animated.Value(0)).current;

  /* ── Language ── */
  const [language, setLanguage] = useState('tr');
  const languageRef = useRef('tr');

  const t = useCallback((key) => {
    const keys = key.split('.');
    let val = TRANSLATIONS[languageRef.current];
    for (const k of keys) {
      if (!val || typeof val !== 'object') return key;
      val = val[k];
    }
    return val !== undefined ? val : key;
  }, []);

  const changeLanguage = useCallback((lang) => {
    languageRef.current = lang;
    setLanguage(lang);
    SafeStorage.setItem('shotic_language', lang).catch(() => {});
  }, []);

  useEffect(() => {
    SafeStorage.getItem('shotic_language').then((saved) => {
      if (saved && TRANSLATIONS[saved]) {
        languageRef.current = saved;
        setLanguage(saved);
      }
    }).catch(() => {});
  }, []);

  const [screen, setScreenRaw] = useState(SCREENS.MODE_MAIN);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const screenRef = useRef(SCREENS.MODE_MAIN);
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
  const [revealStep, setRevealStep] = useState(0);
  const [currentTurnPlayerName, setCurrentTurnPlayerName] = useState(null);
  const [currentTurnPlayerId, setCurrentTurnPlayerId] = useState(null);
  const [copied, setCopied] = useState(false);
  const [revealItem, setRevealItem] = useState(null);

  const [selectedVoteTarget, setSelectedVoteTarget] = useState(null);
  const [inputNumber, setInputNumber] = useState("");
  const [questionNum, setQuestionNum] = useState(0);

  const [soloModeId, setSoloModeId] = useState(null);
  const [soloQuestions, setSoloQuestions] = useState([]);
  const [soloQuestionIndex, setSoloQuestionIndex] = useState(0);
  const [soloCurrentQuestion, setSoloCurrentQuestion] = useState("");

  const [darePlayerNames, setDarePlayerNames] = useState([]);
  const [dareNameInput, setDareNameInput] = useState("");
  const [currentDarePlayer, setCurrentDarePlayer] = useState("");

  const [toast, setToast] = useState({ visible: false, message: "", type: "error" });
  const showToast = useCallback((msg, type = "error") => setToast({ visible: true, message: msg, type }), []);
  const hideToast = useCallback(() => setToast((p) => ({ ...p, visible: false })), []);

  const isOwner = !!myId && myId === ownerId;
  const isMyTurn = !!myId && myId === currentTurnPlayerId;

  /* ── navigation ── */
  const navigateTo = (next) => {
    if (next === screenRef.current || isNavigating.current) return;
    isNavigating.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    Animated.timing(cardAnim, {
      toValue: 0, duration: 120, easing: Easing.out(Easing.quad), useNativeDriver: true,
    }).start(() => {
      setScreen(next);
      Animated.spring(cardAnim, {
        toValue: 1, speed: 16, bounciness: 4, useNativeDriver: true,
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

  /* ── dare result bounce animation ── */
  const revealStepTimerRef = useRef(null);

  const animateDareResult = () => {
    setRevealStep(1);
    dareResultAnim.setValue(0);
    Animated.spring(dareResultAnim, { toValue: 1, speed: 8, bounciness: 14, useNativeDriver: true }).start();
  };

  useEffect(() => {
    if (!currentResult || phase !== "reveal") return;
    const hasTwoParts = currentResult.includes("|");
    if (hasTwoParts) {
      revealStepTimerRef.current = setTimeout(() => {
        setRevealStep(2);
        autoNextTimerRef.current = setTimeout(() => {
          if (myIdRef.current && myIdRef.current === ownerIdRef.current) {
            socketRef.current?.emit("next_question");
          }
        }, 1500);
      }, 1500);
    } else {
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
    const socket = io(SERVER_URL, {
      transports: ["websocket"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
    socketRef.current = socket;
    socket.on("connect", () => {
      console.log("[socket] connected:", socket.id);
      setMyId(socket.id);
    });
    socket.on("connect_error", (err) => {
      console.log("[socket] connect_error:", err.message);
      showToast(t('toast.connectionError'));
    });
    socket.on("disconnect", (reason) => {
      console.log("[socket] disconnected:", reason);
      if (reason !== "io client disconnect") {
        showToast(t('toast.disconnected'));
      }
    });
    socket.io.on("reconnect", () => {
      console.log("[socket] reconnected:", socket.id);
      setMyId(socket.id);
      showToast(t('toast.reconnected'), "success");
    });
    socket.io.on("reconnect_failed", () => {
      showToast(t('toast.connectionFailed'));
    });

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
    socket.on("room_error", ({ message }) => showToast(message || t('toast.genericError')));

    return () => socket.disconnect();
  }, []);

  /* ── tab animation ── */
  useEffect(() => {
    Animated.timing(setupTabAnim, { toValue: setupTab === "join" ? 1 : 0, duration: 180, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [setupTab]);

  /* ── actions ── */
  const createRoom = () => {
    if (!playerName.trim()) return showToast(t('toast.nameRequired'));
    if (!selectedMode) return showToast(t('toast.selectMode'));
    socketRef.current?.emit("create_room", {
      playerName: playerName.trim(),
      modeId: selectedMode.id,
      modeLabel: selectedMode.label,
      language: languageRef.current,
    });
  };

  const joinRoom = () => {
    if (!playerName.trim()) return showToast(t('toast.nameRequired'));
    if (!roomCodeInput.trim()) return showToast(t('toast.enterCode'));
    socketRef.current?.emit("join_room", { playerName: playerName.trim(), roomCode: roomCodeInput.trim().toUpperCase(), language: languageRef.current });
  };

  const leaveRoom = () => {
    socketRef.current?.emit("leave_room");
    setSelectedMode(null);
    setModeLabel(null);
    setQuestion("");
    setRevealItem(null);
    setCurrentResult(null);
    navigateTo(SCREENS.MODE_MAIN);
  };

  const startGame = () => socketRef.current?.emit("start_game");
  const submitAnswer = (answer) => socketRef.current?.emit("submit_answer", { answer });
  const submitVote = () => { if (selectedVoteTarget) socketRef.current?.emit("submit_vote", { targetId: selectedVoteTarget }); };
  const submitInput = () => { if (inputNumber) socketRef.current?.emit("submit_input", { value: Number(inputNumber) }); };
  const submitTarget = (targetId) => socketRef.current?.emit("submit_target", { targetId });
  const nextQuestion = () => socketRef.current?.emit("next_question");

  const copyCode = async () => {
    if (!activeRoomCode) return;
    await Clipboard.setStringAsync(activeRoomCode);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const selectMode = (mode) => {
    if (mode.id === "never_normal" || mode.id === "never_girls") {
      startSoloGame(mode);
    } else if (mode.id === "dare_basic") {
      setSelectedMode(mode);
      setModeLabel(mode.label);
      setDarePlayerNames([]);
      setDareNameInput("");
      navigateTo(SCREENS.DARE_SETUP);
    } else {
      setSelectedMode(mode);
      navigateTo(SCREENS.HOME);
    }
  };

  const getSoloQuestions = useCallback((id) => {
    const lang = TRANSLATIONS[languageRef.current];
    if (id === 'never_normal') return lang.questionsNeverNormal || [];
    if (id === 'never_girls') return lang.questionsNeverGirls || [];
    if (id === 'dare_basic') return lang.questionsDareBasic || [];
    return [];
  }, []);

  const startSoloGame = (mode) => {
    const questions = getSoloQuestions(mode.id);
    if (!questions.length) { showToast(t('toast.noQuestions')); return; }
    const shuffled = shuffleArray(questions);
    setSoloModeId(mode.id);
    setModeLabel(mode.label);
    setSoloQuestions(shuffled);
    setSoloQuestionIndex(0);
    setSoloCurrentQuestion(shuffled[0]);
    setQuestionNum(1);
    navigateTo(SCREENS.SOLO_GAME);
  };

  const nextSoloQuestion = () => {
    const nextIndex = (soloQuestionIndex + 1) % soloQuestions.length;
    setSoloQuestionIndex(nextIndex);
    setSoloCurrentQuestion(soloQuestions[nextIndex]);
    setQuestionNum((prev) => prev + 1);
  };

  const exitSoloGame = () => {
    setSoloModeId(null); setSoloQuestions([]); setSoloQuestionIndex(0);
    setSoloCurrentQuestion(""); setQuestionNum(0); setModeLabel(null);
    navigateTo(SCREENS.MODE_NEVER_SUB);
  };

  const addDarePlayer = () => {
    const name = dareNameInput.trim();
    if (!name) { showToast(t('toast.emptyName')); return; }
    if (darePlayerNames.includes(name)) { showToast(t('toast.duplicateName')); return; }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setDarePlayerNames([...darePlayerNames, name]);
    setDareNameInput("");
  };

  const removeDarePlayer = (index) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setDarePlayerNames(darePlayerNames.filter((_, i) => i !== index));
  };

  const startDareGame = () => {
    if (darePlayerNames.length < 2) { showToast(t('toast.minPlayers')); return; }
    const questions = getSoloQuestions('dare_basic');
    if (!questions.length) { showToast(t('toast.noQuestions')); return; }
    const shuffled = shuffleArray(questions);
    setSoloModeId("dare_basic");
    setSoloQuestions(shuffled);
    setSoloQuestionIndex(0);
    setSoloCurrentQuestion(shuffled[0]);
    setQuestionNum(1);
    const randomPlayer = darePlayerNames[Math.floor(Math.random() * darePlayerNames.length)];
    setCurrentDarePlayer(randomPlayer);
    navigateTo(SCREENS.SOLO_GAME);
  };

  const nextDareQuestion = () => {
    const nextIndex = (soloQuestionIndex + 1) % soloQuestions.length;
    setSoloQuestionIndex(nextIndex);
    setSoloCurrentQuestion(soloQuestions[nextIndex]);
    setQuestionNum((prev) => prev + 1);
    const randomPlayer = darePlayerNames[Math.floor(Math.random() * darePlayerNames.length)];
    setCurrentDarePlayer(randomPlayer);
  };

  const exitDareGame = () => {
    setSoloModeId(null); setSoloQuestions([]); setSoloQuestionIndex(0);
    setSoloCurrentQuestion(""); setQuestionNum(0); setCurrentDarePlayer("");
    setModeLabel(null); navigateTo(SCREENS.DARE_SETUP);
  };

  /* ── interpolations ── */
  const setupSlideX = setupTabAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -(setupPanelWidth || 1)] });
  const setupCreateOpacity = setupTabAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.35] });
  const setupJoinOpacity = setupTabAnim.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] });
  const cardOpacity = cardAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const cardTranslateY = cardAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] });
  const cardScale = cardAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] });
  const dareResultScale = dareResultAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.92, 1.06, 1] });

  /* ── determine card style ── */
  const useCompactCard = screen === SCREENS.HOME || screen === SCREENS.MODE_MAIN || screen === SCREENS.MODE_NEVER_SUB || screen === SCREENS.DARE_SETUP;
  const useLobbyCard = screen === SCREENS.LOBBY;

  /* ── header text ── */
  const headerTitle = (() => {
    if (screen === SCREENS.HOME) return t('home.title');
    if (screen === SCREENS.MODE_MAIN) return t('home.title');
    if (screen === SCREENS.MODE_NEVER_SUB) return t('modes.selectVersion');
    if (screen === SCREENS.DARE_SETUP) return t('dareSetup.title');
    if (screen === SCREENS.LOBBY) return t('lobby.title');
    if (screen === SCREENS.GAME) return modeLabel || t('game.title');
    if (screen === SCREENS.SOLO_GAME) return modeLabel || t('game.title');
    return "";
  })();

  const headerSubtitle = (() => {
    if (screen === SCREENS.HOME) return selectedMode ? selectedMode.label : t('home.subtitle');
    if (screen === SCREENS.MODE_MAIN) return t('modes.subtitle');
    if (screen === SCREENS.MODE_NEVER_SUB) return t('modes.selectVersionSub');
    if (screen === SCREENS.DARE_SETUP) return t('format.readyCount')(darePlayerNames.length);
    if (screen === SCREENS.LOBBY) return t('format.waitingCount')(players.length);
    if (screen === SCREENS.GAME && phase === "question") return t('format.answerCount')(answersCount, totalPlayers);
    if (screen === SCREENS.GAME && phase === "reveal") return t('game.results');
    if (screen === SCREENS.SOLO_GAME) return t('format.swipeHint');
    return "";
  })();

  /* ── render content ── */
  const renderCardContent = () => {
    if (screen === SCREENS.HOME) {
      return (
        <HomeScreen
          t={t} selectedMode={selectedMode} navigateTo={navigateTo}
          playerName={playerName} setPlayerName={setPlayerName}
          setupTab={setupTab} setSetupTab={setSetupTab}
          setupPanelWidth={setupPanelWidth} setSetupPanelWidth={setSetupPanelWidth}
          setupSlideX={setupSlideX} setupCreateOpacity={setupCreateOpacity}
          setupJoinOpacity={setupJoinOpacity}
          createRoom={createRoom} joinRoom={joinRoom}
          roomCodeInput={roomCodeInput} setRoomCodeInput={setRoomCodeInput}
        />
      );
    }
    if (screen === SCREENS.MODE_MAIN) {
      return <ModeMainScreen t={t} navigateTo={navigateTo} selectMode={selectMode} />;
    }
    if (screen === SCREENS.DARE_SETUP) {
      return (
        <DareSetupScreen
          t={t} dareNameInput={dareNameInput} setDareNameInput={setDareNameInput}
          addDarePlayer={addDarePlayer} darePlayerNames={darePlayerNames}
          removeDarePlayer={removeDarePlayer} startDareGame={startDareGame}
        />
      );
    }
    if (screen === SCREENS.MODE_NEVER_SUB) {
      return <ModeNeverSubScreen t={t} selectMode={selectMode} />;
    }
    if (screen === SCREENS.LOBBY) {
      return (
        <LobbyScreen
          t={t} activeRoomCode={activeRoomCode} copied={copied}
          copyCode={copyCode} players={players} isOwner={isOwner} startGame={startGame}
        />
      );
    }
    if (screen === SCREENS.SOLO_GAME) {
      return (
        <SoloGameScreen
          t={t} soloModeId={soloModeId} soloCurrentQuestion={soloCurrentQuestion}
          questionNum={questionNum} currentDarePlayer={currentDarePlayer}
          nextDareQuestion={nextDareQuestion} nextSoloQuestion={nextSoloQuestion}
        />
      );
    }
    if (screen === SCREENS.GAME) {
      return (
        <GameScreen
          t={t} modeId={modeId} modeType={modeType} phase={phase}
          question={question} questionType={questionType} questionNum={questionNum}
          currentTurnPlayerName={currentTurnPlayerName}
          currentTurnPlayerId={currentTurnPlayerId}
          myId={myId} isMyTurn={isMyTurn}
          playerEntries={playerEntries}
          selectedVoteTarget={selectedVoteTarget} setSelectedVoteTarget={setSelectedVoteTarget}
          inputNumber={inputNumber} setInputNumber={setInputNumber}
          answersCount={answersCount} totalPlayers={totalPlayers}
          currentResult={currentResult} revealStep={revealStep}
          revealItem={revealItem} revealX={revealX}
          dareResultScale={dareResultScale}
          nextQuestion={nextQuestion} submitVote={submitVote}
          submitInput={submitInput} submitTarget={submitTarget}
        />
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
      {(screen === SCREENS.DARE_SETUP || (screen === SCREENS.SOLO_GAME && soloModeId === "dare_basic")) ? (
        <ImageBackground
          source={DARE_BG}
          style={StyleSheet.absoluteFill}
          imageStyle={{ opacity: 0.45 }}
          resizeMode="cover"
          pointerEvents="none"
        >
          <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(3,3,8,0.55)" }]} />
        </ImageBackground>
      ) : (
        <PremiumBackground />
      )}
      {/* Top bar: back button + settings */}
      {screen !== SCREENS.MODE_MAIN && (
        <Pressable
          style={styles.backButton}
          onPress={() => {
            if (screen === SCREENS.SOLO_GAME) {
              if (soloModeId === "dare_basic") exitDareGame();
              else exitSoloGame();
            } else if (screen === SCREENS.DARE_SETUP) {
              navigateTo(SCREENS.MODE_MAIN);
            } else if (screen === SCREENS.HOME) {
              navigateTo(SCREENS.MODE_MAIN);
            } else if (screen === SCREENS.MODE_NEVER_SUB) {
              navigateTo(SCREENS.MODE_MAIN);
            } else {
              leaveRoom();
            }
          }}
        >
          <BlurView intensity={30} tint="dark" style={styles.backButtonBlur}>
            <Text style={styles.backIcon}>‹</Text>
          </BlurView>
        </Pressable>
      )}

      {screen !== SCREENS.GAME && screen !== SCREENS.SOLO_GAME && (
        <Pressable style={styles.settingsButton} onPress={() => setSettingsOpen(true)}>
          <BlurView intensity={30} tint="dark" style={styles.backButtonBlur}>
            <Text style={styles.settingsIcon}>⚙</Text>
          </BlurView>
        </Pressable>
      )}

      {(screen === SCREENS.GAME || screen === SCREENS.SOLO_GAME) && modeLabel && (
        <View style={styles.modeTag}>
          <BlurView intensity={20} tint="dark" style={styles.modeTagBlur}>
            <Text style={styles.modeTagText}>{modeLabel}</Text>
          </BlurView>
        </View>
      )}

      <View style={[styles.page, useCompactCard && styles.pageCentered]}>

        {screen !== SCREENS.GAME && screen !== SCREENS.SOLO_GAME && (
          <View style={[styles.header, screen !== SCREENS.MODE_MAIN && styles.headerWithBack]}>
            {screen === SCREENS.MODE_MAIN && (
              <View style={styles.logoWrap}>
                <Image source={require("./assets/logoshot.jpeg")} style={styles.logoImage} />
              </View>
            )}
            <Text style={styles.title}>{headerTitle}</Text>
            <Text style={[styles.subtitle, screen === SCREENS.MODE_MAIN && { color: "#FAFAFA" }]}>{headerSubtitle}</Text>
          </View>
        )}

        {screen === SCREENS.GAME || screen === SCREENS.SOLO_GAME ? (
          <Animated.View
            style={[styles.gameContainer, { opacity: cardOpacity, transform: [{ translateY: cardTranslateY }, { scale: cardScale }] }]}
          >
            {renderCardContent()}
          </Animated.View>
        ) : (
          <Animated.View
            style={[
              styles.card,
              useCompactCard && styles.cardCompact,
              useLobbyCard && styles.cardLobby,
              { opacity: cardOpacity, transform: [{ translateY: cardTranslateY }, { scale: cardScale }] },
            ]}
          >
            {renderCardContent()}
          </Animated.View>
        )}
      </View>
      <SettingsModal
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        language={language}
        onSelectLanguage={changeLanguage}
        t={t}
      />
    </SafeAreaView>
  );
}

/* ── Animated Letter ── */
function AnimatedLetter({ char, index, anims }) {
  const anim = anims[index];
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const translateY = anim.interpolate({ inputRange: [0, 0.6, 1], outputRange: [18, -3, 0] });
  const scale = anim.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.5, 1.1, 1] });

  return (
    <Animated.Text style={[splashStyles.titleChar, { opacity, transform: [{ translateY }, { scale }] }]}>
      {char === " " ? "  " : char}
    </Animated.Text>
  );
}

/* ── Splash Screen ── */
function SplashScreen({ onFinish }) {
  const [splashLang, setSplashLang] = useState('tr');
  const splashText = TRANSLATIONS[splashLang]?.splash?.subtitle || TRANSLATIONS.tr.splash.subtitle;

  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const fadeOut = useRef(new Animated.Value(1)).current;
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    SafeStorage.getItem('shotic_language').then((saved) => {
      if (saved && TRANSLATIONS[saved]) setSplashLang(saved);
    }).catch(() => {});
  }, []);

  const letterAnims = useRef(splashText.split("").map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const letterSequence = letterAnims.map((anim, i) =>
      Animated.timing(anim, { toValue: 1, duration: 280, delay: i * 40, useNativeDriver: true, easing: Easing.out(Easing.back(1.5)) })
    );

    Animated.sequence([
      Animated.delay(300),
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
      Animated.timing(shimmer, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.parallel(letterSequence),
      Animated.delay(600),
      Animated.timing(fadeOut, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start(() => onFinish());
  }, []);

  const shimmerTranslateX = shimmer.interpolate({ inputRange: [0, 1], outputRange: [-200, 200] });

  return (
    <Animated.View style={[splashStyles.container, { opacity: fadeOut }]}>
      <LinearGradient
        colors={["#030308", "#080810", "#050509", "#020206"]}
        locations={[0, 0.35, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View style={[splashStyles.logoContainer, { transform: [{ scale: logoScale }], opacity: logoOpacity }]}>
        <Image source={require("./assets/logoshot.jpeg")} style={splashStyles.logoImage} resizeMode="contain" />
        <LinearGradient colors={["#030308", "transparent"]} style={splashStyles.edgeFadeTop} pointerEvents="none" />
        <LinearGradient colors={["transparent", "#050509"]} style={splashStyles.edgeFadeBottom} pointerEvents="none" />
        <LinearGradient colors={["#030308", "transparent"]} start={{ x: 0, y: 0.5 }} end={{ x: 0.15, y: 0.5 }} style={StyleSheet.absoluteFill} pointerEvents="none" />
        <LinearGradient colors={["transparent", "#030308"]} start={{ x: 0.85, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} pointerEvents="none" />
        <Animated.View style={[splashStyles.shimmerOverlay, { transform: [{ translateX: shimmerTranslateX }] }]}>
          <LinearGradient colors={["transparent", "rgba(168,85,247,0.2)", "transparent"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
        </Animated.View>
      </Animated.View>


      <View style={splashStyles.titleRow}>
        {splashText.split("").map((char, i) => (
          <AnimatedLetter key={i} char={char} index={i} anims={letterAnims} />
        ))}
      </View>
    </Animated.View>
  );
}

export default function App() {
  const [splashDone, setSplashDone] = useState(false);
  const [appLang, setAppLang] = useState('tr');

  useEffect(() => {
    SafeStorage.getItem('shotic_language').then((saved) => {
      if (saved && TRANSLATIONS[saved]) setAppLang(saved);
    }).catch(() => {});
  }, []);

  return (
    <ErrorBoundary language={appLang}>
      {!splashDone && <SplashScreen onFinish={() => setSplashDone(true)} />}
      {splashDone && <AppContent />}
    </ErrorBoundary>
  );
}
