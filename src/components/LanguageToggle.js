import { useRef, useState } from "react";
import { Animated, Easing, Pressable, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { BlurView } from "expo-blur";

export default function LanguageToggle({ language, onSelect }) {
  const flags = { tr: '🇹🇷', en: '🇬🇧', de: '🇩🇪' };
  const labels = { tr: 'TR', en: 'EN', de: 'DE' };
  const langs = ['tr', 'en', 'de'];
  const [open, setOpen] = useState(false);
  const menuAnim = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  const toggleMenu = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.85, duration: 80, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, speed: 20, bounciness: 12, useNativeDriver: true }),
    ]).start();
    if (open) {
      Animated.timing(menuAnim, { toValue: 0, duration: 150, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(() => setOpen(false));
    } else {
      setOpen(true);
      Animated.spring(menuAnim, { toValue: 1, speed: 16, bounciness: 8, useNativeDriver: true }).start();
    }
  };

  const pickLang = (lang) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onSelect(lang);
    Animated.timing(menuAnim, { toValue: 0, duration: 150, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(() => setOpen(false));
  };

  const menuOpacity = menuAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const menuTranslateY = menuAnim.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] });
  const menuScale = menuAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] });

  return (
    <View style={{ position: 'absolute', top: 60, right: 20, zIndex: 20, alignItems: 'flex-end' }}>
      <Pressable onPress={toggleMenu}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <BlurView intensity={30} tint="dark" style={{ borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, gap: 6 }}>
              <Text style={{ fontSize: 18 }}>{flags[language]}</Text>
              <Text style={{ color: '#A1A1AA', fontSize: 12, fontWeight: '800', letterSpacing: 0.5 }}>{labels[language]}</Text>
            </View>
          </BlurView>
        </Animated.View>
      </Pressable>

      {open && (
        <Animated.View style={{ marginTop: 6, opacity: menuOpacity, transform: [{ translateY: menuTranslateY }, { scale: menuScale }] }}>
          <BlurView intensity={50} tint="dark" style={{ borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
            {langs.map((lang) => (
              <Pressable
                key={lang}
                onPress={() => pickLang(lang)}
                style={({ pressed }) => ({
                  flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, gap: 8,
                  backgroundColor: lang === language ? 'rgba(236,72,153,0.15)' : pressed ? 'rgba(255,255,255,0.05)' : 'transparent',
                })}
              >
                <Text style={{ fontSize: 20 }}>{flags[lang]}</Text>
                <Text style={{ color: lang === language ? '#F472B6' : '#A1A1AA', fontSize: 13, fontWeight: '700', width: 24 }}>{labels[lang]}</Text>
                {lang === language && <Text style={{ color: '#EC4899', fontSize: 14, fontWeight: '800' }}>✓</Text>}
              </Pressable>
            ))}
          </BlurView>
        </Animated.View>
      )}
    </View>
  );
}
