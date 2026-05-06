import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../lib/theme';
import { authService } from '../services/authService';

export default function SignUpScreen() {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [orgCode, setOrgCode] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSignUp = async () => {
        if (!firstName || !lastName || !email || !password || !orgCode) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters long');
            return;
        }

        setLoading(true);
        try {
            await authService.participantSignUp(firstName, lastName, email, password, orgCode);
            Alert.alert(
                'Success!',
                'Your account has been created. You can now access your organization\'s content.',
                [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
            );
        } catch (error: any) {
            Alert.alert('Sign Up Failed', error.message || 'An error occurred during sign up.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            <View style={styles.card}>
                <Text style={styles.title}>Join Organization</Text>
                <Text style={styles.subtitle}>Enter your details and the organization code to get started.</Text>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>First Name</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="John"
                        placeholderTextColor={theme.colors.textMuted}
                        value={firstName}
                        onChangeText={setFirstName}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Last Name</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Doe"
                        placeholderTextColor={theme.colors.textMuted}
                        value={lastName}
                        onChangeText={setLastName}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Email Address</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="you@example.com"
                        placeholderTextColor={theme.colors.textMuted}
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Organization Code</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. gracecity"
                        placeholderTextColor={theme.colors.textMuted}
                        value={orgCode}
                        onChangeText={setOrgCode}
                        autoCapitalize="none"
                    />
                    <Text style={styles.helperText}>This is usually the name of your organization, provided by your admin.</Text>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Password</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="••••••••"
                        placeholderTextColor={theme.colors.textMuted}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
                </View>

                <TouchableOpacity
                    style={styles.button}
                    onPress={handleSignUp}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color={theme.colors.text} />
                    ) : (
                        <Text style={styles.buttonText}>Sign Up</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.loginLink}
                    onPress={() => router.replace('/login')}
                    disabled={loading}
                >
                    <Text style={styles.loginLinkText}>Already have an account? <Text style={styles.loginLinkHighlight}>Sign In</Text></Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    contentContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: theme.spacing.lg,
    },
    card: {
        backgroundColor: theme.colors.card,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.xl,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.text,
        textAlign: 'center',
        marginBottom: theme.spacing.xs,
    },
    subtitle: {
        fontSize: 14,
        color: theme.colors.textMuted,
        textAlign: 'center',
        marginBottom: theme.spacing.xl,
    },
    inputGroup: {
        marginBottom: theme.spacing.md,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
    },
    input: {
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        color: theme.colors.text,
    },
    helperText: {
        fontSize: 11,
        color: theme.colors.textMuted,
        marginTop: 4,
    },
    button: {
        backgroundColor: theme.colors.primary,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        alignItems: 'center',
        marginTop: theme.spacing.sm,
    },
    buttonText: {
        color: theme.colors.text,
        fontSize: 16,
        fontWeight: '600',
    },
    loginLink: {
        marginTop: theme.spacing.lg,
        alignItems: 'center',
    },
    loginLinkText: {
        color: theme.colors.textMuted,
        fontSize: 14,
    },
    loginLinkHighlight: {
        color: theme.colors.primary,
        fontWeight: 'bold',
    }
});
