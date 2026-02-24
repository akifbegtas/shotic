import { StatusBar } from "expo-status-bar";
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  ImageBackground,
  LogBox,
  PanResponder,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

LogBox.ignoreAllLogs(true);
import { Component, useCallback, useEffect, useRef, useState } from "react";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { io } from "socket.io-client";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const SCREENS = {
  HOME: "home",
  MODE_MAIN: "mode_main",
  MODE_NEVER_SUB: "mode_never_sub",
  LOBBY: "lobby",
  GAME: "game",
  SOLO_GAME: "solo_game",
  DARE_SETUP: "dare_setup",
};

const SERVER_URL = "http://localhost:3003";

const CARD_FRAMES = {
  never_normal: require("./assets/card_questions.png"),
  never_girls: require("./assets/card_hearts.png"),
  dare_basic: require("./assets/card_party.png"),
  challenger: require("./assets/card_party.png"),
};

const SOLO_QUESTIONS = {
  never_normal: [
    'Ben daha önce hiç gerçekten sevmediğim birine seni seviyorum dedim.',
    'Ben daha önce hiç aynı anda iki veya daha fazla kişiyle flörtleştim.',
    'Ben daha önce hiç sevgilinin telefonunu habersiz olarak karıştırdım.',
    'Ben daha önce hiç burnumu karıştırıp bir yere sürmedim.',
    'Ben daha önce hiç toplu taşımada osurmadım.',
    'Ben daha önce hiç yalan söyleyerek işten/okuldan izin almadım.',
    'Ben daha önce hiç birinin gözünün içine bakarak yalan söylemedim.',
    'Ben daha önce hiç utancımdan yerin dibine girmek istemedim.',
    'Ben daha önce hiç eski sevgilimi sarhoşken aramadım.',
    'Ben daha önce hiç telefona bakmayıp uyuyordum yalanını söylemedim.',
    'Ben daha önce hiç biriyle tartışmamak için tamam demedim.',
    'Ben daha önce hiç trafikte kavga etmedim.',
    'Ben daha önce hiç sarhoşken kusmadım.',
    'Ben daha önce hiç ne yaptığımı unutacak kadar içmedim.',
    'Ben daha önce hiç istemediğim birini ortamı bozmamak için idare etmedim.',
    'Ben daha önce hiç sadece ilgi almak için birini kabul etmedim.',
    'Ben daha önce hiç çok sevdiğim birine üzülmemesi için pembe yalan söylemedim.',
    'Ben daha önce hiç olmaması gereken birine aşık olmadım.',
    'Ben daha önce hiç göndeme story atmadım.',
    'Ben daha önce hiç situationship yaşamadım.',
    'Ben daha önce hiç yakın arkadaşıma gizli ilgi duymadım.',
    'Ben daha önce hiç birini kıskandırmak için başkasını kullanmadım.',
    'Ben daha önce hiç birini unutamadığım için ağlamadım.',
    'Ben daha önce hiç 1 kişiden fazla flört yapmadım.',
    'Ben daha önce hiç sevgilim varken başkasını özlemedim.',
    'Ben daha önce hiç sosyal medyadan biriyle tanışmadım.',
    'Ben daha önce hiç mekanda tanıştığım biriyle konuşmadım.',
    'Ben daha önce hiç fake hesaptan birine yazmadım.',
    'Ben daha önce hiç sevgilimin eski sevgilisini stalklamadım.',
    'Ben daha önce hiç ekran görüntüsünü yanlış kişiye göndermedim.',
    'Ben daha önce hiç sevgilimin telefonunu karıştırmadım.',
    'Ben daha önce hiç birini ghostlamadım.',
    'Ben daha önce hiç aldatıldığımı bildiğim halde ilişkiye devam etmedim.',
    'Ben daha önce hiç çok büyük bir sır saklamadım.',
    'Ben daha önce hiç sıkıldığım için tartışma çıkarmadım.',
    'Ben daha önce hiç durumdan kurtulmak için ağlamadım.',
    'Ben daha önce hiç bir yerden kaçmak için birine beni ara yazmadım.',
    'Ben daha önce hiç istemediğim birini öpmedim.',
    'Ben daha önce hiç siyasi görüşüm hakkında yalan söylemedim.',
    'Ben daha önce hiç arkadaşımı idare etmek için yalanına destek çıkmadım.',
    'Ben daha önce hiç gördüğüm birini tanımamış gibi yapmadım.',
    'Ben daha önce hiç sosyal medyadan biriyle tartışmadım.',
    'Ben daha önce hiç birine inanmadığım halde destek vermedim.',
    'Ben daha önce hiç birine takıntılı olmadım.',
    'Ben daha önce hiç partnerimi kıskandırmak için bir şey yapmadım.',
    'Ben daha önce hiç kıskandığım halde kıskanmamış gibi davranmadım.',
    'Ben daha önce hiç exten next denemesi yapmadım.',
    'Ben daha önce hiç kimsenin storysine alev atmadım.',
    'Ben daha önce hiç sadece dış görünüşü için birine ilgi duymadım.',
    'Ben daha önce hiç sevgilimle arkadaşımın dedikodusunu yapmadım.',
  ],
  never_girls: [
    'Ben daha önce hiç en yakın arkadaşıma sevgili dedikodusu anlatmadım.',
    'Ben daha önce hiç hazırlanırken saatlerce kıyafet seçmedim.',
    'Ben daha önce hiç eski sevgiliyi gizlice stalklamadım.',
    'Ben daha önce hiç arkadaşımın rujunu izinsiz kullanmadım.',
    'Ben daha önce hiç kız kıza buluşmada drama çıkarmadım.',
    'Ben daha önce hiç erkek arkadaşıma başka kızı kıskandırmak için bahsetmedim.',
    'Ben daha önce hiç tuvalette 30 dakika fotoğraf çekmedim.',
    'Ben daha önce hiç eski sevgilimi sarhoşken aramadım.',
    'Ben daha önce hiç telefona bakmayıp uyuyordum yalanını söylemedim.',
    'Ben daha önce hiç sadece ilgi almak için birini kabul etmedim.',
    'Ben daha önce hiç çok sevdiğim birine üzülmemesi için pembe yalan söylemedim.',
    'Ben daha önce hiç olmaması gereken birine aşık olmadım.',
    'Ben daha önce hiç situationship yaşamadım.',
    'Ben daha önce hiç yakın arkadaşıma gizli ilgi duymadım.',
    'Ben daha önce hiç birini kıskandırmak için başkasını kullanmadım.',
    'Ben daha önce hiç birini unutamadığım için ağlamadım.',
    'Ben daha önce hiç sevgilim varken başkasını özlemedim.',
    'Ben daha önce hiç fake hesaptan birine yazmadım.',
    'Ben daha önce hiç sevgilimin eski sevgilisini stalklamadım.',
    'Ben daha önce hiç ekran görüntüsünü yanlış kişiye göndermedim.',
    'Ben daha önce hiç birini ghostlamadım.',
    'Ben daha önce hiç aldatıldığımı bildiğim halde ilişkiye devam etmedim.',
    'Ben daha önce hiç sıkıldığım için tartışma çıkarmadım.',
    'Ben daha önce hiç durumdan kurtulmak için ağlamadım.',
    'Ben daha önce hiç bir yerden kaçmak için birine beni ara yazmadım.',
    'Ben daha önce hiç istemediğim birini öpmedim.',
    'Ben daha önce hiç partnerimi kıskandırmak için bir şey yapmadım.',
    'Ben daha önce hiç kıskandığım halde kıskanmamış gibi davranmadım.',
    'Ben daha önce hiç exten next denemesi yapmadım.',
    'Ben daha önce hiç kimsenin storysine alev atmadım.',
    'Ben daha önce hiç sevgilimle arkadaşımın dedikodusunu yapmadım.',
    'Ben daha önce hiç göndeme story atmadım.',
    'Ben daha önce hiç sadece dış görünüşü için birine ilgi duymadım.',
    'Ben daha önce hiç birine takıntılı olmadım.',
  ],
  dare_basic: [
    'Telefonundaki son mesajı gruba oku ya da iç.',
    'Karşındaki kişiye iltifat et ya da iç.',
    '10 saniye göz teması kur ya da iç.',
    'Son aradığın kişiyi ara ve selam ver ya da iç.',
    'En utanç verici anını anlat ya da iç.',
    'Grubun en komik taklidi yap ya da iç.',
    'Telefonundaki en son çektiğin fotoğrafı göster ya da iç.',
    'En çok hoşlandığın kişinin adını söyle ya da iç.',
    'Bir dakika boyunca hiç konuşma ya da iç.',
    'Dans et ya da iç.',
  ],
};

const CARD_TEXT_COLORS = {
  never_normal: { main: "#3B1845", counter: "#6B4C78" },
  never_girls:  { main: "#8B1A2B", counter: "#A0505E" },
  dare_basic:   { main: "#352060", counter: "#605080" },
  challenger:   { main: "#352060", counter: "#605080" },
};

/* ── Floating Particle ── */
function FloatingParticle({ delay = 0, size = 4, startX, color = "#EC4899" }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = () => {
      anim.setValue(0);
      Animated.timing(anim, {
        toValue: 1,
        duration: 6000 + Math.random() * 4000,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
        delay,
      }).start(() => loop());
    };
    loop();
  }, []);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [SCREEN_HEIGHT + 20, -40] });
  const translateX = anim.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [0, 15, -10, 20, 0] });
  const opacity = anim.interpolate({ inputRange: [0, 0.1, 0.5, 0.9, 1], outputRange: [0, 0.6, 0.8, 0.4, 0] });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: startX,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity,
        transform: [{ translateY }, { translateX }],
      }}
    />
  );
}

/* ── Premium Background ── */
function PremiumBackground() {
  const pulse1 = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createPulse = (anim, duration) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      ).start();
    };
    createPulse(pulse1, 4000);
    createPulse(pulse2, 5500);
  }, []);

  const glow1Opacity = pulse1.interpolate({ inputRange: [0, 1], outputRange: [0.08, 0.2] });
  const glow1Scale = pulse1.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] });
  const glow2Opacity = pulse2.interpolate({ inputRange: [0, 1], outputRange: [0.06, 0.16] });
  const glow2Scale = pulse2.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <ImageBackground
        source={require("./assets/bg.png")}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />
      {/* Animated glow orbs */}
      <Animated.View style={[styles.glowOrb, styles.glowOrb1, { opacity: glow1Opacity, transform: [{ scale: glow1Scale }] }]} />
      <Animated.View style={[styles.glowOrb, styles.glowOrb2, { opacity: glow2Opacity, transform: [{ scale: glow2Scale }] }]} />
      <Animated.View style={[styles.glowOrb, styles.glowOrb3, { opacity: glow2Opacity, transform: [{ scale: glow1Scale }] }]} />

      {/* Floating particles */}
      <FloatingParticle delay={0} size={3} startX={SCREEN_WIDTH * 0.15} color="rgba(236,72,153,0.5)" />
      <FloatingParticle delay={1200} size={2} startX={SCREEN_WIDTH * 0.4} color="rgba(139,92,246,0.4)" />
      <FloatingParticle delay={2400} size={4} startX={SCREEN_WIDTH * 0.7} color="rgba(6,182,212,0.4)" />
      <FloatingParticle delay={3600} size={2.5} startX={SCREEN_WIDTH * 0.9} color="rgba(236,72,153,0.35)" />
      <FloatingParticle delay={800} size={3} startX={SCREEN_WIDTH * 0.55} color="rgba(168,85,247,0.3)" />
    </View>
  );
}

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

/* ── Toast with blur ── */
function Toast({ visible, message, type = "error", onHide }) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const scale = useRef(new Animated.Value(0.9)).current;
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 16, useNativeDriver: true, speed: 14, bounciness: 8 }),
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 8 }),
      ]).start();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      const t = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, { toValue: -100, duration: 250, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 0.9, duration: 250, useNativeDriver: true }),
        ]).start(() => onHide());
      }, 3000);
      return () => clearTimeout(t);
    } else {
      Animated.timing(translateY, { toValue: -100, duration: 250, useNativeDriver: true }).start();
    }
  }, [visible, message]);
  return (
    <Animated.View style={[styles.toastContainer, { transform: [{ translateY }, { scale }] }]}>
      <BlurView intensity={40} tint="dark" style={styles.toastBlur}>
        <View style={styles.toastInner}>
          <View style={[styles.toastDot, type === "error" ? styles.toastDotError : styles.toastDotSuccess]} />
          <Text style={[styles.toastText, type === "error" && styles.toastTextError]}>{message}</Text>
        </View>
      </BlurView>
    </Animated.View>
  );
}

/* ── GlassCard wrapper ── */
function GlassCard({ children, style, intensity = 25 }) {
  return (
    <View style={[styles.glassOuter, style]}>
      <BlurView intensity={intensity} tint="dark" style={styles.glassBlur}>
        <View style={styles.glassInner}>
          {children}
        </View>
      </BlurView>
    </View>
  );
}

/* ── Premium GameButton ── */
function GameButton({ label, onPress, variant = "primary", disabled = false, icon }) {
  const scale = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (variant === "primary" && !disabled) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      ).start();
    }
  }, [variant, disabled]);

  const handlePressIn = () => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    Animated.spring(scale, { toValue: 0.94, useNativeDriver: true, speed: 24, bounciness: 12 }).start();
  };
  const handlePressOut = () => {
    if (disabled) return;
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 10 }).start();
  };

  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.7] });

  if (variant === "primary") {
    return (
      <Pressable onPress={disabled ? null : onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <Animated.View style={[disabled && { opacity: 0.4 }, { transform: [{ scale }] }]}>
          {/* Glow behind button */}
          <Animated.View style={[styles.buttonGlow, { opacity: glowOpacity }]} />
          <LinearGradient
            colors={["#EC4899", "#A855F7", "#8B5CF6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.primaryButtonGradient}
          >
            <Text style={styles.primaryButtonText}>
              {icon ? `${icon}  ` : ""}{label}
            </Text>
          </LinearGradient>
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={disabled ? null : onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View
        style={[
          styles.secondaryButton,
          disabled && { opacity: 0.4 },
          { transform: [{ scale }] },
        ]}
      >
        <Text style={styles.secondaryButtonText}>
          {icon ? `${icon}  ` : ""}{label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

/* ── Shimmer Line Separator ── */
function ShimmerLine() {
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmer, { toValue: 1, duration: 3000, easing: Easing.linear, useNativeDriver: true })
    ).start();
  }, []);
  const translateX = shimmer.interpolate({ inputRange: [0, 1], outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH] });
  return (
    <View style={styles.shimmerLine}>
      <Animated.View style={[styles.shimmerGlow, { transform: [{ translateX }] }]} />
    </View>
  );
}

const SWIPE_THRESHOLD = 80;

/* ── GameCard ── */
function GameCard({ icon, children, modeId, questionKey, onSwipeLeft, onSwipeRight }) {
  const anim = useRef(new Animated.Value(0)).current;
  const swipeX = useRef(new Animated.Value(0)).current;
  const swiped = useRef(false);

  useEffect(() => {
    swiped.current = false;
    swipeX.setValue(0);
    anim.setValue(0);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
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
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          Animated.timing(swipeX, { toValue: -SCREEN_WIDTH * 1.5, duration: 250, useNativeDriver: true }).start(() => onSwipeLeft());
        } else if (g.dx > SWIPE_THRESHOLD && onSwipeRight) {
          swiped.current = true;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          Animated.timing(swipeX, { toValue: SCREEN_WIDTH * 1.5, duration: 250, useNativeDriver: true }).start(() => onSwipeRight());
        } else {
          Animated.spring(swipeX, { toValue: 0, speed: 20, bounciness: 8, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  const translateX = anim.interpolate({ inputRange: [0, 0.4, 0.6, 1], outputRange: [320, 40, -8, 0] });
  const translateY = anim.interpolate({ inputRange: [0, 0.3, 0.6, 1], outputRange: [20, -6, -2, 0] });
  const rotateY = anim.interpolate({ inputRange: [0, 0.4, 0.7, 1], outputRange: ["-35deg", "-12deg", "3deg", "0deg"] });
  const rotateZ = anim.interpolate({ inputRange: [0, 0.3, 0.6, 1], outputRange: ["-4deg", "-1.5deg", "0.5deg", "0deg"] });
  const scale = anim.interpolate({ inputRange: [0, 0.4, 0.7, 1], outputRange: [0.88, 0.96, 1.01, 1] });
  const opacity = anim.interpolate({ inputRange: [0, 0.15, 0.4], outputRange: [0, 0.7, 1], extrapolate: "clamp" });
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

/* ── Player Avatar ── */
function PlayerAvatar({ name, index, isHost = false, onRemove }) {
  const colors = ["#EC4899", "#A855F7", "#06B6D4", "#10B981", "#F59E0B", "#EF4444", "#6366F1", "#14B8A6"];
  const bgColor = colors[index % colors.length];
  const initial = name.charAt(0).toUpperCase();

  return (
    <View style={styles.playerAvatarRow}>
      <LinearGradient
        colors={[bgColor, `${bgColor}88`]}
        style={styles.playerAvatar}
      >
        <Text style={styles.playerAvatarText}>{initial}</Text>
      </LinearGradient>
      <View style={styles.playerAvatarInfo}>
        <Text style={styles.playerAvatarName}>{name}</Text>
        {isHost && (
          <View style={styles.hostBadge}>
            <Text style={styles.hostBadgeText}>HOST</Text>
          </View>
        )}
      </View>
      {onRemove ? (
        <Pressable onPress={onRemove} style={styles.removeBtn}>
          <Text style={styles.removeBtnText}>✕</Text>
        </Pressable>
      ) : (
        <View style={[styles.statusDot, { backgroundColor: "#22C55E" }]} />
      )}
    </View>
  );
}

/* ── Compact Player Chip (two-column grid) ── */
function PlayerChip({ name, index, onRemove }) {
  const colors = ["#EC4899", "#A855F7", "#06B6D4", "#10B981", "#F59E0B", "#EF4444", "#6366F1", "#14B8A6"];
  const bgColor = colors[index % colors.length];
  const initial = name.charAt(0).toUpperCase();

  return (
    <View style={styles.playerChip}>
      <LinearGradient
        colors={[bgColor, `${bgColor}88`]}
        style={styles.playerChipAvatar}
      >
        <Text style={styles.playerChipAvatarText}>{initial}</Text>
      </LinearGradient>
      <Text style={styles.playerChipName} numberOfLines={1}>{name}</Text>
      {onRemove && (
        <Pressable onPress={onRemove} style={styles.playerChipRemove}>
          <Text style={styles.playerChipRemoveText}>✕</Text>
        </Pressable>
      )}
    </View>
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
  const isNever = modeType === "never";
  const isDareBasic = modeType === "dare_basic";
  const isChallenger = modeType === "dare";
  const isMyTurn = !!myId && myId === currentTurnPlayerId;

  /* ── navigation ── */
  const navigateTo = (next) => {
    if (next === screenRef.current || isNavigating.current) return;
    isNavigating.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    Animated.timing(cardAnim, {
      toValue: 0,
      duration: 120,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      setScreen(next);
      Animated.spring(cardAnim, {
        toValue: 1,
        speed: 16,
        bounciness: 4,
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

  const startSoloGame = (mode) => {
    const questions = SOLO_QUESTIONS[mode.id] || [];
    if (!questions.length) {
      showToast("Bu mod için henüz soru eklenmedi.");
      return;
    }
    setSoloModeId(mode.id);
    setModeLabel(mode.label);
    setSoloQuestions([...questions]);
    setSoloQuestionIndex(0);
    setSoloCurrentQuestion(questions[0]);
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
    setSoloModeId(null);
    setSoloQuestions([]);
    setSoloQuestionIndex(0);
    setSoloCurrentQuestion("");
    setQuestionNum(0);
    setModeLabel(null);
    navigateTo(SCREENS.MODE_NEVER_SUB);
  };

  const addDarePlayer = () => {
    const name = dareNameInput.trim();
    if (!name) {
      showToast("İsim boş olamaz.");
      return;
    }
    if (darePlayerNames.includes(name)) {
      showToast("Bu isim zaten eklendi.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setDarePlayerNames([...darePlayerNames, name]);
    setDareNameInput("");
  };

  const removeDarePlayer = (index) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setDarePlayerNames(darePlayerNames.filter((_, i) => i !== index));
  };

  const startDareGame = () => {
    if (darePlayerNames.length < 2) {
      showToast("En az 2 oyuncu gerekli.");
      return;
    }
    const questions = SOLO_QUESTIONS.dare_basic || [];
    if (!questions.length) {
      showToast("Bu mod için henüz soru eklenmedi.");
      return;
    }
    setSoloModeId("dare_basic");
    setSoloQuestions([...questions]);
    setSoloQuestionIndex(0);
    setSoloCurrentQuestion(questions[0]);
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
    setSoloModeId(null);
    setSoloQuestions([]);
    setSoloQuestionIndex(0);
    setSoloCurrentQuestion("");
    setQuestionNum(0);
    setCurrentDarePlayer("");
    setModeLabel(null);
    navigateTo(SCREENS.DARE_SETUP);
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
    if (screen === SCREENS.HOME) return "Shot Challenge";
    if (screen === SCREENS.MODE_MAIN) return "Oyun Modu";
    if (screen === SCREENS.MODE_NEVER_SUB) return "Mod Seç";
    if (screen === SCREENS.DARE_SETUP) return "Oyuncular";
    if (screen === SCREENS.LOBBY) return "Lobi";
    if (screen === SCREENS.GAME) return modeLabel || "Oyun";
    if (screen === SCREENS.SOLO_GAME) return modeLabel || "Oyun";
    return "";
  })();

  const headerSubtitle = (() => {
    if (screen === SCREENS.HOME) return selectedMode ? selectedMode.label : "Hadi partiye başlayalım!";
    if (screen === SCREENS.MODE_MAIN) return "Nasıl oynamak istersin?";
    if (screen === SCREENS.MODE_NEVER_SUB) return "Hangi versiyonu tercih edersin?";
    if (screen === SCREENS.DARE_SETUP) return `${darePlayerNames.length} kişi hazır`;
    if (screen === SCREENS.LOBBY) return `${players.length} oyuncu bekleniyor`;
    if (screen === SCREENS.GAME && phase === "question") return `Cevaplayan: ${answersCount}/${totalPlayers}`;
    if (screen === SCREENS.GAME && phase === "reveal") return "Sonuçlar";
    if (screen === SCREENS.SOLO_GAME) return "Kaydırarak sonraki soruya geç";
    return "";
  })();

  /* ── render content ── */
  const renderCardContent = () => {
    /* ── HOME ── */
    if (screen === SCREENS.HOME) {
      return (
        <View style={styles.stack}>
          <Pressable
            style={[styles.modeOption, selectedMode && styles.modeOptionActive]}
            onPress={() => navigateTo(SCREENS.MODE_MAIN)}
          >
            <View style={styles.modeOptionLeft}>
              <Text style={styles.modeOptionIcon}>{selectedMode ? "✓" : "+"}</Text>
              <Text style={[styles.modeOptionText, selectedMode && styles.modeOptionTextActive]}>
                {selectedMode ? selectedMode.label : "Oyun Modu Seç"}
              </Text>
            </View>
            <Text style={{ color: "#71717A", fontSize: 20 }}>›</Text>
          </Pressable>

          {selectedMode && (
            <>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>ISMIN</Text>
                <TextInput
                  placeholder="Adini gir..."
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
                      <Text style={styles.segmentTextActive}>Oda Oluştur</Text>
                    </LinearGradient>
                  ) : (
                    <Text style={styles.segmentText}>Oda Oluştur</Text>
                  )}
                </Pressable>
                <Pressable style={[styles.segmentButton, setupTab === "join" && styles.segmentButtonActive]} onPress={() => setSetupTab("join")}>
                  {setupTab === "join" ? (
                    <LinearGradient colors={["#EC4899", "#A855F7"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.segmentGradient}>
                      <Text style={styles.segmentTextActive}>Odaya Katıl</Text>
                    </LinearGradient>
                  ) : (
                    <Text style={styles.segmentText}>Odaya Katıl</Text>
                  )}
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
                        placeholderTextColor="#52525B"
                        value={roomCodeInput}
                        onChangeText={(v) => setRoomCodeInput(v.toUpperCase())}
                        style={styles.input}
                      />
                      <GameButton label="Odaya Katıl" onPress={joinRoom} variant="secondary" />
                    </View>
                  </Animated.View>
                </Animated.View>
              </View>
            </>
          )}
        </View>
      );
    }

    /* ── MODE MAIN ── */
    if (screen === SCREENS.MODE_MAIN) {
      return (
        <View style={styles.stack}>
          <Pressable style={styles.modeCard} onPress={() => navigateTo(SCREENS.MODE_NEVER_SUB)}>
            <LinearGradient colors={["rgba(236,72,153,0.15)", "rgba(168,85,247,0.08)"]} style={styles.modeCardGlow} />
            <Text style={styles.modeCardEmoji}>🤝</Text>
            <View style={styles.modeCardTextWrap}>
              <Text style={styles.modeCardTitle}>Ben Daha Önce Hiç</Text>
              <Text style={styles.modeCardDesc}>Tek kişilik, kaydır ve geç</Text>
            </View>
          </Pressable>

          <Pressable
            style={styles.modeCard}
            onPress={() => selectMode({ id: "dare_basic", label: "Yap Ya da İç" })}
          >
            <LinearGradient colors={["rgba(251,146,60,0.15)", "rgba(236,72,153,0.08)"]} style={styles.modeCardGlow} />
            <Text style={styles.modeCardEmoji}>🍺</Text>
            <View style={styles.modeCardTextWrap}>
              <Text style={styles.modeCardTitle}>Yap Ya da İç</Text>
              <Text style={styles.modeCardDesc}>İsimleri ekle, rastgele çıksın</Text>
            </View>
          </Pressable>

          <Pressable
            style={styles.modeCard}
            onPress={() => selectMode({ id: "challenger", label: "Challenger" })}
          >
            <LinearGradient colors={["rgba(6,182,212,0.15)", "rgba(99,102,241,0.08)"]} style={styles.modeCardGlow} />
            <Text style={styles.modeCardEmoji}>⚡</Text>
            <View style={styles.modeCardTextWrap}>
              <Text style={styles.modeCardTitle}>Challenger</Text>
              <Text style={styles.modeCardDesc}>Oylama, sayı yarışı, hedef seçme</Text>
              <View style={[styles.playerBadge, styles.playerBadgeCyan]}>
                <Text style={[styles.playerBadgeText, { color: "#22D3EE" }]}>3-8 oyuncu</Text>
              </View>
            </View>
          </Pressable>
        </View>
      );
    }

    /* ── DARE SETUP ── */
    if (screen === SCREENS.DARE_SETUP) {
      return (
        <View style={styles.stack}>
          {/* Input + Add - always visible at top */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>OYUNCU ISMI</Text>
            <View style={styles.inputRow}>
              <TextInput
                placeholder="İsim gir..."
                placeholderTextColor="#52525B"
                value={dareNameInput}
                onChangeText={setDareNameInput}
                onSubmitEditing={addDarePlayer}
                style={[styles.input, styles.inputFlex]}
                returnKeyType="done"
              />
              <Pressable style={styles.addBtn} onPress={addDarePlayer}>
                <LinearGradient
                  colors={["#A855F7", "#EC4899"]}
                  style={styles.addBtnGradient}
                >
                  <Text style={styles.addBtnText}>+</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>

          {/* Player grid - scrollable */}
          <GlassCard style={{ maxHeight: SCREEN_HEIGHT * 0.38 }}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>OYUNCULAR</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{darePlayerNames.length}</Text>
              </View>
            </View>
            <ShimmerLine />
            {darePlayerNames.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateIcon}>👥</Text>
                <Text style={styles.emptyStateText}>Henüz oyuncu eklenmedi</Text>
                <Text style={styles.emptyStateHint}>Yukarıdan isim ekleyin</Text>
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

          {/* Action buttons - always visible at bottom */}
          <GameButton
            label="Oyunu Başlat"
            onPress={startDareGame}
            disabled={darePlayerNames.length < 2}
          />
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
            <LinearGradient colors={["rgba(168,85,247,0.15)", "rgba(99,102,241,0.08)"]} style={styles.modeCardGlow} />
            <Text style={styles.modeCardEmoji}>🎯</Text>
            <View style={styles.modeCardTextWrap}>
              <Text style={styles.modeCardTitle}>Normal</Text>
              <Text style={styles.modeCardDesc}>Herkes için uygun sorular</Text>
            </View>
          </Pressable>

          <Pressable
            style={styles.modeCard}
            onPress={() => selectMode({ id: "never_girls", label: "Ben Daha Önce Hiç - Kız Kıza" })}
          >
            <LinearGradient colors={["rgba(236,72,153,0.15)", "rgba(244,114,182,0.08)"]} style={styles.modeCardGlow} />
            <Text style={styles.modeCardEmoji}>💕</Text>
            <View style={styles.modeCardTextWrap}>
              <Text style={styles.modeCardTitle}>Kız Kıza</Text>
              <Text style={styles.modeCardDesc}>Sadece kızlar arasında</Text>
            </View>
          </Pressable>
        </View>
      );
    }

    /* ── LOBBY ── */
    if (screen === SCREENS.LOBBY) {
      return (
        <View style={styles.stack}>
          <GlassCard>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>ODA KODU</Text>
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
            <Text style={styles.lobbyHint}>Arkadaşlarınla paylaş</Text>
          </GlassCard>

          <GlassCard>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>OYUNCULAR</Text>
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
            <GameButton label="Oyunu Başlat" onPress={startGame} />
          )}

          {!isOwner && (
            <View style={styles.waitingBox}>
              <Text style={styles.waitingDots}>...</Text>
              <Text style={styles.waitingText}>Host oyunu başlatacak</Text>
            </View>
          )}
        </View>
      );
    }

    /* ── SOLO GAME ── */
    if (screen === SCREENS.SOLO_GAME) {
      const isDareMode = soloModeId === "dare_basic";

      return (
        <View style={styles.gameStack}>
          {isDareMode && currentDarePlayer && (
            <View style={styles.turnBadge}>
              <LinearGradient colors={["rgba(6,182,212,0.2)", "rgba(99,102,241,0.15)"]} style={styles.turnBadgeGradient}>
                <Text style={styles.turnBadgeLabel}>SIRA</Text>
                <Text style={styles.turnBadgeName}>{currentDarePlayer}</Text>
              </LinearGradient>
            </View>
          )}

          <GameCard
            icon={isDareMode ? "🍺" : "🤝"}
            modeId={soloModeId}
            questionKey={soloCurrentQuestion}
            onSwipeLeft={isDareMode ? nextDareQuestion : nextSoloQuestion}
            onSwipeRight={isDareMode ? nextDareQuestion : nextSoloQuestion}
          >
            <Text style={[
              isDareMode ? styles.questionTextDare : styles.questionTextNever,
              soloModeId && CARD_FRAMES[soloModeId] && styles.questionTextOnFrame,
              CARD_TEXT_COLORS[soloModeId] && { color: CARD_TEXT_COLORS[soloModeId].main }
            ]}>
              {soloCurrentQuestion}
            </Text>
            {questionNum > 0 && (
              <Text style={[
                styles.questionCounter,
                soloModeId && CARD_FRAMES[soloModeId] && styles.questionCounterOnFrame,
                CARD_TEXT_COLORS[soloModeId] && { color: CARD_TEXT_COLORS[soloModeId].counter }
              ]}>
                Soru {questionNum}
              </Text>
            )}
          </GameCard>
          <View style={styles.swipeHintWrap}>
            <View style={styles.swipeArrow}><Text style={styles.swipeArrowText}>←</Text></View>
            <Text style={styles.swipeHint}>Kaydır</Text>
            <View style={styles.swipeArrow}><Text style={styles.swipeArrowText}>→</Text></View>
          </View>
        </View>
      );
    }

    /* ── GAME (Multiplayer) ── */
    if (screen === SCREENS.GAME) {
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
                {questionNum > 0 && <Text style={[styles.questionCounter, modeId && CARD_FRAMES[modeId] && styles.questionCounterOnFrame, CARD_TEXT_COLORS[modeId] && { color: CARD_TEXT_COLORS[modeId].counter }]}>Soru {questionNum}</Text>}
              </GameCard>
              <View style={styles.swipeHintWrap}>
                <View style={styles.swipeArrow}><Text style={styles.swipeArrowText}>←</Text></View>
                <Text style={styles.swipeHint}>Kaydır</Text>
                <View style={styles.swipeArrow}><Text style={styles.swipeArrowText}>→</Text></View>
              </View>
            </>
          )}

          {isNever && phase === "reveal" && revealItem && (
            <GlassCard>
              <Text style={styles.sectionLabel}>SONUÇLAR</Text>
              <ShimmerLine />
              <View style={styles.revealStage}>
                <Animated.Text style={[styles.revealText, { transform: [{ translateX: revealX }] }]}>
                  {revealItem.name}: {revealItem.answer === "did" ? "Yaptım ✅" : "Yapmadım ❌"}
                </Animated.Text>
              </View>
            </GlassCard>
          )}

          {isDareBasic && phase === "question" && (
            <>
              {currentTurnPlayerName && (
                <View style={styles.turnBadge}>
                  <LinearGradient colors={["rgba(6,182,212,0.2)", "rgba(99,102,241,0.15)"]} style={styles.turnBadgeGradient}>
                    <Text style={styles.turnBadgeLabel}>SIRA</Text>
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
                {questionNum > 0 && <Text style={[styles.questionCounter, modeId && CARD_FRAMES[modeId] && styles.questionCounterOnFrame, CARD_TEXT_COLORS[modeId] && { color: CARD_TEXT_COLORS[modeId].counter }]}>Soru {questionNum}</Text>}
              </GameCard>
              <View style={styles.swipeHintWrap}>
                <View style={styles.swipeArrow}><Text style={styles.swipeArrowText}>←</Text></View>
                <Text style={styles.swipeHint}>Kaydır</Text>
                <View style={styles.swipeArrow}><Text style={styles.swipeArrowText}>→</Text></View>
              </View>
            </>
          )}

          {isChallenger && phase === "question" && (
            <>
              {currentTurnPlayerName && (
                <View style={styles.turnBadge}>
                  <LinearGradient colors={["rgba(6,182,212,0.2)", "rgba(99,102,241,0.15)"]} style={styles.turnBadgeGradient}>
                    <Text style={styles.turnBadgeLabel}>SIRA</Text>
                    <Text style={styles.turnBadgeName}>{currentTurnPlayerName}</Text>
                  </LinearGradient>
                </View>
              )}

              <GameCard icon="⚡" modeId={modeId} questionKey={question}>
                <Text style={[styles.questionTextDare, modeId && CARD_FRAMES[modeId] && styles.questionTextOnFrame, CARD_TEXT_COLORS[modeId] && { color: CARD_TEXT_COLORS[modeId].main }]}>{question}</Text>
                {questionNum > 0 && <Text style={[styles.questionCounter, modeId && CARD_FRAMES[modeId] && styles.questionCounterOnFrame, CARD_TEXT_COLORS[modeId] && { color: CARD_TEXT_COLORS[modeId].counter }]}>Soru {questionNum}</Text>}
              </GameCard>

              {questionType === "vote" && (
                <GlassCard>
                  <Text style={styles.sectionLabel}>OY VER</Text>
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
                          {p.name}{p.id === myId ? " (Ben)" : ""}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                  <GameButton label="Oyu Gönder" onPress={submitVote} disabled={!selectedVoteTarget} />
                </GlassCard>
              )}

              {questionType === "input_number" && (
                <GlassCard>
                  <Text style={styles.sectionLabel}>SAYINI GIR</Text>
                  <ShimmerLine />
                  <TextInput
                    placeholder="0"
                    placeholderTextColor="#52525B"
                    value={inputNumber}
                    onChangeText={setInputNumber}
                    keyboardType="numeric"
                    style={styles.input}
                  />
                  <GameButton label="Gönder" onPress={submitInput} disabled={!inputNumber} />
                </GlassCard>
              )}

              {questionType === "target_select" && isMyTurn && (
                <GlassCard>
                  <Text style={styles.sectionLabel}>BIRINI SEÇ</Text>
                  <ShimmerLine />
                  {playerEntries.filter((p) => p.id !== myId).map((p) => (
                    <GameButton key={p.id} label={p.name} onPress={() => submitTarget(p.id)} variant="secondary" />
                  ))}
                </GlassCard>
              )}

              {questionType === "target_select" && !isMyTurn && (
                <View style={styles.waitingBox}>
                  <Text style={styles.waitingDots}>...</Text>
                  <Text style={styles.waitingText}>{currentTurnPlayerName || "Sıradaki oyuncu"} seçim yapıyor</Text>
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
                    <Text style={styles.questionEyebrow}>SONUÇ</Text>
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
      <PremiumBackground />
      <View style={[styles.page, useCompactCard && styles.pageCentered]}>

        {screen !== SCREENS.HOME && (
          <Pressable
            style={styles.backButton}
            onPress={() => {
              if (screen === SCREENS.SOLO_GAME) {
                if (soloModeId === "dare_basic") exitDareGame();
                else exitSoloGame();
              } else if (screen === SCREENS.DARE_SETUP) {
                navigateTo(SCREENS.MODE_MAIN);
              } else if (screen === SCREENS.MODE_MAIN) {
                navigateTo(SCREENS.HOME);
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

        {(screen === SCREENS.GAME || screen === SCREENS.SOLO_GAME) && modeLabel && (
          <View style={styles.modeTag}>
            <BlurView intensity={20} tint="dark" style={styles.modeTagBlur}>
              <Text style={styles.modeTagText}>{modeLabel}</Text>
            </BlurView>
          </View>
        )}

        {screen !== SCREENS.GAME && screen !== SCREENS.SOLO_GAME && (
          <View style={[styles.header, screen !== SCREENS.HOME && styles.headerWithBack]}>
            {screen === SCREENS.HOME && (
              <View style={styles.logoWrap}>
                <Image source={require("./assets/logoshot.jpeg")} style={styles.logoImage} />
                <View style={styles.logoGlow} />
              </View>
            )}
            <Text style={styles.title}>{headerTitle}</Text>
            <Text style={styles.subtitle}>{headerSubtitle}</Text>
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
    </SafeAreaView>
  );
}

/* ── Splash Screen ── */
function SplashScreen({ onFinish }) {
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(30)).current;
  const fadeOut = useRef(new Animated.Value(1)).current;
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(300),
      // Logo yoktan var oluyor
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
      // Shimmer efekti
      Animated.timing(shimmer, { toValue: 1, duration: 600, useNativeDriver: true }),
      // Title beliriyor
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(titleTranslateY, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
      ]),
      // Biraz bekle
      Animated.delay(500),
      // Fade out
      Animated.timing(fadeOut, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start(() => onFinish());
  }, []);

  const shimmerTranslateX = shimmer.interpolate({ inputRange: [0, 1], outputRange: [-200, 200] });

  return (
    <Animated.View style={[splashStyles.container, { opacity: fadeOut }]}>

      {/* Logo - tam genişlik, kırpmadan, ortada */}
      <Animated.View style={[splashStyles.logoContainer, { transform: [{ scale: logoScale }], opacity: logoOpacity }]}>
        <Image source={require("./assets/logoshot.jpeg")} style={splashStyles.logoImage} resizeMode="contain" />
        {/* Üst kenar eritme */}
        <LinearGradient
          colors={["#000000", "transparent"]}
          style={splashStyles.edgeFadeTop}
          pointerEvents="none"
        />
        {/* Alt kenar eritme */}
        <LinearGradient
          colors={["transparent", "#000000"]}
          style={splashStyles.edgeFadeBottom}
          pointerEvents="none"
        />
        {/* Shimmer */}
        <Animated.View style={[splashStyles.shimmerOverlay, { transform: [{ translateX: shimmerTranslateX }] }]}>
          <LinearGradient
            colors={["transparent", "rgba(255,255,255,0.15)", "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </Animated.View>

      {/* Title */}
      <Animated.Text style={[splashStyles.title, { opacity: titleOpacity, transform: [{ translateY: titleTranslateY }] }]}>
        Hadi partiye başlayalım
      </Animated.Text>
    </Animated.View>
  );
}

const splashStyles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    backgroundColor: "#000000",
  },
  logoContainer: {
    width: "100%",
    aspectRatio: 1,
    position: "relative",
  },
  logoImage: {
    width: "100%",
    height: "100%",
  },
  edgeFadeTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "20%",
  },
  edgeFadeBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "20%",
  },
  shimmerOverlay: {
    ...StyleSheet.absoluteFillObject,
    width: SCREEN_WIDTH + 100,
  },
  title: {
    position: "absolute",
    bottom: SCREEN_HEIGHT * 0.1,
    fontSize: 18,
    fontWeight: "600",
    color: "rgba(255,255,255,0.5)",
    letterSpacing: 1,
  },
});

export default function App() {
  const [splashDone, setSplashDone] = useState(false);

  return (
    <ErrorBoundary>
      {!splashDone && <SplashScreen onFinish={() => setSplashDone(true)} />}
      {splashDone && <AppContent />}
    </ErrorBoundary>
  );
}

/* ══════════════ STYLES ══════════════ */
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#050507" },
  page: { flex: 1, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 },
  pageCentered: { justifyContent: "center" },

  /* Glow orbs */
  glowOrb: { position: "absolute", borderRadius: 999 },
  glowOrb1: { top: -80, right: -60, width: 280, height: 280, backgroundColor: "#EC4899" },
  glowOrb2: { bottom: -100, left: -80, width: 320, height: 320, backgroundColor: "#8B5CF6" },
  glowOrb3: { top: "40%", left: "30%", width: 200, height: 200, backgroundColor: "#06B6D4" },

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
  logoImage: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: "rgba(236,72,153,0.3)" },
  logoGlow: { position: "absolute", width: 140, height: 140, borderRadius: 70, backgroundColor: "rgba(236,72,153,0.1)" },
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
