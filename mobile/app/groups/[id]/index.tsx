import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';
import { theme } from '../../../lib/theme';
import { ArrowLeft, CheckCircle2, XCircle, Users, QrCode, Lock, ShieldAlert } from 'lucide-react-native';
import { Camera, CameraView } from 'expo-camera';

interface Member {
    id: string;
    first_name: string;
    surname: string;
    profile_photo_url?: string;
    attendance_status: 'present' | 'absent' | 'excused' | null;
}

export default function CellMeetingRegisterScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { profile } = useAuth();

    const [meeting, setMeeting] = useState<any>(null);
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [marking, setMarking] = useState<string | null>(null);
    const [closing, setClosing] = useState(false);

    // QR Scanner state
    const [tab, setTab] = useState<'manual' | 'qr'>('manual');
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [scanned, setScanned] = useState(false);
    const [scanResult, setScanResult] = useState<{ success: boolean; name: string } | null>(null);

    useEffect(() => {
        if (id) fetchMeetingData();
    }, [id]);

    useEffect(() => {
        if (tab === 'qr' && hasPermission === null) {
            (async () => {
                const { status } = await Camera.requestCameraPermissionsAsync();
                setHasPermission(status === 'granted');
            })();
        }
    }, [tab]);

    const fetchMeetingData = async () => {
        setLoading(true);
        try {
            const { data: m, error: me } = await supabase
                .from('cell_meetings')
                .select('id, title, scheduled_date, status, group_id, group:program_groups(name)')
                .eq('id', id)
                .single();

            if (me || !m) throw new Error('Meeting not found.');
            setMeeting(m);

            const { data: gm } = await supabase
                .from('group_members')
                .select('user_id, users(id, first_name, surname, profile_photo_url)')
                .eq('group_id', m.group_id);

            const { data: att } = await supabase
                .from('cell_attendance')
                .select('user_id, status')
                .eq('meeting_id', id);

            const attMap: Record<string, any> = {};
            (att || []).forEach((a: any) => { attMap[a.user_id] = a.status; });

            const formatted: Member[] = (gm || []).map((row: any) => {
                const u = Array.isArray(row.users) ? row.users[0] : row.users;
                return {
                    id: u?.id,
                    first_name: u?.first_name || '',
                    surname: u?.surname || '',
                    profile_photo_url: u?.profile_photo_url,
                    attendance_status: attMap[u?.id] || null,
                };
            }).filter(m => m.id);

            setMembers(formatted);
        } catch (err: any) {
            Alert.alert('Error', err.message);
        } finally {
            setLoading(false);
        }
    };

    const markAttendance = async (userId: string, status: 'present' | 'absent' | 'excused', method: 'manual' | 'qr' = 'manual') => {
        if (meeting?.status === 'closed') return;
        setMarking(userId);
        try {
            await supabase
                .from('cell_attendance')
                .upsert({
                    meeting_id: id,
                    user_id: userId,
                    status,
                    checkin_method: method,
                    marked_by: profile?.id,
                    marked_at: new Date().toISOString(),
                }, { onConflict: 'meeting_id,user_id' });

            setMembers(prev => prev.map(m => m.id === userId ? { ...m, attendance_status: status } : m));
        } catch (err: any) {
            console.error('Attendance Error', err);
        } finally {
            setMarking(null);
        }
    };

    const handleCloseMeeting = async () => {
        Alert.alert(
            'Close Meeting',
            'Are you sure you want to close this register? You will not be able to mark further attendance.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Close Register',
                    style: 'destructive',
                    onPress: async () => {
                        setClosing(true);
                        try {
                            await supabase.from('cell_meetings').update({ status: 'closed' }).eq('id', id);
                            setMeeting((prev: any) => ({ ...prev, status: 'closed' }));
                        } catch (err) {
                            console.error(err);
                        } finally {
                            setClosing(false);
                        }
                    }
                }
            ]
        );
    };

    const handleBarCodeScanned = async ({ data }: { data: string }) => {
        if (scanned || meeting?.status === 'closed') return;
        setScanned(true);

        const userId = data.startsWith('user-') ? data.replace('user-', '') : data;
        const member = members.find(m => m.id === userId);

        if (!member) {
            setScanResult({ success: false, name: 'Unknown participant' });
        } else {
            await markAttendance(userId, 'present', 'qr');
            setScanResult({ success: true, name: `${member.first_name} ${member.surname}` });
        }

        setTimeout(() => {
            setScanResult(null);
            setScanned(false);
        }, 2000);
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    const presentCount = members.filter(m => m.attendance_status === 'present').length;
    const totalCount = members.length;
    const pct = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <ArrowLeft size={20} color={theme.colors.text} />
                </TouchableOpacity>
                <View style={{ flex: 1, marginLeft: 16 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={styles.title} numberOfLines={1}>{meeting?.title || 'Meeting Register'}</Text>
                        {meeting?.status === 'closed' && (
                            <View style={styles.closedBadge}>
                                <Lock size={10} color={theme.colors.textMuted} />
                                <Text style={styles.closedBadgeText}>Closed</Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.subtitle}>
                        {meeting?.group?.name} • {meeting?.scheduled_date ? new Date(meeting.scheduled_date).toLocaleDateString() : ''}
                    </Text>
                </View>
            </View>

            {/* Stats */}
            <View style={styles.statsContainer}>
                <View style={styles.statBox}>
                    <Text style={styles.statValue}>{totalCount}</Text>
                    <Text style={styles.statLabel}>Total</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={[styles.statValue, { color: theme.colors.success }]}>{presentCount}</Text>
                    <Text style={styles.statLabel}>Present</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={[styles.statValue, { color: theme.colors.error }]}>{members.filter(m => m.attendance_status === 'absent').length}</Text>
                    <Text style={styles.statLabel}>Absent</Text>
                </View>
            </View>

            <View style={styles.progressContainer}>
                <View style={styles.progressLabelRow}>
                    <Text style={styles.progressLabel}>Attendance Rate</Text>
                    <Text style={[styles.progressLabel, { color: pct >= 50 ? theme.colors.success : theme.colors.error }]}>{pct}%</Text>
                </View>
                <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${pct}%`, backgroundColor: pct >= 50 ? theme.colors.success : theme.colors.error }]} />
                </View>
            </View>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
                <TouchableOpacity
                    style={[styles.tab, tab === 'manual' && styles.tabActive]}
                    onPress={() => setTab('manual')}
                >
                    <Text style={[styles.tabText, tab === 'manual' && styles.tabTextActive]}>Manual List</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, tab === 'qr' && styles.tabActive]}
                    onPress={() => setTab('qr')}
                >
                    <Text style={[styles.tabText, tab === 'qr' && styles.tabTextActive]}>QR Scan</Text>
                </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40, gap: 12 }}>
                {tab === 'manual' ? (
                    members.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Users size={32} color={theme.colors.textMuted} />
                            <Text style={styles.emptyStateText}>No members found</Text>
                        </View>
                    ) : (
                        members.map(member => (
                            <View key={member.id} style={styles.memberCard}>
                                <View style={styles.memberInfo}>
                                    <View style={styles.avatar}>
                                        <Text style={styles.avatarText}>{member.first_name[0]}{member.surname[0]}</Text>
                                    </View>
                                    <View>
                                        <Text style={styles.memberName}>{member.first_name} {member.surname}</Text>
                                        {member.attendance_status && (
                                            <Text style={[styles.statusBadge,
                                            member.attendance_status === 'present' ? { color: theme.colors.success }
                                                : member.attendance_status === 'absent' ? { color: theme.colors.error }
                                                    : { color: theme.colors.warning }
                                            ]}>
                                                {member.attendance_status}
                                            </Text>
                                        )}
                                    </View>
                                </View>
                                {meeting?.status === 'open' ? (
                                    <View style={styles.actions}>
                                        <TouchableOpacity
                                            style={[styles.actionBtn, member.attendance_status === 'present' ? styles.actionBtnActivePresent : null]}
                                            onPress={() => markAttendance(member.id, 'present')}
                                            disabled={marking === member.id}
                                        >
                                            <CheckCircle2 size={16} color={member.attendance_status === 'present' ? '#fff' : theme.colors.success} />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.actionBtn, member.attendance_status === 'absent' ? styles.actionBtnActiveAbsent : null]}
                                            onPress={() => markAttendance(member.id, 'absent')}
                                            disabled={marking === member.id}
                                        >
                                            <XCircle size={16} color={member.attendance_status === 'absent' ? '#fff' : theme.colors.error} />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.actionBtn, member.attendance_status === 'excused' ? styles.actionBtnActiveExcused : null]}
                                            onPress={() => markAttendance(member.id, 'excused')}
                                            disabled={marking === member.id}
                                        >
                                            <ShieldAlert size={16} color={member.attendance_status === 'excused' ? '#fff' : theme.colors.warning} />
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <View style={styles.actions}>
                                        <Text style={styles.readOnlyStatus}>{member.attendance_status || 'Unmarked'}</Text>
                                    </View>
                                )}
                            </View>
                        ))
                    )
                ) : (
                    // QR Scanner Tab
                    <View style={styles.qrContainer}>
                        {meeting?.status === 'closed' ? (
                            <View style={styles.emptyState}>
                                <Lock size={32} color={theme.colors.textMuted} />
                                <Text style={styles.emptyStateText}>Meeting is closed — QR scanning disabled</Text>
                            </View>
                        ) : hasPermission === false ? (
                            <Text style={styles.emptyStateText}>No camera access granted</Text>
                        ) : (
                            <View style={styles.scannerWrapper}>
                                {scanResult ? (
                                    <View style={styles.scanResultContainer}>
                                        {scanResult.success ? <CheckCircle2 size={48} color={theme.colors.success} /> : <XCircle size={48} color={theme.colors.error} />}
                                        <Text style={styles.scanResultTitle}>{scanResult.success ? 'Marked Present' : 'Not Found'}</Text>
                                        <Text style={[styles.scanResultName, { color: scanResult.success ? theme.colors.success : theme.colors.error }]}>
                                            {scanResult.name}
                                        </Text>
                                    </View>
                                ) : (
                                    <CameraView
                                        style={StyleSheet.absoluteFillObject}
                                        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                                        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                                    />
                                )}
                                <View style={styles.scannerOverlay}>
                                    <QrCode size={200} color={theme.colors.primary} style={{ opacity: scanResult ? 0 : 0.5 }} />
                                </View>
                            </View>
                        )}
                        <Text style={styles.qrInstructions}>Ask participant to show their personal QR code</Text>
                    </View>
                )}
            </ScrollView>

            {meeting?.status === 'open' && (
                <View style={styles.footer}>
                    <TouchableOpacity style={styles.closeMeetingBtn} onPress={handleCloseMeeting} disabled={closing}>
                        {closing ? <ActivityIndicator size="small" color={theme.colors.error} /> : (
                            <>
                                <Lock size={16} color={theme.colors.error} />
                                <Text style={styles.closeMeetingText}>Close Register</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            )}
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
        padding: 20,
        paddingTop: 60,
        backgroundColor: theme.colors.card,
        borderBottomWidth: 1,
        borderColor: theme.colors.border,
    },
    backBtn: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    title: {
        color: theme.colors.text,
        fontSize: 18,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
        flex: 1,
    },
    subtitle: {
        color: theme.colors.textMuted,
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginTop: 4,
    },
    closedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    closedBadgeText: {
        color: theme.colors.textMuted,
        fontSize: 8,
        fontWeight: '900',
        textTransform: 'uppercase',
    },
    statsContainer: {
        flexDirection: 'row',
        padding: 20,
        gap: 12,
    },
    statBox: {
        flex: 1,
        backgroundColor: theme.colors.card,
        borderRadius: theme.borderRadius.md,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    statValue: {
        color: theme.colors.text,
        fontSize: 24,
        fontWeight: '900',
    },
    statLabel: {
        color: theme.colors.textMuted,
        fontSize: 8,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginTop: 4,
    },
    progressContainer: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    progressLabelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    progressLabel: {
        color: theme.colors.textMuted,
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    progressBarBg: {
        height: 6,
        backgroundColor: theme.colors.card,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    tabsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 16,
        gap: 12,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        backgroundColor: theme.colors.card,
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    tabActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    tabText: {
        color: theme.colors.textMuted,
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    tabTextActive: {
        color: '#fff',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.lg,
    },
    emptyStateText: {
        color: theme.colors.textMuted,
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginTop: 12,
    },
    memberCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: theme.colors.card,
        padding: 16,
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    memberInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: theme.colors.primary,
        fontSize: 12,
        fontWeight: '900',
    },
    memberName: {
        color: theme.colors.text,
        fontSize: 14,
        fontWeight: '900',
        textTransform: 'uppercase',
    },
    statusBadge: {
        fontSize: 8,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginTop: 4,
    },
    actions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionBtn: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    actionBtnActivePresent: {
        backgroundColor: theme.colors.success,
        borderColor: theme.colors.success,
    },
    actionBtnActiveAbsent: {
        backgroundColor: theme.colors.error,
        borderColor: theme.colors.error,
    },
    actionBtnActiveExcused: {
        backgroundColor: theme.colors.warning,
        borderColor: theme.colors.warning,
    },
    readOnlyStatus: {
        color: theme.colors.textMuted,
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 4,
    },
    qrContainer: {
        alignItems: 'center',
    },
    scannerWrapper: {
        width: '100%',
        aspectRatio: 1,
        borderRadius: theme.borderRadius.lg,
        overflow: 'hidden',
        backgroundColor: '#000',
        position: 'relative',
    },
    scannerOverlay: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scanResultContainer: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.card,
        zIndex: 10,
    },
    scanResultTitle: {
        color: theme.colors.text,
        fontSize: 20,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginTop: 16,
    },
    scanResultName: {
        fontSize: 12,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginTop: 8,
    },
    qrInstructions: {
        color: theme.colors.primary,
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginTop: 16,
        textAlign: 'center',
    },
    footer: {
        padding: 20,
        backgroundColor: theme.colors.card,
        borderTopWidth: 1,
        borderColor: theme.colors.border,
    },
    closeMeetingBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        paddingVertical: 16,
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    closeMeetingText: {
        color: theme.colors.error,
        fontSize: 12,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
    }
});
