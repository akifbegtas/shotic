import { StatusBar } from "expo-status-bar";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { useMemo, useState } from "react";

const SCREENS = {
  HOME: "home",
  NEVER_HAVE_I_EVER: "neverHaveIEver",
  DO_OR_DRINK: "doOrDrink"
};

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
      <Text
        style={[
          styles.buttonText,
          variant === "secondary" ? styles.secondaryButtonText : styles.primaryButtonText
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function App() {
  const [screen, setScreen] = useState(SCREENS.HOME);

  const title = useMemo(() => {
    if (screen === SCREENS.NEVER_HAVE_I_EVER) return "Ben Daha Once Hic";
    if (screen === SCREENS.DO_OR_DRINK) return "Yap Ya Da Ic";
    return "Shot Oyunu";
  }, [screen]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.page}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>Es zamanli lobi altyapisi sonraki adimda eklenecek.</Text>

        {screen === SCREENS.HOME && (
          <View style={styles.stack}>
            <GameButton label="Ben Daha Once Hic" onPress={() => setScreen(SCREENS.NEVER_HAVE_I_EVER)} />
            <GameButton label="Yap Ya Da Ic" onPress={() => setScreen(SCREENS.DO_OR_DRINK)} variant="secondary" />
          </View>
        )}

        {screen === SCREENS.NEVER_HAVE_I_EVER && (
          <View style={styles.stack}>
            <GameButton label="KizKiza Modu" onPress={() => {}} />
            <GameButton label="Normal Mod" onPress={() => {}} variant="secondary" />
            <GameButton label="Geri Don" onPress={() => setScreen(SCREENS.HOME)} />
          </View>
        )}

        {screen === SCREENS.DO_OR_DRINK && (
          <View style={styles.stack}>
            <Text style={styles.placeholderText}>Bu modun kart ve kurallari sonraki adimda eklenecek.</Text>
            <GameButton label="Geri Don" onPress={() => setScreen(SCREENS.HOME)} />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC"
  },
  page: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 36
  },
  title: {
    fontSize: 34,
    fontWeight: "800",
    color: "#0F172A"
  },
  subtitle: {
    marginTop: 10,
    marginBottom: 28,
    fontSize: 14,
    lineHeight: 20,
    color: "#334155"
  },
  stack: {
    gap: 12
  },
  button: {
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 2
  },
  primaryButton: {
    backgroundColor: "#0F172A",
    borderColor: "#0F172A"
  },
  secondaryButton: {
    backgroundColor: "#E2E8F0",
    borderColor: "#CBD5E1"
  },
  buttonText: {
    textAlign: "center",
    fontWeight: "700",
    fontSize: 17
  },
  primaryButtonText: {
    color: "#F8FAFC"
  },
  secondaryButtonText: {
    color: "#0F172A"
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.92
  },
  placeholderText: {
    fontSize: 15,
    color: "#334155",
    marginBottom: 6
  }
});
