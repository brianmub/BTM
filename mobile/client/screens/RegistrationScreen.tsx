import React, { useState } from "react";
import { View, StyleSheet, TextInput, Pressable, Alert, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInUp } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { OnboardingStackParamList } from "@/navigation/OnboardingStackNavigator";
import { UserRole, Gender, MaritalStatus, User } from "@/lib/storage";

type Props = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, "Registration">;
  route: RouteProp<OnboardingStackParamList, "Registration">;
};

import { storage as dataStorage } from "@/lib/storage";

interface FormData {
  fullName: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  gender: Gender | null;
  maritalStatus: MaritalStatus | null;
}

function SelectButton({
// ... existing code ...
  label,
  isSelected,
  onPress,
}: {
  label: string;
  isSelected: boolean;
  onPress: () => void;
}) {
  const { theme } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.selectButton,
        {
          backgroundColor: isSelected ? theme.primary : "transparent",
          borderColor: isSelected ? theme.primary : theme.border,
        },
      ]}
    >
      <ThemedText
        type="body"
        style={{ 
          color: "#FFFFFF",
          fontWeight: isSelected ? "600" : "400",
        }}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}

export default function RegistrationScreen({ navigation, route }: Props) {
  const { role } = route.params;
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { login, completeOnboarding } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState<FormData>({
    fullName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    gender: null,
    maritalStatus: null,
  });

  const isFormValid =
    form.fullName.trim().length > 0 &&
    form.phone.trim().length > 0 &&
    form.email.trim().length > 0 &&
    form.password.length >= 6 &&
    form.password === form.confirmPassword &&
    form.gender !== null &&
    form.maritalStatus !== null;

  const handleSubmit = async () => {
    if (!isFormValid) {
      Alert.alert("Missing Information", "Please fill in all required fields.");
      return;
    }

    setIsLoading(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      const createdUser = await dataStorage.signup({
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        password: form.password,
        gender: form.gender!,
        maritalStatus: form.maritalStatus!,
        role: role,
        organizationId: route.params.organizationId,
      });

      await login(createdUser);
      // navigation.reset or similar call depends on useAuth behavior
      // For now, follow the existing flow but using signup
      await completeOnboarding();
    } catch (error) {
      Alert.alert("Error", "Failed to create your account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleTitle = (r: UserRole): string => {
    switch (r) {
      case "participant":
        return "Participant";
      case "leader":
        return "Cell Leader";
      case "facilitator":
        return "Facilitator";
      default:
        return "Participant";
    }
  };

  const getRoleIcon = (r: UserRole): keyof typeof Feather.glyphMap => {
    switch (r) {
      case "participant":
        return "user";
      case "leader":
        return "users";
      case "facilitator":
        return "edit-3";
      default:
        return "user";
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

      <KeyboardAwareScrollViewCompat
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing["3xl"], paddingBottom: insets.bottom + Spacing["3xl"] },
        ]}
      >
        <Animated.View entering={FadeInUp.delay(50).duration(500)}>
          <View style={styles.header}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Feather name="arrow-left" size={24} color="#FFFFFF" />
            </Pressable>
            <ThemedText type="h2" style={styles.headerTitle}>
              Register
            </ThemedText>
            <View style={styles.placeholder} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(100).duration(500)}>
          <View style={styles.roleBadge}>
            <LinearGradient
              colors={["rgba(218, 41, 28, 0.2)", "rgba(218, 41, 28, 0.1)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <Feather name={getRoleIcon(role)} size={18} color={theme.primary} />
            <ThemedText type="body" style={{ color: "#FFFFFF", marginLeft: Spacing.sm }}>
              {getRoleTitle(role)}
            </ThemedText>
          </View>
        </Animated.View>

        <View style={styles.form}>
          <Animated.View entering={FadeInUp.delay(150).duration(500)} style={styles.inputGroup}>
            <ThemedText type="small" style={styles.label}>
              Full Name
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: form.fullName ? theme.primary : theme.border,
                },
              ]}
              placeholder="Enter your full name"
              placeholderTextColor="#666666"
              value={form.fullName}
              onChangeText={(text) => setForm({ ...form, fullName: text })}
              autoCapitalize="words"
            />
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(200).duration(500)} style={styles.inputGroup}>
            <ThemedText type="small" style={styles.label}>
              Phone Number
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: form.phone ? theme.primary : theme.border,
                },
              ]}
              placeholder="Enter your phone number"
              placeholderTextColor="#666666"
              value={form.phone}
              onChangeText={(text) => setForm({ ...form, phone: text })}
              keyboardType="phone-pad"
            />
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(250).duration(500)} style={styles.inputGroup}>
            <ThemedText type="small" style={styles.label}>
              Email Address
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: form.email ? theme.primary : theme.border,
                },
              ]}
              placeholder="Enter your email"
              placeholderTextColor="#666666"
              value={form.email}
              onChangeText={(text) => setForm({ ...form, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(275).duration(500)} style={styles.inputGroup}>
            <ThemedText type="small" style={styles.label}>
              Password (min 6 characters)
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: form.password ? theme.primary : theme.border,
                },
              ]}
              placeholder="Enter your password"
              placeholderTextColor="#666666"
              value={form.password}
              onChangeText={(text) => setForm({ ...form, password: text })}
              secureTextEntry
            />
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(300).duration(500)} style={styles.inputGroup}>
            <ThemedText type="small" style={styles.label}>
              Confirm Password
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: form.confirmPassword ? (form.password === form.confirmPassword ? theme.primary : "#DA291C") : theme.border,
                },
              ]}
              placeholder="Confirm your password"
              placeholderTextColor="#666666"
              value={form.confirmPassword}
              onChangeText={(text) => setForm({ ...form, confirmPassword: text })}
              secureTextEntry
            />
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(325).duration(500)} style={styles.inputGroup}>
            <ThemedText type="small" style={styles.label}>
              Gender
            </ThemedText>
            <View style={styles.selectRow}>
              <SelectButton
                label="Male"
                isSelected={form.gender === "male"}
                onPress={() => {
                  Haptics.selectionAsync();
                  setForm({ ...form, gender: "male" });
                }}
              />
              <SelectButton
                label="Female"
                isSelected={form.gender === "female"}
                onPress={() => {
                  Haptics.selectionAsync();
                  setForm({ ...form, gender: "female" });
                }}
              />
            </View>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(350).duration(500)} style={styles.inputGroup}>
            <ThemedText type="small" style={styles.label}>
              Marital Status
            </ThemedText>
            <View style={styles.selectRow}>
              <SelectButton
                label="Married"
                isSelected={form.maritalStatus === "married"}
                onPress={() => {
                  Haptics.selectionAsync();
                  setForm({ ...form, maritalStatus: "married" });
                }}
              />
              <SelectButton
                label="Unmarried"
                isSelected={form.maritalStatus === "unmarried"}
                onPress={() => {
                  Haptics.selectionAsync();
                  setForm({ ...form, maritalStatus: "unmarried" });
                }}
              />
            </View>
          </Animated.View>

          {role === "leader" ? (
            <Animated.View entering={FadeInUp.delay(400).duration(500)}>
              <View style={styles.pendingNotice}>
                <Feather name="info" size={18} color="#FFD700" />
                <ThemedText
                  type="small"
                  style={{ color: theme.textSecondary, marginLeft: Spacing.sm, flex: 1 }}
                >
                  Your Cell Leader registration will require approval from an administrator.
                </ThemedText>
              </View>
            </Animated.View>
          ) : null}
        </View>

        <Animated.View entering={FadeInUp.delay(450).duration(500)} style={styles.buttonContainer}>
          <Button
            onPress={handleSubmit}
            disabled={!isFormValid || isLoading}
            style={styles.button}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              "Complete Registration"
            )}
          </Button>
        </Animated.View>
      </KeyboardAwareScrollViewCompat>
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
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.xl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing["2xl"],
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#FFFFFF",
  },
  placeholder: {
    width: 44,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing["3xl"],
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(218, 41, 28, 0.3)",
  },
  form: {
    gap: Spacing.xl,
  },
  inputGroup: {
    gap: Spacing.sm,
  },
  label: {
    color: "#FFFFFF",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    fontSize: 12,
  },
  input: {
    height: 56,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    fontSize: 16,
    backgroundColor: "#1A1A1A",
    color: "#FFFFFF",
  },
  selectRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  selectButton: {
    flex: 1,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
  },
  pendingNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: Spacing.lg,
    borderRadius: BorderRadius.xs,
    marginTop: Spacing.sm,
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.2)",
  },
  buttonContainer: {
    marginTop: Spacing["3xl"],
  },
  button: {
    width: "100%",
    height: 56,
  },
});
