import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { useRouter } from 'expo-router';
import { theme } from '../lib/theme';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useTenant } from '../hooks/useTenant';
import { ArrowLeft, ScanLine } from 'lucide-react-native';

export default function QRScannerScreen() {
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [scanned, setScanned] = useState(false);
    const [processing, setProcessing] = useState(false);
    const router = useRouter();
    const { profile } = useAuth();
    const { organization } = useTenant();

    useEffect(() => {
        const getCameraPermissions = async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
        };

        getCameraPermissions();
    }, []);

    const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
        if (scanned || processing) return;
        setScanned(true);
        setProcessing(true);

        try {
            // Expected payload from QR: JSON string { sessionId: 'string', organizationId: 'string' }
            // or maybe just the sessionId depending on how the web panel generates it.
            // Let's assume it's just the sessionId for simplicity or JSON
            let sessionId = data;

            try {
                const parsed = JSON.parse(data);
                if (parsed.sessionId) sessionId = parsed.sessionId;
            } catch (e) {
                // If not JSON, assume raw session ID
            }

            if (!profile || !organization) throw new Error('Auth context is missing.');

            const now = new Date().toISOString();

            // Marking attendance record
            const { error } = await supabase
                .from('attendance')
                .upsert([{
                    session_id: sessionId,
                    user_id: profile.id,
                    organization_id: organization.id,
                    checked_in: true,
                    checkin_time: now,
                    status: 'present',
                    checkin_method: 'qr',
                }], { onConflict: 'session_id,user_id' });

            if (error) throw error;

            Alert.alert(
                'Check-In Successful',
                'Your attendance has been recorded.',
                [{ text: 'OK', onPress: () => router.back() }]
            );

        } catch (error: any) {
            Alert.alert(
                'Invalid QR Code',
                'This QR code is invalid or not recognized for check-in: ' + error.message,
                [{ text: 'Scan Again', onPress: () => { setScanned(false); setProcessing(false); } }]
            );
        }
    };

    if (hasPermission === null) {
        return <View style={styles.container} />;
    }
    if (hasPermission === false) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.text}>No access to camera. Please enable permissions in your settings.</Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <CameraView
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: ["qr"],
                }}
                style={StyleSheet.absoluteFillObject}
            />

            <View style={styles.overlay}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
                        <ArrowLeft color="#fff" size={24} />
                    </TouchableOpacity>
                    <Text style={styles.title}>Scan Session QR</Text>
                    <View style={{ width: 40 }} />
                </View>

                <View style={styles.scannerFrame}>
                    <ScanLine color={theme.colors.primary} size={250} style={{ opacity: 0.5 }} />
                </View>

                <View style={styles.footer}>
                    <Text style={styles.instructionText}>
                        Center the session QR code within the frame to automatically mark your attendance.
                    </Text>
                    {processing && (
                        <View style={styles.processingPill}>
                            <ActivityIndicator size="small" color={theme.colors.primary} />
                            <Text style={styles.processingText}>Verifying Check-In...</Text>
                        </View>
                    )}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    centerContainer: {
        flex: 1,
        backgroundColor: theme.colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    text: {
        color: '#fff',
        textAlign: 'center',
        marginBottom: 20,
    },
    backButton: {
        padding: 12,
        backgroundColor: theme.colors.card,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    backButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'space-between',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 50,
        paddingHorizontal: 20,
    },
    iconBtn: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 20,
    },
    title: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    scannerFrame: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    footer: {
        padding: 40,
        alignItems: 'center',
    },
    instructionText: {
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
        fontSize: 12,
        lineHeight: 18,
    },
    processingPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        marginTop: 20,
        gap: 10,
    },
    processingText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    }
});
