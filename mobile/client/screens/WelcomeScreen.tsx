import React from "react";
import { View, StyleSheet, Dimensions, ImageBackground, Pressable } from "react-native";
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

  const handleSignIn = () => {
    // Navigate to Login (usually via navigation.getParent() or direct navigate)
    navigation.navigate("Login" as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: '#0D0D0D' }]}>
      <View
        style={[
          styles.content,
          { paddingTop: insets.top + Spacing.xl, paddingBottom: insets.bottom + Spacing.xl },
        ]}
      >
        <View style={styles.textContainer}>
          <Animated.View entering={FadeInDown.delay(100).duration(800)} style={{ alignItems: 'center', marginBottom: Spacing.xl }}>
            <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: theme.link + '20', alignItems: 'center', justifyContent: 'center' }}>
              <Feather name="shield" size={48} color={theme.link} />
            </View>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(200).duration(800)}>
            <ThemedText type="h1" style={styles.title}>
              BE THAT MAN
            </ThemedText>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(600).duration(800)}>
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
            Join
          </Button>

          <View style={{ marginTop: Spacing.md, alignItems: 'center' }}>
            <Pressable onPress={handleSignIn}>
              <ThemedText type="body" style={{ color: '#A0A0A0', textDecorationLine: 'underline' }}>
                Already have an account? Sign In
              </ThemedText>
            </Pressable>
          </View>

          <View style={styles.featureRow}>
            <View style={styles.featureItem}>
              <Feather name="users" size={16} color="#A0A0A0" />
              <ThemedText type="small" style={styles.featureText}>Cell Groups</ThemedText>
            </View>
            <View style={styles.featureItem}>
              <Feather name="calendar" size={16} color="#A0A0A0" />
              <ThemedText type="small" style={styles.featureText}>Sessions</ThemedText>
            </View>
            <View style={styles.featureItem}>
              <Feather name="award" size={16} color="#A0A0A0" />
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
    fontSize: 42,
    fontWeight: "900",
    color: "#DA291C",
    textAlign: "center",
    letterSpacing: 2,
    lineHeight: 52,
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
