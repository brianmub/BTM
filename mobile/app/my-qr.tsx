import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useRouter } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { theme } from '../lib/theme';
import { ArrowLeft, UserCircle2 } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function MyQRScreen() {
    const { profile } = useAuth();
    const router = useRouter();

    const qrValue = profile?.id ? `user-${profile.id}` : 'no-id';

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
                    <ArrowLeft color={theme.colors.text} size={24} />
                </TouchableOpacity>
                <View>
                    <Text style={styles.title}>Identity Token</Text>
                    <Text style={styles.subtitle}>Digital credentials & verification</Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.content}>
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <UserCircle2 size={32} color={theme.colors.primary} />
                        <Text style={styles.cardTitle}>
                            {profile?.first_name} {profile?.surname}
                        </Text>
                        <Text style={styles.cardSubtitle}>Participant ID</Text>
                    </View>

                    <View style={styles.qrContainer}>
                        <QRCode
                            value={qrValue}
                            size={width * 0.65}
                            color="#fff"
                            backgroundColor={theme.colors.background}
                            logoBackgroundColor="transparent"
                        />
                    </View>

                    <View style={styles.signalBox}>
                        <View style={styles.signalDot} />
                        <Text style={styles.signalText}>Active Verification Signal</Text>
                    </View>
                </View>

                <View style={styles.noticeBox}>
                    <Text style={styles.noticeTitle}>Privacy Notice</Text>
                    <Text style={styles.noticeText}>
                        This encrypted token is unique to your profile. Do not share or screenshot for 3rd party use.
                    </Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    iconBtn: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    title: {
        color: theme.colors.text,
        fontSize: 18,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
        textAlign: 'center',
    },
    subtitle: {
        color: theme.colors.textMuted,
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
        textAlign: 'center',
        marginTop: 4,
    },
    content: {
        flex: 1,
        padding: 20,
        alignItems: 'center',
    },
    card: {
        backgroundColor: theme.colors.card,
        width: '100%',
        borderRadius: theme.borderRadius.xl,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: 30,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        marginBottom: 30,
    },
    cardHeader: {
        alignItems: 'center',
        marginBottom: 30,
    },
    cardTitle: {
        color: theme.colors.text,
        fontSize: 20,
        fontWeight: '900',
        textTransform: 'uppercase',
        marginTop: 12,
    },
    cardSubtitle: {
        color: theme.colors.textMuted,
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginTop: 4,
    },
    qrContainer: {
        backgroundColor: theme.colors.background,
        padding: 20,
        borderRadius: theme.borderRadius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    signalBox: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 30,
        gap: 8,
    },
    signalDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: theme.colors.success,
    },
    signalText: {
        color: theme.colors.success,
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    noticeBox: {
        backgroundColor: 'rgba(220, 38, 38, 0.05)',
        padding: 20,
        borderRadius: theme.borderRadius.lg,
        borderWidth: 1,
        borderColor: 'rgba(220, 38, 38, 0.2)',
        width: '100%',
    },
    noticeTitle: {
        color: theme.colors.primary,
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: 8,
    },
    noticeText: {
        color: theme.colors.textMuted,
        fontSize: 10,
        lineHeight: 16,
        fontWeight: '500',
    },
});
