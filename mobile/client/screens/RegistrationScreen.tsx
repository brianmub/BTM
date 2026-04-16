import React, { useMemo, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  Modal,
  FlatList,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeInUp, FadeIn, useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { useToast } from "@/contexts/ToastContext";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { OnboardingStackParamList } from "@/navigation/OnboardingStackNavigator";
import { UserRole, Gender, MaritalStatus } from "@/lib/storage";
import { storage as dataStorage } from "@/lib/storage";
import { ZIM_CHURCHES } from "@/constants/churches";

// ─── Country Codes ───────────────────────────────────────────────────────────
const COUNTRY_CODES = [
  { flag: "🇿🇼", code: "+263", country: "Zimbabwe" },
  { flag: "🇿🇦", code: "+27",  country: "South Africa" },
  { flag: "🇿🇲", code: "+260", country: "Zambia" },
  { flag: "🇧🇼", code: "+267", country: "Botswana" },
  { flag: "🇲🇿", code: "+258", country: "Mozambique" },
  { flag: "🇳🇦", code: "+264", country: "Namibia" },
  { flag: "🇹🇿", code: "+255", country: "Tanzania" },
  { flag: "🇰🇪", code: "+254", country: "Kenya" },
  { flag: "🇳🇬", code: "+234", country: "Nigeria" },
  { flag: "🇬🇧", code: "+44",  country: "United Kingdom" },
  { flag: "🇺🇸", code: "+1",   country: "United States" },
  { flag: "🇦🇺", code: "+61",  country: "Australia" },
  { flag: "🇨🇦", code: "+1",   country: "Canada" },
  { flag: "🇩🇪", code: "+49",  country: "Germany" },
  { flag: "🇫🇷", code: "+33",  country: "France" },
  { flag: "🇮🇳", code: "+91",  country: "India" },
  { flag: "🇨🇳", code: "+86",  country: "China" },
  { flag: "🇧🇷", code: "+55",  country: "Brazil" },
  { flag: "🇦🇪", code: "+971", country: "UAE" },
  { flag: "🇸🇬", code: "+65",  country: "Singapore" },
];

// ─── Countries list for Step 3 ───────────────────────────────────────────────
const COUNTRIES = [
  "Zimbabwe", "South Africa", "Zambia", "Botswana", "Mozambique",
  "Namibia", "Tanzania", "Kenya", "Nigeria", "Ghana", "Uganda",
  "Rwanda", "Ethiopia", "Malawi", "Eswatini", "Lesotho",
  "United Kingdom", "United States", "Australia", "Canada",
  "Germany", "France", "Netherlands", "New Zealand", "India",
  "China", "UAE", "Singapore", "Brazil", "Portugal",
];

// ─── Types ────────────────────────────────────────────────────────────────────
type Props = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, "Registration">;
  route: RouteProp<OnboardingStackParamList, "Registration">;
};

interface FormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  dob: string;
  gender: Gender | null;
  maritalStatus: MaritalStatus | null;
  churchName: string;
  countryCode: string;
  phone: string;
  residentialAddress: string;
  suburb: string;
  cityTown: string;
  country: string;
}

type FieldKey = keyof FormData;

// ─── Password strength ────────────────────────────────────────────────────────
function getPasswordStrength(pw: string): { label: string; color: string; pct: number } {
  if (!pw) return { label: "", color: "#2A2A2A", pct: 0 };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { label: "Weak", color: "#DA291C", pct: 20 };
  if (score === 2) return { label: "Fair", color: "#F59E0B", pct: 45 };
  if (score === 3) return { label: "Good", color: "#3B82F6", pct: 68 };
  return { label: "Strong", color: "#22C55E", pct: 100 };
}

// ─── Tap-friendly option button ───────────────────────────────────────────────
function OptionButton({
  label,
  icon,
  isSelected,
  onPress,
}: {
  label: string;
  icon?: string;
  isSelected: boolean;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.optionBtn,
        {
          backgroundColor: isSelected ? "#DA291C" : theme.backgroundSecondary,
          borderColor: isSelected ? "#DA291C" : theme.border,
        },
      ]}
    >
      {icon ? (
        <ThemedText style={{ fontSize: 18, marginBottom: 4 }}>{icon}</ThemedText>
      ) : null}
      <ThemedText
        type="small"
        style={{
          color: isSelected ? "#FFFFFF" : theme.textSecondary,
          fontWeight: isSelected ? "700" : "500",
          textAlign: "center",
        }}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}

// ─── Field wrapper ────────────────────────────────────────────────────────────
function FieldCard({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string | null;
  children: React.ReactNode;
}) {
  const { theme } = useTheme();
  return (
    <View style={styles.fieldCard}>
      <View style={styles.labelRow}>
        <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>
          {label}
        </ThemedText>
        {required && (
          <ThemedText style={[styles.requiredDot, { color: "#DA291C" }]}> *</ThemedText>
        )}
      </View>
      {children}
      {error ? (
        <Animated.View entering={FadeInDown.duration(200)} style={styles.errorRow}>
          <Feather name="alert-circle" size={12} color="#DA291C" />
          <ThemedText style={[styles.errorText, { color: "#DA291C" }]}>{error}</ThemedText>
        </Animated.View>
      ) : null}
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function RegistrationScreen({ navigation, route }: Props) {
  const { role } = route.params;
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { login, user: authUser } = useAuth();
  const { error: toastError, success: toastSuccess } = useToast();

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showCountryCodePicker, setShowCountryCodePicker] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [showChurchDropdown, setShowChurchDropdown] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [churchSearch, setChurchSearch] = useState("");
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({});
  const [attemptedNext, setAttemptedNext] = useState(false);

  const scrollRef = useRef<ScrollView>(null);

  const [form, setForm] = useState<FormData>({
    fullName: authUser?.fullName || "",
    email: authUser?.email || "",
    password: "",
    confirmPassword: "",
    dob: authUser?.dob || "",
    gender: authUser?.gender || null,
    maritalStatus: authUser?.maritalStatus || null,
    churchName: authUser?.churchName || "",
    countryCode: "+263",
    phone: authUser?.phone || "",
    residentialAddress: authUser?.residentialAddress || "",
    suburb: authUser?.suburb || "",
    cityTown: authUser?.cityTown || "",
    country: authUser?.country || "Zimbabwe",
  });

  const update = (key: FieldKey, value: any) => setForm((f) => ({ ...f, [key]: value }));
  const touch = (key: FieldKey) => setTouched((t) => ({ ...t, [key]: true }));

  // ── Validation ──────────────────────────────────────────────────────────────
  const emailValid = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

  const fieldError = (key: FieldKey): string | null => {
    const shouldShow = touched[key] || attemptedNext;
    if (!shouldShow) return null;
    const v = form[key];
    switch (key) {
      case "fullName":
        return !String(v).trim() ? "Full name is required." : null;
      case "email":
        if (!String(v).trim()) return "Email address is required.";
        if (!emailValid(String(v))) return "Enter a valid email address.";
        return null;
      case "password":
        if (!String(v)) return "Password is required.";
        if (String(v).length < 6) return "Password must be at least 6 characters.";
        return null;
      case "confirmPassword":
        if (!String(v)) return "Please confirm your password.";
        if (String(v) !== form.password) return "Passwords do not match.";
        return null;
      case "dob":
        return !String(v) ? "Date of birth is required." : null;
      case "gender":
        return v === null ? "Please select your gender." : null;
      case "maritalStatus":
        return v === null ? "Please select marital status." : null;
      case "churchName":
        return !String(v).trim() ? "Church or Ministry name is required." : null;
      case "phone":
        return !String(v).trim() ? "Phone number is required." : null;
      case "residentialAddress":
        return !String(v).trim() ? "Residential address is required." : null;
      case "suburb":
        return !String(v).trim() ? "Suburb is required." : null;
      case "cityTown":
        return !String(v).trim() ? "City / Town is required." : null;
      case "country":
        return !String(v).trim() ? "Country is required." : null;
      default:
        return null;
    }
  };

  const step1Fields: FieldKey[] = ["fullName", "email", "password", "confirmPassword"];
  const step2Fields: FieldKey[] = ["dob", "gender", "maritalStatus", "churchName", "phone"];
  const step3Fields: FieldKey[] = ["residentialAddress", "suburb", "cityTown", "country"];

  const isStep1Valid =
    !!form.fullName.trim() &&
    emailValid(form.email) &&
    form.password.length >= 6 &&
    form.password === form.confirmPassword;

  const isStep2Valid =
    !!form.dob &&
    form.gender !== null &&
    form.maritalStatus !== null &&
    !!form.churchName.trim() &&
    !!form.phone.trim();

  const isStep3Valid =
    !!form.residentialAddress.trim() &&
    !!form.suburb.trim() &&
    !!form.cityTown.trim() &&
    !!form.country.trim();

  // ── Progress ────────────────────────────────────────────────────────────────
  const totalFields = [...step1Fields, ...step2Fields, ...step3Fields];
  const completedCount = useMemo(() => {
    return totalFields.filter((k) => {
      const v = form[k];
      if (v === null) return false;
      return String(v).trim().length > 0;
    }).length;
  }, [form]);

  const progressPct = (completedCount / totalFields.length) * 100;

  // ── Navigation between steps ─────────────────────────────────────────────────
  const goNext = () => {
    setAttemptedNext(true);
    const currentFields = step === 1 ? step1Fields : step === 2 ? step2Fields : step3Fields;
    // touch all current step fields
    setTouched((t) => {
      const next = { ...t };
      currentFields.forEach((k) => { next[k] = true; });
      return next;
    });

    const valid = step === 1 ? isStep1Valid : step === 2 ? isStep2Valid : isStep3Valid;
    if (!valid) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    Haptics.selectionAsync();
    setAttemptedNext(false);
    setStep((s) => s + 1);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const goBack = () => {
    if (step === 1) {
      navigation.goBack();
    } else {
      setStep((s) => s - 1);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setAttemptedNext(true);
    setTouched((t) => {
      const next = { ...t };
      step3Fields.forEach((k) => { next[k] = true; });
      return next;
    });

    if (!isStep3Valid) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    setIsLoading(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      const fullPhone = `${form.countryCode}${form.phone.trim()}`;
      const createdUser = await dataStorage.signup({
        fullName: form.fullName.trim(),
        phone: fullPhone,
        email: form.email.trim(),
        dob: form.dob,
        password: form.password,
        gender: form.gender!,
        maritalStatus: form.maritalStatus!,
        role: role,
        organizationId: route.params.organizationId,
        churchName: form.churchName.trim(),
        residentialAddress: form.residentialAddress.trim(),
        suburb: form.suburb.trim(),
        cityTown: form.cityTown.trim(),
        province: "",
        country: form.country.trim(),
      });

      const updatedUser = { ...createdUser, isOnboardingComplete: true };
      await dataStorage.updateUser(createdUser.id, { isOnboardingComplete: true });
      await dataStorage.setUser(updatedUser);

      setShowSuccess(true);

      setTimeout(async () => {
        toastSuccess("Welcome! Registration successful 🎉");
        await login(updatedUser);
      }, 2200);
    } catch (err: any) {
      console.error("Registration error:", err);
      toastError(err?.message || "Failed to create your account.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Strength bar ─────────────────────────────────────────────────────────────
  const strength = getPasswordStrength(form.password);

  // ── Filtered countries ───────────────────────────────────────────────────────
  const filteredCountries = COUNTRIES.filter((c) =>
    c.toLowerCase().includes(countrySearch.toLowerCase())
  );

  // ── Selected country code obj ─────────────────────────────────────────────────
  const selectedCC = COUNTRY_CODES.find((c) => c.code === form.countryCode) || COUNTRY_CODES[0];

  // ─────────────────────────────────────────────────────────────────────────────
  // SUCCESS SCREEN
  // ─────────────────────────────────────────────────────────────────────────────
  if (showSuccess) {
    return (
      <View style={[styles.successScreen, { backgroundColor: "#0D0D0D" }]}>
        <Animated.View entering={FadeIn.duration(600)} style={styles.successContent}>
          <Animated.View entering={FadeInDown.delay(200).duration(600)} style={[styles.successCircle, { backgroundColor: "rgba(34,197,94,0.15)" }]}>
            <Feather name="check" size={56} color="#22C55E" />
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(400).duration(600)}>
            <ThemedText type="h1" style={[styles.successTitle, { color: "#FFFFFF" }]}>
              You're In! 🎉
            </ThemedText>
            <ThemedText type="body" style={[styles.successSub, { color: "#A0A0A0" }]}>
              Your account has been created successfully.{"\n"}Welcome to the family!
            </ThemedText>
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(600).duration(600)}>
            <ActivityIndicator color="#DA291C" size="large" style={{ marginTop: 32 }} />
            <ThemedText type="small" style={{ color: "#A0A0A0", textAlign: "center", marginTop: 12 }}>
              Taking you in…
            </ThemedText>
          </Animated.View>
        </Animated.View>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // MAIN FORM
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: "#0D0D0D" }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={goBack} style={[styles.backBtn, { backgroundColor: theme.backgroundSecondary }]}>
          <Feather name="arrow-left" size={22} color={theme.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <ThemedText type="h4" style={{ color: theme.text }}>
            {step === 1 ? "Account Details" : step === 2 ? "Personal Info" : "Location"}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Step {step} of 3
          </ThemedText>
        </View>
        {/* Overall field completion badge */}
        <View style={[styles.completeBadge, { backgroundColor: theme.backgroundSecondary }]}>
          <ThemedText type="small" style={{ color: "#DA291C", fontWeight: "700" }}>
            {Math.round(progressPct)}%
          </ThemedText>
        </View>
      </View>

      {/* ── Step Tab Bar + Progress ── */}
      <View style={{ paddingHorizontal: Spacing.xl, paddingBottom: Spacing.md }}>
        {/* Step tabs */}
        <View style={styles.stepTabs}>
          {["Account", "Personal", "Location"].map((label, idx) => {
            const num = idx + 1;
            const active = step === num;
            const done = step > num;
            return (
              <View key={label} style={styles.stepTabItem}>
                <View
                  style={[
                    styles.stepDot,
                    {
                      backgroundColor: done ? "#22C55E" : active ? "#DA291C" : theme.border,
                      borderColor: done ? "#22C55E" : active ? "#DA291C" : theme.border,
                    },
                  ]}
                >
                  {done ? (
                    <Feather name="check" size={11} color="#FFF" />
                  ) : (
                    <ThemedText style={{ color: "#FFF", fontSize: 10, fontWeight: "700" }}>
                      {num}
                    </ThemedText>
                  )}
                </View>
                <ThemedText
                  type="small"
                  style={{
                    color: active ? "#DA291C" : done ? "#22C55E" : theme.textSecondary,
                    fontWeight: active || done ? "700" : "400",
                    fontSize: 11,
                    marginTop: 4,
                  }}
                >
                  {label}
                </ThemedText>
              </View>
            );
          })}
        </View>

        {/* Progress bar */}
        <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                backgroundColor: "#DA291C",
                width: `${progressPct}%` as any,
              },
            ]}
          />
        </View>
      </View>

      {/* ── Scrollable Form Body ── */}
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 120 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ═══════════════════════════════════════════════════
            STEP 1 — Account Details
        ═══════════════════════════════════════════════════ */}
        {step === 1 && (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.stepBody}>
            <ThemedText type="h3" style={[styles.stepTitle, { color: theme.text }]}>
              Create your account
            </ThemedText>
            <ThemedText type="small" style={[styles.stepSub, { color: theme.textSecondary }]}>
              Your login credentials — keep your password safe!
            </ThemedText>

            {/* Full Name */}
            <FieldCard label="Full Name" required error={fieldError("fullName")}>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.backgroundSecondary,
                    color: theme.text,
                    borderColor: fieldError("fullName") ? "#DA291C" : theme.border,
                  },
                ]}
                placeholder="e.g. Tendai Moyo"
                placeholderTextColor={theme.textSecondary}
                value={form.fullName}
                onChangeText={(t) => update("fullName", t)}
                onBlur={() => touch("fullName")}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </FieldCard>

            {/* Email */}
            <FieldCard label="Email Address" required error={fieldError("email")}>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.backgroundSecondary,
                    color: theme.text,
                    borderColor: fieldError("email") ? "#DA291C" : theme.border,
                  },
                ]}
                placeholder="your@email.com"
                placeholderTextColor={theme.textSecondary}
                value={form.email}
                onChangeText={(t) => update("email", t)}
                onBlur={() => touch("email")}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </FieldCard>

            {/* Password */}
            <FieldCard label="Password" required error={fieldError("password")}>
              <View style={styles.pwRow}>
                <TextInput
                  style={[
                    styles.input,
                    styles.pwInput,
                    {
                      backgroundColor: theme.backgroundSecondary,
                      color: theme.text,
                      borderColor: fieldError("password") ? "#DA291C" : theme.border,
                    },
                  ]}
                  placeholder="Min. 6 characters"
                  placeholderTextColor={theme.textSecondary}
                  value={form.password}
                  onChangeText={(t) => update("password", t)}
                  onBlur={() => touch("password")}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <Pressable onPress={() => setShowPassword((v) => !v)} style={styles.eyeBtn}>
                  <Feather name={showPassword ? "eye-off" : "eye"} size={18} color={theme.textSecondary} />
                </Pressable>
              </View>
              {/* Strength meter */}
              {form.password.length > 0 && (
                <Animated.View entering={FadeInDown.duration(200)} style={styles.strengthBlock}>
                  <View style={[styles.strengthTrack, { backgroundColor: theme.border }]}>
                    <View
                      style={[
                        styles.strengthFill,
                        { width: `${strength.pct}%` as any, backgroundColor: strength.color },
                      ]}
                    />
                  </View>
                  <ThemedText style={[styles.strengthLabel, { color: strength.color }]}>
                    {strength.label}
                  </ThemedText>
                </Animated.View>
              )}
            </FieldCard>

            {/* Confirm Password */}
            <FieldCard label="Confirm Password" required error={fieldError("confirmPassword")}>
              <View style={styles.pwRow}>
                <TextInput
                  style={[
                    styles.input,
                    styles.pwInput,
                    {
                      backgroundColor: theme.backgroundSecondary,
                      color: theme.text,
                      borderColor: fieldError("confirmPassword")
                        ? "#DA291C"
                        : form.confirmPassword && form.confirmPassword === form.password
                        ? "#22C55E"
                        : theme.border,
                    },
                  ]}
                  placeholder="Re-enter your password"
                  placeholderTextColor={theme.textSecondary}
                  value={form.confirmPassword}
                  onChangeText={(t) => update("confirmPassword", t)}
                  onBlur={() => touch("confirmPassword")}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <Pressable onPress={() => setShowConfirmPassword((v) => !v)} style={styles.eyeBtn}>
                  <Feather name={showConfirmPassword ? "eye-off" : "eye"} size={18} color={theme.textSecondary} />
                </Pressable>
              </View>
              {form.confirmPassword.length > 0 && form.confirmPassword === form.password && (
                <Animated.View entering={FadeInDown.duration(200)} style={styles.matchRow}>
                  <Feather name="check-circle" size={13} color="#22C55E" />
                  <ThemedText style={[styles.matchText, { color: "#22C55E" }]}>Passwords match</ThemedText>
                </Animated.View>
              )}
            </FieldCard>
          </Animated.View>
        )}

        {/* ═══════════════════════════════════════════════════
            STEP 2 — Personal Info
        ═══════════════════════════════════════════════════ */}
        {step === 2 && (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.stepBody}>
            <ThemedText type="h3" style={[styles.stepTitle, { color: theme.text }]}>
              About you
            </ThemedText>
            <ThemedText type="small" style={[styles.stepSub, { color: theme.textSecondary }]}>
              Help us get to know you better.
            </ThemedText>

            {/* Date of Birth */}
            <FieldCard label="Date of Birth" required error={fieldError("dob")}>
              <Pressable
                onPress={() => setShowDatePicker(true)}
                style={[
                  styles.input,
                  styles.selectorBtn,
                  {
                    backgroundColor: theme.backgroundSecondary,
                    borderColor: fieldError("dob") ? "#DA291C" : theme.border,
                  },
                ]}
              >
                <Feather name="calendar" size={16} color={form.dob ? theme.text : theme.textSecondary} style={{ marginRight: 8 }} />
                <ThemedText style={{ color: form.dob ? theme.text : theme.textSecondary, fontSize: 15 }}>
                  {form.dob || "Select date of birth"}
                </ThemedText>
              </Pressable>
              {showDatePicker && (
                <DateTimePicker
                  value={form.dob ? new Date(form.dob) : new Date(2000, 0, 1)}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={(event, date) => {
                    setShowDatePicker(Platform.OS === "ios");
                    if (date) {
                      const formatted = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
                      update("dob", formatted);
                      touch("dob");
                    }
                  }}
                  maximumDate={new Date()}
                />
              )}
            </FieldCard>

            {/* Gender */}
            <FieldCard label="Gender" required error={fieldError("gender")}>
              <View style={styles.optionRow}>
                <OptionButton
                  label="Male"
                  icon="👨"
                  isSelected={form.gender === "male"}
                  onPress={() => {
                    Haptics.selectionAsync();
                    update("gender", "male");
                    touch("gender");
                  }}
                />
                <OptionButton
                  label="Female"
                  icon="👩"
                  isSelected={form.gender === "female"}
                  onPress={() => {
                    Haptics.selectionAsync();
                    update("gender", "female");
                    touch("gender");
                  }}
                />
              </View>
            </FieldCard>

            {/* Marital Status */}
            <FieldCard label="Marital Status" required error={fieldError("maritalStatus")}>
              <View style={{ gap: Spacing.sm }}>
                <View style={styles.optionRow}>
                  {["single", "married"].map((ms) => {
                    return (
                      <OptionButton
                        key={ms}
                        label={`${ms === "married" ? "💍" : "🧍"} ${ms.charAt(0).toUpperCase() + ms.slice(1)}`}
                        isSelected={form.maritalStatus === ms as MaritalStatus}
                        onPress={() => {
                          Haptics.selectionAsync();
                          update("maritalStatus", ms as MaritalStatus);
                          touch("maritalStatus");
                        }}
                      />
                    );
                  })}
                </View>
                <View style={styles.optionRow}>
                  {["divorced", "widowed"].map((ms) => {
                    return (
                      <OptionButton
                        key={ms}
                        label={`${ms === "divorced" ? "💔" : "🕊️"} ${ms.charAt(0).toUpperCase() + ms.slice(1)}`}
                        isSelected={form.maritalStatus === ms as MaritalStatus}
                        onPress={() => {
                          Haptics.selectionAsync();
                          update("maritalStatus", ms as MaritalStatus);
                          touch("maritalStatus");
                        }}
                      />
                    );
                  })}
                </View>
              </View>
            </FieldCard>

            {/* Church Name */}
            <FieldCard label="Your Church" required error={fieldError("churchName")}>
              <View style={{ zIndex: 10 }}>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.backgroundSecondary,
                      color: theme.text,
                      borderColor: fieldError("churchName") ? "#DA291C" : theme.border,
                    },
                  ]}
                  placeholder="e.g. Celebration Church"
                  placeholderTextColor={theme.textSecondary}
                  value={form.churchName}
                  onChangeText={(t) => {
                    update("churchName", t);
                    setChurchSearch(t);
                    setShowChurchDropdown(true);
                  }}
                  onFocus={() => setShowChurchDropdown(true)}
                  onBlur={() => {
                    touch("churchName");
                    setTimeout(() => setShowChurchDropdown(false), 200);
                  }}
                  autoCapitalize="words"
                />
                {showChurchDropdown && churchSearch.length > 0 && ZIM_CHURCHES.filter(c => c.toLowerCase().includes(churchSearch.toLowerCase())).length > 0 && (
                  <View style={[styles.dropdown, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
                    <View style={{ maxHeight: 200, overflow: 'hidden' }}>
                      <Animated.View entering={FadeInUp.duration(300)}>
                        {ZIM_CHURCHES.filter(c => c.toLowerCase().includes(churchSearch.toLowerCase())).slice(0, 5).map((church, idx) => (
                          <Pressable
                            key={idx}
                            onPress={() => {
                              update("churchName", church);
                              setChurchSearch("");
                              setShowChurchDropdown(false);
                            }}
                            style={({ pressed }) => [
                              styles.dropdownItem,
                              {
                                backgroundColor: pressed ? theme.border : "transparent",
                                borderBottomColor: theme.border,
                              }
                            ]}
                          >
                            <ThemedText style={{ color: theme.text }}>{church}</ThemedText>
                          </Pressable>
                        ))}
                      </Animated.View>
                    </View>
                  </View>
                )}
              </View>
            </FieldCard>

            {/* Phone Number */}
            <FieldCard label="Phone Number" required error={fieldError("phone")}>
              <View style={styles.phoneRow}>
                {/* Country code picker trigger */}
                <Pressable
                  onPress={() => setShowCountryCodePicker(true)}
                  style={[
                    styles.countryCodeBtn,
                    {
                      backgroundColor: theme.backgroundSecondary,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <ThemedText style={{ fontSize: 18 }}>{selectedCC.flag}</ThemedText>
                  <ThemedText style={{ color: theme.text, fontSize: 13, fontWeight: "600", marginLeft: 4 }}>
                    {selectedCC.code}
                  </ThemedText>
                  <Feather name="chevron-down" size={14} color={theme.textSecondary} style={{ marginLeft: 2 }} />
                </Pressable>
                {/* Phone input */}
                <TextInput
                  style={[
                    styles.input,
                    styles.phoneInput,
                    {
                      backgroundColor: theme.backgroundSecondary,
                      color: theme.text,
                      borderColor: fieldError("phone") ? "#DA291C" : theme.border,
                    },
                  ]}
                  placeholder="712 345 678"
                  placeholderTextColor={theme.textSecondary}
                  value={form.phone}
                  onChangeText={(t) => update("phone", t)}
                  onBlur={() => touch("phone")}
                  keyboardType="phone-pad"
                />
              </View>
            </FieldCard>
          </Animated.View>
        )}

        {/* ═══════════════════════════════════════════════════
            STEP 3 — Location
        ═══════════════════════════════════════════════════ */}
        {step === 3 && (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.stepBody}>
            <ThemedText type="h3" style={[styles.stepTitle, { color: theme.text }]}>
              Where are you based?
            </ThemedText>
            <ThemedText type="small" style={[styles.stepSub, { color: theme.textSecondary }]}>
              Your residential details help us connect you with local groups.
            </ThemedText>

            {/* Residential Address */}
            <FieldCard label="Residential Address" required error={fieldError("residentialAddress")}>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.backgroundSecondary,
                    color: theme.text,
                    borderColor: fieldError("residentialAddress") ? "#DA291C" : theme.border,
                  },
                ]}
                placeholder="House no. & street name"
                placeholderTextColor={theme.textSecondary}
                value={form.residentialAddress}
                onChangeText={(t) => update("residentialAddress", t)}
                onBlur={() => touch("residentialAddress")}
                autoCapitalize="words"
              />
            </FieldCard>

            {/* Suburb */}
            <FieldCard label="Suburb" required error={fieldError("suburb")}>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.backgroundSecondary,
                    color: theme.text,
                    borderColor: fieldError("suburb") ? "#DA291C" : theme.border,
                  },
                ]}
                placeholder="e.g. Mabelreign"
                placeholderTextColor={theme.textSecondary}
                value={form.suburb}
                onChangeText={(t) => update("suburb", t)}
                onBlur={() => touch("suburb")}
                autoCapitalize="words"
              />
            </FieldCard>

            {/* City / Town */}
            <FieldCard label="City / Town" required error={fieldError("cityTown")}>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.backgroundSecondary,
                    color: theme.text,
                    borderColor: fieldError("cityTown") ? "#DA291C" : theme.border,
                  },
                ]}
                placeholder="e.g. Harare"
                placeholderTextColor={theme.textSecondary}
                value={form.cityTown}
                onChangeText={(t) => update("cityTown", t)}
                onBlur={() => touch("cityTown")}
                autoCapitalize="words"
              />
            </FieldCard>

            {/* Country */}
            <FieldCard label="Country" required error={fieldError("country")}>
              <Pressable
                onPress={() => { setCountrySearch(""); setShowCountryPicker(true); }}
                style={[
                  styles.input,
                  styles.selectorBtn,
                  {
                    backgroundColor: theme.backgroundSecondary,
                    borderColor: fieldError("country") ? "#DA291C" : theme.border,
                  },
                ]}
              >
                <Feather name="globe" size={16} color={form.country ? theme.text : theme.textSecondary} style={{ marginRight: 8 }} />
                <ThemedText style={{ color: form.country ? theme.text : theme.textSecondary, flex: 1, fontSize: 15 }}>
                  {form.country || "Select country"}
                </ThemedText>
                <Feather name="chevron-down" size={16} color={theme.textSecondary} />
              </Pressable>
            </FieldCard>

            {/* Leader notice */}
            {role === "leader" && (
              <Animated.View entering={FadeInDown.duration(400)}>
                <View style={[styles.noticeBox, { backgroundColor: "rgba(255,215,0,0.08)", borderColor: "rgba(255,215,0,0.22)" }]}>
                  <Feather name="info" size={16} color="#FFD700" />
                  <ThemedText type="small" style={{ color: theme.textSecondary, flex: 1, marginLeft: 8 }}>
                    Cell Leader registrations require administrator approval.
                  </ThemedText>
                </View>
              </Animated.View>
            )}
          </Animated.View>
        )}
      </ScrollView>

      {/* ── Bottom Action Button ── */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: "#0D0D0D",
            paddingBottom: insets.bottom + 16,
            borderTopColor: theme.border,
          },
        ]}
      >
        {step < 3 ? (
          <Pressable
            onPress={goNext}
            style={[styles.actionBtn, { backgroundColor: "#DA291C" }]}
          >
            <ThemedText style={styles.actionBtnText}>Continue</ThemedText>
            <Feather name="arrow-right" size={18} color="#FFF" style={{ marginLeft: 8 }} />
          </Pressable>
        ) : (
          <Pressable
            onPress={handleSubmit}
            disabled={isLoading}
            style={[styles.actionBtn, { backgroundColor: isLoading ? "#8B1A13" : "#DA291C", opacity: isLoading ? 0.85 : 1 }]}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Feather name="user-check" size={18} color="#FFF" style={{ marginRight: 8 }} />
                <ThemedText style={styles.actionBtnText}>Complete Registration</ThemedText>
              </>
            )}
          </Pressable>
        )}
      </View>

      {/* ── Country Code Picker Modal ── */}
      <Modal
        visible={showCountryCodePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCountryCodePicker(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowCountryCodePicker(false)} />
        <View style={[styles.modalSheet, { backgroundColor: theme.backgroundSecondary }]}>
          <View style={[styles.modalHandle, { backgroundColor: theme.border }]} />
          <ThemedText type="h4" style={{ color: theme.text, marginBottom: 16 }}>
            Select Country Code
          </ThemedText>
          <FlatList
            data={COUNTRY_CODES}
            keyExtractor={(item, i) => `${item.code}-${i}`}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  update("countryCode", item.code);
                  setShowCountryCodePicker(false);
                }}
                style={[
                  styles.modalItem,
                  {
                    backgroundColor: form.countryCode === item.code ? "rgba(218,41,28,0.12)" : "transparent",
                    borderBottomColor: theme.border,
                  },
                ]}
              >
                <ThemedText style={{ fontSize: 22, marginRight: 12 }}>{item.flag}</ThemedText>
                <View style={{ flex: 1 }}>
                  <ThemedText style={{ color: theme.text, fontWeight: "600" }}>{item.country}</ThemedText>
                  <ThemedText style={{ color: theme.textSecondary, fontSize: 13 }}>{item.code}</ThemedText>
                </View>
                {form.countryCode === item.code && (
                  <Feather name="check" size={18} color="#DA291C" />
                )}
              </Pressable>
            )}
            style={{ maxHeight: 380 }}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </Modal>

      {/* ── Country Picker Modal ── */}
      <Modal
        visible={showCountryPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCountryPicker(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowCountryPicker(false)} />
        <View style={[styles.modalSheet, { backgroundColor: theme.backgroundSecondary }]}>
          <View style={[styles.modalHandle, { backgroundColor: theme.border }]} />
          <ThemedText type="h4" style={{ color: theme.text, marginBottom: 12 }}>
            Select Country
          </ThemedText>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: "#0D0D0D",
                color: theme.text,
                borderColor: theme.border,
                marginBottom: 12,
              },
            ]}
            placeholder="Search country…"
            placeholderTextColor={theme.textSecondary}
            value={countrySearch}
            onChangeText={setCountrySearch}
            autoCapitalize="words"
          />
          <FlatList
            data={filteredCountries}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  update("country", item);
                  touch("country");
                  setShowCountryPicker(false);
                }}
                style={[
                  styles.modalItem,
                  {
                    backgroundColor: form.country === item ? "rgba(218,41,28,0.12)" : "transparent",
                    borderBottomColor: theme.border,
                  },
                ]}
              >
                <ThemedText style={{ color: theme.text, flex: 1 }}>{item}</ThemedText>
                {form.country === item && <Feather name="check" size={18} color="#DA291C" />}
              </Pressable>
            )}
            style={{ maxHeight: 360 }}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { flex: 1, alignItems: "center" },
  completeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    minWidth: 46,
    alignItems: "center",
  },

  // Step tabs
  stepTabs: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  stepTabItem: { alignItems: "center", flex: 1 },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },

  // Progress
  progressTrack: {
    height: 4,
    borderRadius: BorderRadius.full,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: BorderRadius.full,
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.xl },

  // Step body
  stepBody: { paddingTop: Spacing.sm },
  stepTitle: { marginBottom: Spacing.xs },
  stepSub: { marginBottom: Spacing.xl },

  // Fields
  fieldCard: { marginBottom: Spacing.lg },
  labelRow: { flexDirection: "row", alignItems: "center", marginBottom: Spacing.sm },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  requiredDot: { fontSize: 14, fontWeight: "700" },

  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    fontSize: 15,
  },

  errorRow: { flexDirection: "row", alignItems: "center", marginTop: 6, gap: 5 },
  errorText: { fontSize: 12, fontWeight: "500" },

  // Password
  pwRow: { flexDirection: "row", alignItems: "center" },
  pwInput: { flex: 1 },
  eyeBtn: {
    position: "absolute",
    right: 14,
    height: "100%",
    justifyContent: "center",
    paddingLeft: 6,
  },
  strengthBlock: { flexDirection: "row", alignItems: "center", marginTop: 8, gap: 10 },
  strengthTrack: { flex: 1, height: 4, borderRadius: BorderRadius.full, overflow: "hidden" },
  strengthFill: { height: "100%", borderRadius: BorderRadius.full },
  strengthLabel: { fontSize: 12, fontWeight: "700", minWidth: 46 },
  matchRow: { flexDirection: "row", alignItems: "center", marginTop: 6, gap: 5 },
  matchText: { fontSize: 12, fontWeight: "600" },

  // Selector button (date, country)
  selectorBtn: {
    flexDirection: "row",
    alignItems: "center",
  },

  // Options
  optionRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  optionBtn: {
    flex: 1,
    minWidth: 80,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },

  // Phone
  phoneRow: { flexDirection: "row", gap: Spacing.sm },
  countryCodeBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    height: 50,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    gap: 2,
  },
  phoneInput: { flex: 1 },

  // Notice box
  noticeBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },

  // Dropdown
  dropdown: {
    position: "absolute",
    top: 54,
    left: 0,
    right: 0,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    zIndex: 1000,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  dropdownItem: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },

  // Bottom bar
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  actionBtn: {
    height: 54,
    borderRadius: BorderRadius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  modalSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.xl,
    paddingBottom: 36,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: Spacing.lg,
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
  },

  // Success
  successScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  successContent: {
    alignItems: "center",
    paddingHorizontal: Spacing["3xl"],
    gap: Spacing.xl,
  },
  successCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  successTitle: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  successSub: {
    textAlign: "center",
    lineHeight: 22,
  },
});
