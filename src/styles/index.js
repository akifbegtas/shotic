import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#030308" },
  page: { flex: 1, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 },
  pageCentered: { justifyContent: "center" },

  /* Glow orbs */
  nebula: { position: "absolute", borderRadius: 999 },
  nebula1: { top: -60, right: -80, width: 320, height: 320, backgroundColor: "#7C3AED" },
  nebula2: { bottom: -80, left: -60, width: 280, height: 280, backgroundColor: "#581C87" },
  nebula3: { top: "45%", left: -40, width: 200, height: 200, backgroundColor: "#9333EA" },

  /* Toast */
  toastContainer: { position: "absolute", top: 0, alignSelf: "center", zIndex: 999, borderRadius: 20, overflow: "hidden", minWidth: "80%" },
  toastBlur: { borderRadius: 20, overflow: "hidden" },
  toastInner: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, gap: 10 },
  toastDot: { width: 8, height: 8, borderRadius: 4 },
  toastDotError: { backgroundColor: "#F43F5E" },
  toastDotSuccess: { backgroundColor: "#22C55E" },
  toastText: { color: "#FAFAFA", fontSize: 14, fontWeight: "600", flex: 1 },
  toastTextError: { color: "#FCA5A5" },

  /* Glass card */
  glassOuter: { borderRadius: 24, overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  glassBlur: { borderRadius: 24, overflow: "hidden" },
  glassInner: { padding: 18, gap: 8 },

  /* Section header */
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionLabel: { color: "#A1A1AA", fontSize: 11, fontWeight: "800", letterSpacing: 1.5, textTransform: "uppercase" },
  countBadge: { backgroundColor: "rgba(236,72,153,0.15)", borderWidth: 1, borderColor: "rgba(236,72,153,0.3)", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 2 },
  countBadgeText: { color: "#EC4899", fontSize: 12, fontWeight: "800" },

  /* Shimmer line */
  shimmerLine: { height: 1, backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 1, overflow: "hidden", marginVertical: 8 },
  shimmerGlow: { position: "absolute", top: 0, left: 0, width: 80, height: 1, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 1 },

  /* Back button */
  backButton: { position: "absolute", top: 12, left: 12, zIndex: 10, width: 44, height: 44, borderRadius: 22, overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  backButtonBlur: { flex: 1, alignItems: "center", justifyContent: "center", borderRadius: 22 },
  backIcon: { color: "#FAFAFA", fontSize: 26, lineHeight: 28, marginTop: -2, fontWeight: "600" },

  /* Mode tag */
  modeTag: { position: "absolute", top: 14, right: 14, zIndex: 10, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" },
  modeTagBlur: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  modeTagText: { color: "#A1A1AA", fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5 },

  /* Header */
  header: { alignItems: "center", marginBottom: 20, marginTop: 4 },
  headerWithBack: { marginTop: 54 },
  logoWrap: { alignItems: "center", justifyContent: "center", marginBottom: 16 },
  logoImage: { width: 100, height: 100, borderRadius: 50 },
  logoGlow: { display: "none" },
  title: { fontSize: 34, fontWeight: "900", color: "#FAFAFA", letterSpacing: -0.5 },
  subtitle: { marginTop: 6, fontSize: 15, color: "#71717A", textAlign: "center", paddingHorizontal: 20, fontWeight: "500" },

  /* Card */
  card: { flex: 1, borderRadius: 28, backgroundColor: "rgba(15, 15, 20, 0.6)", padding: 20, paddingBottom: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", backdropFilter: "blur(20px)" },
  cardCompact: { flex: 0, paddingVertical: 24, marginTop: 0 },
  cardLobby: { flex: 0, marginTop: 12 },

  stack: { gap: 14 },
  gameContainer: { flex: 1, marginTop: 8 },
  gameStack: { flex: 1, justifyContent: "center", gap: 16 },

  /* Swipe hint */
  swipeHintWrap: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 16 },
  swipeArrow: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center" },
  swipeArrowText: { color: "rgba(161,161,170,0.5)", fontSize: 16, fontWeight: "600" },
  swipeHint: { color: "rgba(161,161,170,0.4)", fontSize: 13, letterSpacing: 2, textTransform: "uppercase", fontWeight: "600" },

  /* Segment */
  segmentWrap: { flexDirection: "row", backgroundColor: "rgba(9, 9, 11, 0.6)", borderRadius: 16, padding: 4, borderWidth: 1, borderColor: "rgba(255,255,255,0.04)" },
  segmentButton: { flex: 1, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  segmentButtonActive: {},
  segmentGradient: { flex: 1, width: "100%", borderRadius: 12, alignItems: "center", justifyContent: "center" },
  segmentText: { color: "#52525B", fontSize: 14, fontWeight: "700" },
  segmentTextActive: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },

  panelViewport: { overflow: "hidden" },
  panelTrack: { flexDirection: "row" },
  panelPage: { justifyContent: "flex-start" },

  /* Input */
  inputWrapper: { gap: 6 },
  inputLabel: { color: "#71717A", fontSize: 11, fontWeight: "700", letterSpacing: 1.2, marginLeft: 4 },
  input: { height: 56, borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", backgroundColor: "rgba(9, 9, 11, 0.6)", color: "#FAFAFA", paddingHorizontal: 16, fontSize: 16, fontWeight: "600" },
  inputFlex: { flex: 1 },
  inputRow: { flexDirection: "row", gap: 10 },
  addBtn: { width: 56, height: 56, borderRadius: 16, overflow: "hidden" },
  addBtnGradient: { flex: 1, alignItems: "center", justifyContent: "center", borderRadius: 16 },
  addBtnText: { color: "#FFFFFF", fontSize: 24, fontWeight: "700" },

  /* Mode card */
  modeCard: { borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", backgroundColor: "rgba(15, 15, 20, 0.7)", paddingVertical: 14, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 14, overflow: "hidden" },
  modeCardGlow: { ...StyleSheet.absoluteFillObject, borderRadius: 20 },
  modeCardEmoji: { fontSize: 32 },
  modeCardTextWrap: { flex: 1, gap: 2 },
  modeCardTitle: { color: "#FAFAFA", fontSize: 18, fontWeight: "800", letterSpacing: -0.3 },
  modeCardDesc: { color: "#71717A", fontSize: 12, fontWeight: "500" },
  playerBadge: { marginTop: 4, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, alignSelf: "flex-start" },
  playerBadgePink: { backgroundColor: "rgba(236,72,153,0.12)", borderWidth: 1, borderColor: "rgba(236,72,153,0.2)" },
  playerBadgeOrange: { backgroundColor: "rgba(251,146,60,0.12)", borderWidth: 1, borderColor: "rgba(251,146,60,0.2)" },
  playerBadgeCyan: { backgroundColor: "rgba(6,182,212,0.12)", borderWidth: 1, borderColor: "rgba(6,182,212,0.2)" },
  playerBadgeText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.3 },

  /* Mode option */
  modeOption: { borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", backgroundColor: "rgba(15, 15, 20, 0.6)", paddingVertical: 16, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  modeOptionActive: { borderColor: "rgba(236,72,153,0.4)", backgroundColor: "rgba(236, 72, 153, 0.08)" },
  modeOptionLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  modeOptionIcon: { color: "#EC4899", fontSize: 16, fontWeight: "800", width: 20, textAlign: "center" },
  modeOptionText: { color: "#D4D4D8", fontSize: 16, fontWeight: "600" },
  modeOptionTextActive: { color: "#F472B6" },

  /* Button */
  buttonGlow: { position: "absolute", top: 4, left: 20, right: 20, bottom: -4, borderRadius: 20, backgroundColor: "#EC4899", opacity: 0.4 },
  primaryButtonGradient: { paddingVertical: 18, paddingHorizontal: 24, borderRadius: 20, alignItems: "center", justifyContent: "center", shadowColor: "#EC4899", shadowOpacity: 0.5, shadowRadius: 20, shadowOffset: { width: 0, height: 8 } },
  primaryButtonText: { color: "#FFFFFF", fontWeight: "800", fontSize: 16, letterSpacing: 0.5, textTransform: "uppercase" },
  secondaryButton: { paddingVertical: 18, paddingHorizontal: 24, borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(15, 15, 20, 0.6)", alignItems: "center", justifyContent: "center" },
  secondaryButtonText: { color: "#A1A1AA", fontWeight: "700", fontSize: 16, letterSpacing: 0.3, textTransform: "uppercase" },

  /* Player avatar */
  playerAvatarRow: { flexDirection: "row", alignItems: "center", paddingVertical: 6, gap: 12 },
  playerAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  playerAvatarText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
  playerAvatarInfo: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  playerAvatarName: { color: "#E4E4E7", fontSize: 16, fontWeight: "700" },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  hostBadge: { backgroundColor: "rgba(236,72,153,0.15)", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 11, borderWidth: 1, borderColor: "rgba(236,72,153,0.2)" },
  hostBadgeText: { color: "#EC4899", fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },

  /* Remove button */
  removeBtn: { marginLeft: "auto", width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(244,63,94,0.1)", borderWidth: 1, borderColor: "rgba(244,63,94,0.2)", alignItems: "center", justifyContent: "center" },
  removeBtnText: { color: "#F43F5E", fontSize: 16, fontWeight: "800" },

  /* Player grid (two-column) */
  playerGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 8 },
  playerChip: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderRadius: 12, paddingVertical: 6, paddingLeft: 6, paddingRight: 4, gap: 5, width: "48.5%" },
  playerChipAvatar: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  playerChipAvatarText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800" },
  playerChipName: { color: "#E4E4E7", fontSize: 13, fontWeight: "700", flex: 1 },
  playerChipRemove: { width: 22, height: 22, borderRadius: 11, backgroundColor: "rgba(244,63,94,0.12)", borderWidth: 1, borderColor: "rgba(244,63,94,0.2)", alignItems: "center", justifyContent: "center" },
  playerChipRemoveText: { color: "#F43F5E", fontSize: 10, fontWeight: "800" },

  /* Empty state */
  emptyState: { alignItems: "center", paddingVertical: 20, gap: 4 },
  emptyStateIcon: { fontSize: 32, marginBottom: 4 },
  emptyStateText: { color: "#71717A", fontSize: 15, fontWeight: "600" },
  emptyStateHint: { color: "#52525B", fontSize: 13, fontWeight: "500" },

  /* Turn badge */
  turnBadge: { alignSelf: "center", borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: "rgba(6,182,212,0.2)", marginBottom: 8 },
  turnBadgeGradient: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 8, gap: 8, borderRadius: 16 },
  turnBadgeLabel: { color: "#06B6D4", fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  turnBadgeName: { color: "#FAFAFA", fontSize: 16, fontWeight: "800" },

  /* Lobby code */
  lobbyCode: { color: "#FAFAFA", fontSize: 38, fontWeight: "900", letterSpacing: 6, textAlign: "center", marginVertical: 8 },
  lobbyHint: { color: "#52525B", fontSize: 12, textAlign: "center", fontWeight: "500" },

  /* Copy button */
  copyBtn: { borderRadius: 12, overflow: "hidden" },
  copyBtnGradient: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  copyBtnIcon: { color: "#FAFAFA", fontSize: 14, fontWeight: "800" },

  /* Waiting */
  waitingBox: { alignItems: "center", paddingVertical: 16, gap: 4 },
  waitingDots: { color: "#EC4899", fontSize: 24, fontWeight: "800", letterSpacing: 4 },
  waitingText: { color: "#71717A", fontSize: 14, fontWeight: "600" },

  /* Question card */
  questionEyebrow: { color: "#06B6D4", fontSize: 11, fontWeight: "900", letterSpacing: 1.5, marginBottom: 12, textAlign: "center" },
  questionHero: { borderRadius: 24, borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.08)", backgroundColor: "rgba(20, 20, 25, 0.8)", paddingHorizontal: 6, paddingVertical: 6, marginBottom: 16, shadowColor: "#000", shadowOpacity: 0.6, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 10 },
  questionHeroWithFrame: { backgroundColor: "transparent", borderWidth: 0, padding: 0, overflow: "hidden", borderRadius: 20, marginBottom: 0, shadowColor: "#000", shadowOpacity: 0.7, shadowRadius: 28, shadowOffset: { width: 0, height: 14 }, elevation: 14 },
  cardFrameImage: { width: "100%", aspectRatio: 0.72, justifyContent: "center", alignItems: "center" },
  cardFrameImageStyle: { borderRadius: 20 },
  cardFrameContent: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: "20%", paddingTop: "12%", paddingBottom: "20%" },
  questionCardInner: { borderRadius: 20, backgroundColor: "rgba(15, 15, 20, 0.95)", paddingHorizontal: 20, paddingVertical: 28, alignItems: "center", justifyContent: "center", minHeight: 160 },
  questionCardTop: { alignItems: "center", marginBottom: 16 },
  questionIllustration: { fontSize: 36 },
  questionTextNever: { color: "#FAFAFA", fontSize: 26, lineHeight: 36, fontWeight: "800", textAlign: "center", letterSpacing: -0.2 },
  questionTextDare: { color: "#FAFAFA", fontSize: 24, lineHeight: 34, fontWeight: "800", textAlign: "center", letterSpacing: -0.2 },
  questionTextOnFrame: { color: "#2D2D3A", fontSize: 20, lineHeight: 30, fontWeight: "600", fontFamily: "Georgia", letterSpacing: 0.3 },
  questionCounter: { fontSize: 12, color: "#52525B", textAlign: "center", marginTop: 14, fontWeight: "600", letterSpacing: 0.5 },
  questionCounterOnFrame: { color: "#999", fontFamily: "Georgia", fontStyle: "italic", fontSize: 13 },

  revealStage: { minHeight: 80, alignItems: "center", justifyContent: "center", overflow: "hidden", marginBottom: 8, paddingVertical: 10, borderRadius: 16, backgroundColor: "rgba(9, 9, 11, 0.4)" },
  revealText: { color: "#FAFAFA", fontSize: 22, fontWeight: "900", textAlign: "center", letterSpacing: 0.3 },
  revealDrinker: { color: "#F472B6", fontSize: 24, fontWeight: "900", textAlign: "center", letterSpacing: 0.3 },
});
