import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  Dimensions,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { storage } from "@/lib/storage";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { OnboardingStackParamList } from "@/navigation/OnboardingStackNavigator";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";

const { width } = Dimensions.get("window");

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList, "JoinCode">;

export default function JoinCodeScreen() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const handleValidateCode = async () => {
    if (code.length !== 6) {
      Alert.alert("Invalid Code", "Please enter a 6-character organization code.");
      return;
    }

    setLoading(true);
    try {
      const org = await storage.validateJoinCode(code);
      if (org) {
        navigation.navigate("RoleSelection", { organizationId: org.id, organizationName: org.name });
      } else {
        Alert.alert("Error", "Could not find an organization with that code.");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to validate code. Please try again.");
    } finally {
      setLoading(false);
    }
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

      <StatusBar style="light" />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <SafeAreaView style={styles.safeArea}>
            <Animated.View
              entering={FadeInDown.delay(200).duration(800)}
              style={styles.header}
            >
              <View style={styles.iconCircle}>
                <Feather name="hash" size={32} color="#DA291C" />
              </View>
              <ThemedText type="h1" style={styles.title}>
                Join Organization
              </ThemedText>
              <ThemedText style={styles.subtitle}>
                Enter the 6-character code provided by your organization to get started.
              </ThemedText>
            </Animated.View>

            <Animated.View
              entering={FadeInUp.delay(400).duration(800)}
              style={styles.form}
            >
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, { borderColor: code.length === 6 ? "#FFD700" : "rgba(255,255,255,0.1)" }]}
                  placeholder="000000"
                  placeholderTextColor="rgba(255,255,255,0.2)"
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={6}
                  value={code}
                  onChangeText={(text) => setCode(text.toUpperCase())}
                />
                <View style={styles.inputLabelContainer}>
                  <ThemedText type="small" style={styles.inputLabel}>
                    ORGANIZATION CODE
                  </ThemedText>
                </View>
              </View>

              <Button
                onPress={handleValidateCode}
                loading={loading}
                disabled={code.length !== 6 || loading}
                style={styles.button}
              >
                Continue
              </Button>

              <Pressable
                onPress={() => navigation.goBack()}
                style={({ pressed }) => [styles.backButton, { opacity: pressed ? 0.7 : 1 }]}
              >
                <ThemedText style={styles.backButtonText}>Back to Welcome</ThemedText>
              </Pressable>
            </Animated.View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
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
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing["4xl"],
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
    shadowColor: "#DA291C",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  title: {
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: Spacing.md,
    fontSize: 32,
    fontWeight: "800",
  },
  subtitle: {
    color: "#A0A0A0",
    textAlign: "center",
    fontSize: 16,
    lineHeight: 24,
    paddingHorizontal: Spacing.xl,
  },
  form: {
    width: "100%",
    gap: Spacing.xl,
  },
  inputWrapper: {
    position: "relative",
    marginBottom: Spacing.md,
  },
  input: {
    height: 70,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 8,
    paddingTop: 10,
  },
  inputLabelContainer: {
    position: "absolute",
    top: -10,
    left: 20,
    backgroundColor: "#8B0000",
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  inputLabel: {
    color: "#FFD700",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
  button: {
    width: "100%",
    height: 60,
  },
  backButton: {
    marginTop: Spacing.sm,
  },
  backButtonText: {
    color: "#A0A0A0",
    fontSize: 14,
    textDecorationLine: "underline",
  },
});
