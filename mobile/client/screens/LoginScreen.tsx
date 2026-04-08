import React, { useState } from "react";
import { View, StyleSheet, TextInput, KeyboardAvoidingView, Platform, ScrollView, Alert, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { storage } from "@/lib/storage";
import { AuthStackParamList } from "@/navigation/AuthStackNavigator";

type Props = {
    navigation: NativeStackNavigationProp<AuthStackParamList, "Login">;
};

export default function LoginScreen({ navigation }: Props) {
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const { login } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async () => {
        if (!email.trim() || !password) {
            Alert.alert("Error", "Please enter email and password");
            return;
        }

        setIsLoading(true);
        try {
            const user = await storage.login({ email: email.trim(), password });
            await login(user);
        } catch (error: any) {
            Alert.alert("Login Failed", error.message || "Invalid credentials");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <ScrollView
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + Spacing.xl }]}
                keyboardShouldPersistTaps="handled"
            >
                <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.header}>
                    <View style={[styles.iconContainer, { backgroundColor: theme.link + "20" }]}>
                        <Feather name="log-in" size={32} color={theme.link} />
                    </View>
                    <ThemedText type="h1" style={styles.title}>Welcome Back</ThemedText>
                    <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "center" }}>
                        Sign in to continue to BE THAT MAN
                    </ThemedText>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.form}>
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

                    <ThemedText type="h4" style={styles.label}>Password</ThemedText>
                    <View style={styles.passwordContainer}>
                        <TextInput
                            value={password}
                            onChangeText={setPassword}
                            placeholder="Enter your password"
                            placeholderTextColor={theme.textSecondary}
                            secureTextEntry={!showPassword}
                            autoComplete="password"
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

                    <Button onPress={handleLogin} disabled={isLoading} style={styles.button}>
                        {isLoading ? "Signing in..." : "Sign In"}
                    </Button>

                    <View style={styles.signupRow}>
                        <ThemedText type="body" style={{ color: theme.textSecondary }}>
                            Don't have an account?{" "}
                        </ThemedText>
                        <ThemedText
                            type="body"
                            style={{ color: theme.link, fontWeight: "600" }}
                            onPress={() => navigation.navigate("Welcome")}
                        >
                            Sign Up
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
        justifyContent: "center",
    },
    header: {
        alignItems: "center",
        marginBottom: Spacing["3xl"],
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
        marginBottom: Spacing.xl,
    },
    button: {
        marginTop: Spacing.lg,
    },
    signupRow: {
        flexDirection: "row",
        justifyContent: "center",
        marginTop: Spacing.xl,
    },
    passwordContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: Spacing.xl,
    },
    eyeIcon: {
        position: "absolute",
        right: Spacing.lg,
        height: "100%",
        justifyContent: "center",
        paddingLeft: Spacing.md,
    },
});
