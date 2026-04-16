import React, { useMemo, useState } from "react";
import { View, StyleSheet, TextInput, Pressable, ActivityIndicator, Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInUp } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { useToast } from "@/contexts/ToastContext";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { OnboardingStackParamList } from "@/navigation/OnboardingStackNavigator";
import { UserRole, Gender, MaritalStatus } from "@/lib/storage";
import { ZIM_CHURCHES } from "@/constants/churches";

const ZIM_PROVINCES = [
  "Bulawayo",
  "Harare",
  "Manicaland",
  "Mashonaland Central",
  "Mashonaland East",
  "Mashonaland West",
  "Masvingo",
  "Matabeleland North",
  "Matabeleland South",
  "Midlands"
];

const ZIM_CITIES = [
  "Harare", "Bulawayo", "Chitungwiza", "Mutare", "Epworth", "Gweru",
  "Kwekwe", "Kadoma", "Masvingo", "Chinhoyi", "Norton", "Marondera",
  "Ruwa", "Chegutu", "Zvishavane", "Bindura", "Beitbridge", "Redcliff",
  "Victoria Falls", "Hwange", "Gwanda", "Kariba", "Karoi", "Gokwe"
];

type Props = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, "Registration">;
  route: RouteProp<OnboardingStackParamList, "Registration">;
};

import { storage as dataStorage } from "@/lib/storage";

interface FormData {
  fullName: string;
  phone: string;
  email: string;
  dob: string;
  password: string;
  confirmPassword: string;
  gender: Gender | null;
  maritalStatus: MaritalStatus | null;
  churchName: string;
  residentialAddress: string;
  suburb: string;
  cityTown: string;
  province: string;
  country: string;
}

type FieldKey = keyof FormData;

function SelectButton({
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
  const { login, user: authUser } = useAuth();
  const { error, success } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState<FormData>({
    fullName: authUser?.fullName || "",
    phone: authUser?.phone || "",
    email: authUser?.email || "",
    dob: authUser?.dob || "",
    password: "",
    confirmPassword: "",
    gender: authUser?.gender || null,
    maritalStatus: authUser?.maritalStatus || null,
    churchName: authUser?.churchName || "",
    residentialAddress: authUser?.residentialAddress || "",
    suburb: authUser?.suburb || "",
    cityTown: authUser?.cityTown || "",
    province: authUser?.province || "",
    country: authUser?.country || "Zimbabwe",
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [churchSearch, setChurchSearch] = useState("");
  const [showChurchDropdown, setShowChurchDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [citySearch, setCitySearch] = useState("");
  const [showProvinceDropdown, setShowProvinceDropdown] = useState(false);
  const [provinceSearch, setProvinceSearch] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<FieldKey | null>(null);
  const [touchedFields, setTouchedFields] = useState<Partial<Record<FieldKey, boolean>>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const requiredFieldLabels: Record<FieldKey, string> = {
    fullName: "Full name",
    phone: "Phone number",
    email: "Email address",
    dob: "Date of birth",
    password: "Password",
    confirmPassword: "Confirm password",
    gender: "Gender",
    maritalStatus: "Marital status",
    churchName: "Church / ministry",
    residentialAddress: "Residential address",
    suburb: "Suburb",
    cityTown: "City / town",
    province: "Province",
    country: "Country",
  };

  const requiredFields: FieldKey[] = [
    "fullName",
    "phone",
    "email",
    "dob",
    "password",
    "confirmPassword",
    "gender",
    "maritalStatus",
    "churchName",
    "residentialAddress",
    "suburb",
    "cityTown",
    "province",
    "country",
  ];

  const completedRequiredFields = useMemo(
    () =>
      requiredFields.filter((field) => {
        const value = form[field];
        if (typeof value === "string") {
          return value.trim().length > 0;
        }
        return value !== null;
      }).length,
    [form],
  );

  const isFormValid =
    form.fullName.trim().length > 0 &&
    form.phone.trim().length > 0 &&
    form.email.trim().length > 0 &&
    form.dob.trim().length > 0 &&
    form.password.length >= 6 &&
    form.password === form.confirmPassword &&
    form.gender !== null &&
    form.maritalStatus !== null &&
    form.churchName.trim().length > 0 &&
    form.residentialAddress.trim().length > 0 &&
    form.suburb.trim().length > 0 &&
    form.cityTown.trim().length > 0 &&
    form.province.trim().length > 0 &&
    form.country.trim().length > 0;

  const markTouched = (field: FieldKey) => {
    setTouchedFields((current) => ({ ...current, [field]: true }));
  };

  const isFieldInvalid = (field: FieldKey): boolean => {
    const value = form[field];

    switch (field) {
      case "email":
        return typeof value === "string" && value.trim().length > 0 && !value.includes("@");
      case "dob":
        return typeof value === "string" && value.trim().length > 0 && !/^\d{4}-\d{2}-\d{2}$/.test(value.trim());
      case "password":
        return typeof value === "string" && value.length > 0 && value.length < 6;
      case "confirmPassword":
        return typeof value === "string" && value.length > 0 && value !== form.password;
      default:
        if (typeof value === "string") {
          return value.trim().length === 0;
        }
        return value === null;
    }
  };

  const shouldShowFieldHint = (field: FieldKey) =>
    (submitAttempted || touchedFields[field]) && isFieldInvalid(field);

  const getFieldHint = (field: FieldKey): string | null => {
    if (!shouldShowFieldHint(field)) {
      return null;
    }

    switch (field) {
      case "email":
        return "Use a valid email address so your account can be recovered later.";
      case "dob":
        return "Enter your birth date in YYYY-MM-DD format.";
      case "password":
        return "Choose a password with at least 6 characters.";
      case "confirmPassword":
        return "The password confirmation needs to match exactly.";
      default:
        return `${requiredFieldLabels[field]} is required.`;
    }
  };

  const getInputStyle = (field: FieldKey) => ({
    borderColor: focusedField === field ? theme.gold : theme.border,
    backgroundColor: focusedField === field ? "rgba(255, 215, 0, 0.08)" : theme.backgroundSecondary,
    color: theme.text,
  });

  const handleSubmit = async () => {
    setSubmitAttempted(true);
    if (!isFormValid) {
      const firstMissingField = requiredFields.find((field) => isFieldInvalid(field));
      error(
        firstMissingField
          ? `${requiredFieldLabels[firstMissingField]} still needs attention.`
          : "Please fill in all required fields.",
      );
      return;
    }

    setIsLoading(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      const createdUser = await dataStorage.signup({
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        dob: form.dob.trim(),
        password: form.password,
        gender: form.gender!,
        maritalStatus: form.maritalStatus!,
        role: role,
        organizationId: route.params.organizationId,
        churchName: form.churchName.trim(),
        residentialAddress: form.residentialAddress.trim(),
        suburb: form.suburb.trim(),
        cityTown: form.cityTown.trim(),
        province: form.province.trim(),
        country: form.country.trim(),
      });

      success("Registration successful!");

      // Mark onboarding complete on the backend & update the user object
      const updatedUser = { ...createdUser, isOnboardingComplete: true };
      await dataStorage.updateUser(createdUser.id, { isOnboardingComplete: true });
      await dataStorage.setUser(updatedUser);

      // Log in with the already-complete user so completeOnboarding isn't needed
      await login(updatedUser);
    } catch (err: any) {
      console.error("Registration error:", err);
      error(err?.message || "Failed to create your account.");
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
      <KeyboardAwareScrollViewCompat
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.lg, paddingBottom: insets.bottom + Spacing.xl },
        ]}
      >
        <Animated.View entering={FadeInUp.delay(50).duration(500)}>
          <View style={styles.header}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={[styles.backButton, { backgroundColor: theme.backgroundSecondary }]}
            >
              <Feather name="arrow-left" size={24} color={theme.text} />
            </Pressable>
            <ThemedText type="h2" style={{ color: theme.text }}>
              Register
            </ThemedText>
            <View style={styles.placeholder} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(90).duration(500)} style={[styles.introCard, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
          <View style={styles.introTopRow}>
            <View style={[styles.rolePill, { backgroundColor: "rgba(255, 215, 0, 0.10)", borderColor: "rgba(255, 215, 0, 0.24)" }]}>
              <Feather name={getRoleIcon(role)} size={14} color={theme.gold} />
              <ThemedText type="small" style={{ color: theme.text, fontWeight: "700" }}>
                {getRoleTitle(role)}
              </ThemedText>
            </View>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {completedRequiredFields}/{requiredFields.length} complete
            </ThemedText>
          </View>
          <ThemedText type="h4" style={{ color: theme.text }}>
            Tell us a little about you
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Fill in the essentials below. We will guide you if anything still needs attention.
          </ThemedText>
          <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: theme.gold,
                  width: `${(completedRequiredFields / requiredFields.length) * 100}%`,
                },
              ]}
            />
          </View>
        </Animated.View>

        <View style={styles.form}>
          <Animated.View entering={FadeInUp.delay(150).duration(500)} style={[styles.inputCard, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
            <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
              Full Name
            </ThemedText>
            <TextInput
              style={[styles.input, getInputStyle("fullName")]}
              placeholder="Enter your full name"
              placeholderTextColor={theme.textSecondary}
              value={form.fullName}
              onChangeText={(text) => setForm({ ...form, fullName: text })}
              onFocus={() => setFocusedField("fullName")}
              onBlur={() => {
                setFocusedField(null);
                markTouched("fullName");
              }}
              autoCapitalize="words"
            />
            {getFieldHint("fullName") ? (
              <ThemedText type="small" style={[styles.helperText, { color: theme.textSecondary }]}>
                {getFieldHint("fullName")}
              </ThemedText>
            ) : null}
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(200).duration(500)} style={[styles.inputCard, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
            <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
              Phone Number
            </ThemedText>
            <TextInput
              style={[styles.input, getInputStyle("phone")]}
              placeholder="Enter your phone number"
              placeholderTextColor={theme.textSecondary}
              value={form.phone}
              onChangeText={(text) => setForm({ ...form, phone: text })}
              onFocus={() => setFocusedField("phone")}
              onBlur={() => {
                setFocusedField(null);
                markTouched("phone");
              }}
              keyboardType="phone-pad"
            />
            {getFieldHint("phone") ? (
              <ThemedText type="small" style={[styles.helperText, { color: theme.textSecondary }]}>
                {getFieldHint("phone")}
              </ThemedText>
            ) : null}
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(250).duration(500)} style={[styles.inputCard, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
            <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
              Email Address
            </ThemedText>
            <TextInput
              style={[styles.input, getInputStyle("email")]}
              placeholder="Enter your email"
              placeholderTextColor={theme.textSecondary}
              value={form.email}
              onChangeText={(text) => setForm({ ...form, email: text })}
              onFocus={() => setFocusedField("email")}
              onBlur={() => {
                setFocusedField(null);
                markTouched("email");
              }}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {getFieldHint("email") ? (
              <ThemedText type="small" style={[styles.helperText, { color: theme.warning }]}>
                {getFieldHint("email")}
              </ThemedText>
            ) : null}
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(255).duration(500)} style={[styles.inputCard, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
            <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
              Date of Birth
            </ThemedText>
            <Pressable
              onPress={() => setShowDatePicker(true)}
              style={[styles.input, getInputStyle("dob"), { justifyContent: 'center' }]}
            >
              <ThemedText style={{ color: form.dob ? theme.text : theme.textSecondary }}>
                {form.dob || "Select your date of birth"}
              </ThemedText>
            </Pressable>
            {showDatePicker && (
              <DateTimePicker
                value={form.dob ? new Date(form.dob) : new Date(2000, 0, 1)}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (selectedDate) {
                    const year = selectedDate.getFullYear();
                    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                    const day = String(selectedDate.getDate()).padStart(2, '0');
                    setForm({ ...form, dob: `${year}-${month}-${day}` });
                    markTouched("dob");
                  }
                }}
                maximumDate={new Date()}
              />
            )}
            {getFieldHint("dob") ? (
              <ThemedText type="small" style={[styles.helperText, { color: theme.warning }]}>
                {getFieldHint("dob")}
              </ThemedText>
            ) : null}
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(258).duration(500)} style={[styles.inputCard, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
            <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
              Residential Address
            </ThemedText>
            <TextInput
              style={[styles.input, getInputStyle("residentialAddress")]}
              placeholder="House number, street name"
              placeholderTextColor={theme.textSecondary}
              value={form.residentialAddress}
              onChangeText={(text) => setForm({ ...form, residentialAddress: text })}
              onFocus={() => setFocusedField("residentialAddress")}
              onBlur={() => {
                setFocusedField(null);
                markTouched("residentialAddress");
              }}
            />
            {getFieldHint("residentialAddress") ? (
              <ThemedText type="small" style={[styles.helperText, { color: theme.textSecondary }]}>
                {getFieldHint("residentialAddress")}
              </ThemedText>
            ) : null}
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(260).duration(500)} style={[styles.inputCard, { zIndex: 10, backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
            <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
              Church / Ministry
            </ThemedText>
            <View>
              <TextInput
                style={[styles.input, getInputStyle("churchName")]}
                placeholder="Search or enter church name"
                placeholderTextColor={theme.textSecondary}
                value={form.churchName}
                onChangeText={(text) => {
                  setForm({ ...form, churchName: text });
                  setChurchSearch(text);
                  setShowChurchDropdown(true);
                }}
                onFocus={() => {
                  setFocusedField("churchName");
                  setShowChurchDropdown(true);
                }}
                onBlur={() => {
                  setFocusedField(null);
                  markTouched("churchName");
                  setTimeout(() => setShowChurchDropdown(false), 200);
                }}
              />
              {showChurchDropdown && churchSearch.length > 0 && ZIM_CHURCHES.filter(c => c.toLowerCase().includes(churchSearch.toLowerCase())).length > 0 && (
                <View style={[styles.dropdown, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
                  <View style={{ maxHeight: 200, overflow: 'hidden' }}>
                    <Animated.View entering={FadeInUp.duration(300)}>
                      {ZIM_CHURCHES.filter(c => c.toLowerCase().includes(churchSearch.toLowerCase())).slice(0, 5).map((church, idx) => (
                        <Pressable
                          key={idx}
                          onPress={() => {
                            setForm({ ...form, churchName: church });
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
                          <ThemedText style={[styles.dropdownText, { color: theme.text }]}>{church}</ThemedText>
                        </Pressable>
                      ))}
                    </Animated.View>
                  </View>
                </View>
              )}
            </View>
            {getFieldHint("churchName") ? (
              <ThemedText type="small" style={[styles.helperText, { color: theme.textSecondary }]}>
                {getFieldHint("churchName")}
              </ThemedText>
            ) : null}
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(275).duration(500)} style={[styles.inputCard, { zIndex: 1, backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
            <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
              Password (min 6 chars)
            </ThemedText>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, getInputStyle("password"), { flex: 1 }]}
                placeholder="Enter your password"
                placeholderTextColor={theme.textSecondary}
                value={form.password}
                onChangeText={(text) => setForm({ ...form, password: text })}
                onFocus={() => setFocusedField("password")}
                onBlur={() => {
                  setFocusedField(null);
                  markTouched("password");
                }}
                secureTextEntry={!showPassword}
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Feather
                  name={showPassword ? "eye-off" : "eye"}
                  size={20}
                  color={theme.textSecondary}
                />
              </Pressable>
            </View>
            {getFieldHint("password") ? (
              <ThemedText type="small" style={[styles.helperText, { color: theme.warning }]}>
                {getFieldHint("password")}
              </ThemedText>
            ) : null}
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(300).duration(500)} style={[styles.inputCard, { zIndex: 1, backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
            <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
              Confirm Password
            </ThemedText>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, getInputStyle("confirmPassword"), { flex: 1 }]}
                placeholder="Confirm your password"
                placeholderTextColor={theme.textSecondary}
                value={form.confirmPassword}
                onChangeText={(text) => setForm({ ...form, confirmPassword: text })}
                onFocus={() => setFocusedField("confirmPassword")}
                onBlur={() => {
                  setFocusedField(null);
                  markTouched("confirmPassword");
                }}
                secureTextEntry={!showConfirmPassword}
              />
              <Pressable
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeIcon}
              >
                <Feather
                  name={showConfirmPassword ? "eye-off" : "eye"}
                  size={20}
                  color={theme.textSecondary}
                />
              </Pressable>
            </View>
            {form.confirmPassword.length > 0 && form.password === form.confirmPassword ? (
              <View style={styles.helperRow}>
                <Feather name="check-circle" size={14} color={theme.success} />
                <ThemedText type="small" style={[styles.helperTextInline, { color: theme.success }]}>
                  Passwords match
                </ThemedText>
              </View>
            ) : getFieldHint("confirmPassword") ? (
              <ThemedText type="small" style={[styles.helperText, { color: theme.warning }]}>
                {getFieldHint("confirmPassword")}
              </ThemedText>
            ) : null}
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(325).duration(500)} style={[styles.inputCard, { zIndex: 1, backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
            <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
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
            {getFieldHint("gender") ? (
              <ThemedText type="small" style={[styles.helperText, { color: theme.textSecondary }]}>
                {getFieldHint("gender")}
              </ThemedText>
            ) : null}
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(350).duration(500)} style={[styles.inputCard, { zIndex: 1, backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
            <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
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
            {getFieldHint("maritalStatus") ? (
              <ThemedText type="small" style={[styles.helperText, { color: theme.textSecondary }]}>
                {getFieldHint("maritalStatus")}
              </ThemedText>
            ) : null}
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(360).duration(500)} style={[styles.inputCard, { zIndex: 3, backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
            <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>Country</ThemedText>
            <TextInput
              style={[styles.input, getInputStyle("country")]}
              placeholder="e.g. Zimbabwe"
              placeholderTextColor={theme.textSecondary}
              value={form.country}
              onChangeText={(text) => setForm({ ...form, country: text })}
              onFocus={() => setFocusedField("country")}
              onBlur={() => {
                setFocusedField(null);
                markTouched("country");
              }}
            />
            {getFieldHint("country") ? (
              <ThemedText type="small" style={[styles.helperText, { color: theme.textSecondary }]}>
                {getFieldHint("country")}
              </ThemedText>
            ) : null}
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(370).duration(500)} style={[styles.inputCard, { zIndex: 10, backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
            <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>City/Town</ThemedText>
            <View>
              <TextInput
                style={[styles.input, getInputStyle("cityTown")]}
                placeholder="e.g. Harare"
                placeholderTextColor={theme.textSecondary}
                value={form.cityTown}
                onChangeText={(text) => {
                  setForm({ ...form, cityTown: text });
                  setCitySearch(text);
                  setShowCityDropdown(true);
                }}
                onFocus={() => {
                  setFocusedField("cityTown");
                  setShowCityDropdown(true);
                }}
                onBlur={() => {
                  setFocusedField(null);
                  markTouched("cityTown");
                  setTimeout(() => setShowCityDropdown(false), 200);
                }}
              />
              {showCityDropdown && ZIM_CITIES.filter(c => c.toLowerCase().includes(citySearch.toLowerCase())).length > 0 && (
                <View style={[styles.dropdown, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
                  <View style={{ maxHeight: 150, overflow: 'hidden' }}>
                    <Animated.View entering={FadeInUp.duration(300)}>
                      {ZIM_CITIES.filter(c => c.toLowerCase().includes(citySearch.toLowerCase())).slice(0, 5).map((city, idx) => (
                        <Pressable
                          key={idx}
                          onPress={() => {
                            setForm({ ...form, cityTown: city });
                            setCitySearch("");
                            setShowCityDropdown(false);
                          }}
                          style={({ pressed }) => [
                            styles.dropdownItem,
                            {
                              backgroundColor: pressed ? theme.border : "transparent",
                              borderBottomColor: theme.border,
                            }
                          ]}
                        >
                          <ThemedText style={[styles.dropdownText, { color: theme.text }]}>{city}</ThemedText>
                        </Pressable>
                      ))}
                    </Animated.View>
                  </View>
                </View>
              )}
            </View>
            {getFieldHint("cityTown") ? (
              <ThemedText type="small" style={[styles.helperText, { color: theme.textSecondary }]}>
                {getFieldHint("cityTown")}
              </ThemedText>
            ) : null}
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(375).duration(500)} style={[styles.inputCard, { zIndex: 9, backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
            <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>Province</ThemedText>
            <View>
              <TextInput
                style={[styles.input, getInputStyle("province")]}
                placeholder="e.g. Mashonaland East"
                placeholderTextColor={theme.textSecondary}
                value={form.province}
                onChangeText={(text) => {
                  setForm({ ...form, province: text });
                  setProvinceSearch(text);
                  setShowProvinceDropdown(true);
                }}
                onFocus={() => {
                  setFocusedField("province");
                  setShowProvinceDropdown(true);
                }}
                onBlur={() => {
                  setFocusedField(null);
                  markTouched("province");
                  setTimeout(() => setShowProvinceDropdown(false), 200);
                }}
              />
              {showProvinceDropdown && ZIM_PROVINCES.filter(p => p.toLowerCase().includes(provinceSearch.toLowerCase())).length > 0 && (
                <View style={[styles.dropdown, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
                  <View style={{ maxHeight: 150, overflow: 'hidden' }}>
                    <Animated.View entering={FadeInUp.duration(300)}>
                      {ZIM_PROVINCES.filter(p => p.toLowerCase().includes(provinceSearch.toLowerCase())).slice(0, 5).map((province, idx) => (
                        <Pressable
                          key={idx}
                          onPress={() => {
                            setForm({ ...form, province: province });
                            setProvinceSearch("");
                            setShowProvinceDropdown(false);
                          }}
                          style={({ pressed }) => [
                            styles.dropdownItem,
                            {
                              backgroundColor: pressed ? theme.border : "transparent",
                              borderBottomColor: theme.border,
                            }
                          ]}
                        >
                          <ThemedText style={[styles.dropdownText, { color: theme.text }]}>{province}</ThemedText>
                        </Pressable>
                      ))}
                    </Animated.View>
                  </View>
                </View>
              )}
            </View>
            {getFieldHint("province") ? (
              <ThemedText type="small" style={[styles.helperText, { color: theme.textSecondary }]}>
                {getFieldHint("province")}
              </ThemedText>
            ) : null}
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(380).duration(500)} style={[styles.inputCard, { zIndex: 1, backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
            <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>Suburb</ThemedText>
            <TextInput
              style={[styles.input, getInputStyle("suburb")]}
              placeholder="e.g. Mabelreign"
              placeholderTextColor={theme.textSecondary}
              value={form.suburb}
              onChangeText={(text) => setForm({ ...form, suburb: text })}
              onFocus={() => setFocusedField("suburb")}
              onBlur={() => {
                setFocusedField(null);
                markTouched("suburb");
              }}
            />
            {getFieldHint("suburb") ? (
              <ThemedText type="small" style={[styles.helperText, { color: theme.textSecondary }]}>
                {getFieldHint("suburb")}
              </ThemedText>
            ) : null}
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
      </KeyboardAwareScrollViewCompat >
    </View >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D0D0D",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.xl,
  },
  introCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  introTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rolePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  progressTrack: {
    height: 6,
    borderRadius: BorderRadius.full,
    overflow: "hidden",
    marginTop: Spacing.xs,
  },
  progressFill: {
    height: "100%",
    borderRadius: BorderRadius.full,
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
    alignItems: "center",
    justifyContent: "center",
  },
  placeholder: {
    width: 44,
  },
  form: {
    gap: Spacing.md,
  },
  inputCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  label: {
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontSize: 11,
    marginLeft: Spacing.xs,
  },
  input: {
    height: 48,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    fontSize: 15,
  },
  helperText: {
    marginTop: 2,
    marginLeft: Spacing.xs,
  },
  helperRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: 2,
    marginLeft: Spacing.xs,
  },
  helperTextInline: {
    marginTop: 0,
  },
  selectRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  selectButton: {
    flex: 1,
    height: 48,
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
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  eyeIcon: {
    position: "absolute",
    right: Spacing.lg,
    height: "100%",
    justifyContent: "center",
  },
  dropdown: {
    position: "absolute",
    top: 60,
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
  dropdownText: {
    fontSize: 14,
  },
});
