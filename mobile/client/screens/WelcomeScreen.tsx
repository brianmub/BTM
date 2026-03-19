import React from "react";
import { View, StyleSheet, Dimensions, ImageBackground } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { OnboardingStackParamList } from "@/navigation/OnboardingStackNavigator";

const { width, height } = Dimensions.get("window");

type Props = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, "Welcome">;
};

export default function WelcomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const handleGetStarted = () => {
    navigation.navigate("JoinCode" as any);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#DA291C", "#8B0000", "#0D0D0D"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      />

      <View style={styles.patternOverlay}>
        {[...Array(20)].map((_, i) => (
          <View
            key={i}
            style={[
              styles.patternLine,
              {
                top: `${i * 5}%`,
                opacity: 0.03 + (i * 0.005),
              },
            ]}
          />
        ))}
      </View>

      <View
        style={[
          styles.content,
          { paddingTop: insets.top + Spacing["6xl"], paddingBottom: insets.bottom + Spacing.xl },
        ]}
      >
        <Animated.View
          entering={FadeInDown.delay(200).duration(800)}
          style={styles.logoContainer}
        >
          <View style={styles.logoCircle}>
            <View style={styles.logoInner}>
              <Feather name="shield" size={48} color="#DA291C" />
            </View>
          </View>
        </Animated.View>

        <View style={styles.textContainer}>
          <Animated.View entering={FadeInUp.delay(400).duration(600)}>
            <ThemedText type="h1" style={styles.title}>
              BTM
            </ThemedText>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(500).duration(600)}>
            <ThemedText type="h3" style={styles.tagline}>
              BASIC TRAINING FOR MINISTRY
            </ThemedText>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(600).duration(600)}>
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <View style={styles.dividerDiamond} />
              <View style={styles.dividerLine} />
            </View>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(700).duration(600)}>
            <ThemedText type="body" style={styles.subtitle}>
              Train. Lead. Transform.
            </ThemedText>
          </Animated.View>
        </View>

        <Animated.View
          entering={FadeInUp.delay(800).duration(600)}
          style={styles.buttonContainer}
        >
          <Button onPress={handleGetStarted} style={styles.button}>
            Enter
          </Button>

          <View style={styles.featureRow}>
            <View style={styles.featureItem}>
              <Feather name="users" size={16} color="#FFD700" />
              <ThemedText type="small" style={styles.featureText}>Cell Groups</ThemedText>
            </View>
            <View style={styles.featureItem}>
              <Feather name="calendar" size={16} color="#FFD700" />
              <ThemedText type="small" style={styles.featureText}>Sessions</ThemedText>
            </View>
            <View style={styles.featureItem}>
              <Feather name="award" size={16} color="#FFD700" />
              <ThemedText type="small" style={styles.featureText}>Graduate</ThemedText>
            </View>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D0D0D",
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  patternOverlay: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  patternLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "#FFFFFF",
    transform: [{ rotate: "-45deg" }, { scaleX: 2 }],
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    justifyContent: "space-between",
  },
  logoContainer: {
    alignItems: "center",
    marginTop: Spacing["4xl"],
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#DA291C",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  logoInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#DA291C",
  },
  textContainer: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 64,
    fontWeight: "800",
    color: "#0D0D0D",
    textAlign: "center",
    letterSpacing: 8,
    textShadowColor: "rgba(218, 41, 28, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  tagline: {
    color: "#FFD700",
    textAlign: "center",
    letterSpacing: 4,
    marginTop: Spacing.md,
    fontWeight: "600",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: Spacing["2xl"],
  },
  dividerLine: {
    width: 60,
    height: 2,
    backgroundColor: "#DA291C",
  },
  dividerDiamond: {
    width: 10,
    height: 10,
    backgroundColor: "#FFD700",
    transform: [{ rotate: "45deg" }],
    marginHorizontal: Spacing.md,
  },
  subtitle: {
    color: "#A0A0A0",
    textAlign: "center",
    fontSize: 18,
    letterSpacing: 2,
  },
  buttonContainer: {
    paddingHorizontal: Spacing.lg,
  },
  button: {
    width: "100%",
    height: 60,
  },
  featureRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: Spacing["2xl"],
    paddingVertical: Spacing.lg,
  },
  featureItem: {
    alignItems: "center",
    gap: Spacing.xs,
  },
  featureText: {
    color: "#A0A0A0",
    fontSize: 12,
  },
});
