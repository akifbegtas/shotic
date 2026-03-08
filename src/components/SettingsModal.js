import { useRef, useState } from "react";
import { Animated, Easing, Modal, Pressable, Text, View, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";

const LANGUAGES = [
  { code: "tr", flag: "🇹🇷", label: "Türkçe" },
  { code: "en", flag: "🇬🇧", label: "English" },
  { code: "de", flag: "🇩🇪", label: "Deutsch" },
];

export default function SettingsModal({ visible, onClose, language, onSelectLanguage, t }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const [langOpen, setLangOpen] = useState(false);
  const dropAnim = useRef(new Animated.Value(0)).current;

  const currentLang = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  const onShow = () => {
    setLangOpen(false);
    dropAnim.setValue(0);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, speed: 18, bounciness: 6, useNativeDriver: true }),
    ]).start();
  };

  const close = () => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 150, easing: Easing.in(Easing.cubic), useNativeDriver: true })
      .start(() => onClose());
  };

  const toggleLang = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (langOpen) {
      Animated.timing(dropAnim, { toValue: 0, duration: 150, easing: Easing.in(Easing.cubic), useNativeDriver: false }).start(() => setLangOpen(false));
    } else {
      setLangOpen(true);
      Animated.spring(dropAnim, { toValue: 1, speed: 16, bounciness: 6, useNativeDriver: false }).start();
    }
  };

  const pickLang = (code) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onSelectLanguage(code);
    Animated.timing(dropAnim, { toValue: 0, duration: 150, easing: Easing.in(Easing.cubic), useNativeDriver: false }).start(() => setLangOpen(false));
  };

  const dropHeight = dropAnim.interpolate({ inputRange: [0, 1], outputRange: [0, LANGUAGES.length * 48] });
  const dropOpacity = dropAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0.5, 1] });

  return (
    <Modal visible={visible} transparent animationType="none" onShow={onShow} onRequestClose={close}>
      <Pressable style={s.overlay} onPress={close}>
        <Animated.View style={[s.backdrop, { opacity: fadeAnim }]} />
        <Animated.View style={[s.card, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <BlurView intensity={60} tint="dark" style={s.blur}>
              {/* Header */}
              <View style={s.header}>
                <Text style={s.title}>⚙️ {t?.("settings.title") || "Ayarlar"}</Text>
                <Pressable onPress={close} style={s.closeBtn}>
                  <Text style={s.closeTxt}>✕</Text>
                </Pressable>
              </View>

              {/* Language row */}
              <Pressable style={s.row} onPress={toggleLang}>
                <Text style={s.rowLabel}>{t?.("settings.language") || "Dil"}</Text>
                <View style={s.rowRight}>
                  <Text style={s.rowValue}>{currentLang.flag} {currentLang.label}</Text>
                  <Text style={[s.rowChevron, langOpen && s.rowChevronOpen]}>›</Text>
                </View>
              </Pressable>

              {/* Language dropdown */}
              <Animated.View style={[s.dropdown, { height: dropHeight, opacity: dropOpacity }]}>
                {LANGUAGES.map((lang) => {
                  const active = lang.code === language;
                  return (
                    <Pressable key={lang.code} onPress={() => pickLang(lang.code)} style={[s.dropItem, active && s.dropItemActive]}>
                      <Text style={s.dropFlag}>{lang.flag}</Text>
                      <Text style={[s.dropLabel, active && s.dropLabelActive]}>{lang.label}</Text>
                      {active && <Text style={s.dropCheck}>✓</Text>}
                    </Pressable>
                  );
                })}
              </Animated.View>

            </BlurView>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  card: {
    width: "78%",
    maxWidth: 320,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  blur: {
    padding: 20,
    borderRadius: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    color: "#FAFAFA",
    fontSize: 17,
    fontWeight: "800",
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeTxt: {
    color: "#A1A1AA",
    fontSize: 14,
    fontWeight: "600",
  },

  /* Settings row */
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  rowLabel: {
    color: "#D4D4D8",
    fontSize: 15,
    fontWeight: "600",
  },
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  rowValue: {
    color: "#A1A1AA",
    fontSize: 14,
    fontWeight: "600",
  },
  rowChevron: {
    color: "#71717A",
    fontSize: 20,
    fontWeight: "600",
    transform: [{ rotate: "90deg" }],
  },
  rowChevronOpen: {
    transform: [{ rotate: "270deg" }],
  },

  /* Dropdown */
  dropdown: {
    overflow: "hidden",
    marginTop: 4,
    borderRadius: 12,
  },
  dropItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    height: 48,
    gap: 10,
  },
  dropItemActive: {
    backgroundColor: "rgba(236,72,153,0.1)",
  },
  dropFlag: {
    fontSize: 20,
  },
  dropLabel: {
    color: "#A1A1AA",
    fontSize: 14,
    fontWeight: "700",
    flex: 1,
  },
  dropLabelActive: {
    color: "#F472B6",
  },
  dropCheck: {
    color: "#EC4899",
    fontSize: 16,
    fontWeight: "800",
  },
});
