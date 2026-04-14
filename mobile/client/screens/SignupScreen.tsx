import React, { useState } from "react";
import {
    View,
    StyleSheet,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { storage, UserRole } from "@/lib/storage";
import { AuthStackParamList } from "@/navigation/AuthStackNavigator";

type Props = {
    navigation: NativeStackNavigationProp<AuthStackParamList, "Signup">;
};

export default function SignupScreen({ navigation }: Props) {
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const { login } = useAuth();
    const { error, success } = useToast();
    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [dob, setDob] = useState("");
    const [password, setPassword] = useState("");
    const [gender, setGender] = useState<"male" | "female" | null>(null);
    const [maritalStatus, setMaritalStatus] = useState<"married" | "unmarried" | null>(null);
    const [role, setRole] = useState<UserRole | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSignup = async () => {
        if (!fullName.trim() || !phone.trim() || !email.trim() || !dob.trim() || !password) {
            error("Please fill in all fields");
            return;
        }

        if (!gender || !maritalStatus || !role) {
            error("Please select gender, marital status, and role");
            return;
        }

        if (password.length < 6) {
            error("Password must be at least 6 characters");
            return;
        }

        setIsLoading(true);
        try {
            const user = await storage.signup({
                fullName: fullName.trim(),
                phone: phone.trim(),
                email: email.trim(),
                dob: dob.trim(),
                password,
                gender,
                maritalStatus,
                role,
            });

            success("Account created successfully!");
            // Log in the user
            await login(user);
        } catch (err: any) {
            error(err.message || "Failed to create account");
        } finally {
            setIsLoading(false);
        }
    };

    const renderOptionButton = (
        value: string,
        selected: boolean,
        icon: string,
        onPress: () => void
    ) => (
        <Pressable
            onPress={onPress}
            style={[
                styles.optionButton,
                {
                    backgroundColor: selected ? theme.link + "20" : theme.backgroundSecondary,
                    borderColor: selected ? theme.link : theme.border,
                },
            ]}
        >
            <Feather
                name={icon as any}
                size={20}
                color={selected ? theme.link : theme.textSecondary}
            />
            <ThemedText
                type="body"
                style={{
                    color: selected ? theme.link : theme.text,
                    fontWeight: selected ? "600" : "400",
                    marginLeft: Spacing.sm,
                }}
            >
                {value}
            </ThemedText>
        </Pressable>
    );

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <ScrollView
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + Spacing.xl }]}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.header}>
                    <View style={[styles.iconContainer, { backgroundColor: theme.link + "20" }]}>
                        <Feather name="user-plus" size={32} color={theme.link} />
                    </View>
                    <ThemedText type="h1" style={styles.title}>Create Account</ThemedText>
                    <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "center" }}>
                        Join BE THAT MAN today
                    </ThemedText>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.form}>
                    <ThemedText type="h4" style={styles.label}>Full Name</ThemedText>
                    <TextInput
                        value={fullName}
                        onChangeText={setFullName}
                        placeholder="John Doe"
                        placeholderTextColor={theme.textSecondary}
                        autoComplete="name"
                        style={[
                            styles.input,
                            { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border },
                        ]}
                    />

                    <ThemedText type="h4" style={styles.label}>Phone</ThemedText>
                    <TextInput
                        value={phone}
                        onChangeText={setPhone}
                        placeholder="+1234567890"
                        placeholderTextColor={theme.textSecondary}
                        keyboardType="phone-pad"
                        autoComplete="tel"
                        style={[
                            styles.input,
                            { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border },
                        ]}
                    />

                    <ThemedText type="h4" style={styles.label}>Email</ThemedText>
                    <TextInput
                        value={email}
                        onChangeText={setEmail}
                        placeholder="your@email.com"
                        placeholderTextColor={theme.textSecondary}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        style={[
                            styles.input,
                            { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border },
                        ]}
                    />

                    <ThemedText type="h4" style={styles.label}>Date of Birth</ThemedText>
                    <TextInput
                        value={dob}
                        onChangeText={setDob}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={theme.textSecondary}
                        keyboardType="numbers-and-punctuation"
                        style={[
                            styles.input,
                            { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border },
                        ]}
                    />

                    <ThemedText type="h4" style={styles.label}>Password</ThemedText>
                    <View style={styles.passwordContainer}>
                        <TextInput
                            value={password}
                            onChangeText={setPassword}
                            placeholder="At least 6 characters"
                            placeholderTextColor={theme.textSecondary}
                            secureTextEntry={!showPassword}
                            autoComplete="password-new"
                            style={[
                                styles.input,
                                { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border, flex: 1, marginBottom: 0 },
                            ]}
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

                    <ThemedText type="h4" style={styles.label}>Gender</ThemedText>
                    <View style={styles.optionsRow}>
                        {renderOptionButton("Male", gender === "male", "user", () => setGender("male"))}
                        {renderOptionButton("Female", gender === "female", "user", () => setGender("female"))}
                    </View>

                    <ThemedText type="h4" style={styles.label}>Marital Status</ThemedText>
                    <View style={styles.optionsRow}>
                        {renderOptionButton("Married", maritalStatus === "married", "heart", () => setMaritalStatus("married"))}
                        {renderOptionButton("Unmarried", maritalStatus === "unmarried", "user", () => setMaritalStatus("unmarried"))}
                    </View>

                    <ThemedText type="h4" style={styles.label}>Role</ThemedText>
                    <View style={styles.optionsColumn}>
                        {renderOptionButton("Participant", role === "participant", "user", () => setRole("participant"))}
                        {renderOptionButton("Leader", role === "leader", "users", () => setRole("leader"))}
                        {renderOptionButton("Facilitator", role === "facilitator", "award", () => setRole("facilitator"))}
                    </View>

                    <Button onPress={handleSignup} disabled={isLoading} style={styles.button}>
                        {isLoading ? "Joining..." : "Join"}
                    </Button>

                    <View style={styles.loginRow}>
                        <ThemedText type="body" style={{ color: theme.textSecondary }}>
                            Already have an account?{" "}
                        </ThemedText>
                        <ThemedText
                            type="body"
                            style={{ color: theme.link, fontWeight: "600" }}
                            onPress={() => navigation.navigate("Login")}
                        >
                            Sign In
                        </ThemedText>
                    </View>
                </Animated.View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing["2xl"],
    },
    header: {
        alignItems: "center",
        marginBottom: Spacing.xl,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: Spacing.lg,
    },
    title: {
        marginBottom: Spacing.sm,
    },
    form: {
        width: "100%",
    },
    label: {
        marginBottom: Spacing.sm,
    },
    input: {
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        padding: Spacing.lg,
        fontSize: 16,
        marginBottom: Spacing.lg,
    },
    optionsRow: {
        flexDirection: "row",
        gap: Spacing.md,
        marginBottom: Spacing.lg,
    },
    optionsColumn: {
        gap: Spacing.sm,
        marginBottom: Spacing.lg,
    },
    optionButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 2,
    },
    button: {
        marginTop: Spacing.lg,
    },
    loginRow: {
        flexDirection: "row",
        justifyContent: "center",
        marginTop: Spacing.xl,
    },
    passwordContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: Spacing.lg,
    },
    eyeIcon: {
        position: "absolute",
        right: Spacing.lg,
        height: "100%",
        justifyContent: "center",
        paddingLeft: Spacing.md,
    },
});
