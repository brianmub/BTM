import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { theme } from '../../../lib/theme';
import { ArrowLeft, CalendarCheck, CheckCircle2, XCircle, Users } from 'lucide-react-native';

interface MeetingRecord {
    id: string;
    title: string;
    scheduled_date: string;
    status: 'open' | 'closed';
    present_count: number;
    absent_count: number;
    total_count: number;
}

export default function CellMeetingHistoryScreen() {
    const { id: groupId } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();

    const [groupName, setGroupName] = useState<string>('');
    const [meetings, setMeetings] = useState<MeetingRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (groupId) fetchHistory();
    }, [groupId]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const { data: groupData } = await supabase
                .from('program_groups')
                .select('name')
                .eq('id', groupId)
                .single();

            if (groupData) setGroupName(groupData.name);

            const { data: meetingsData, error } = await supabase
                .from('cell_meetings')
                .select('id, title, scheduled_date, status')
                .eq('group_id', groupId)
                .order('scheduled_date', { ascending: false });

            if (error) throw error;

            const meetingsWithStats = await Promise.all(
                (meetingsData || []).map(async (m: any) => {
                    const { data: att } = await supabase
                        .from('cell_attendance')
                        .select('status')
                        .eq('meeting_id', m.id);

                    const present = att?.filter((a: any) => a.status === 'present').length || 0;
                    const absent = att?.filter((a: any) => a.status === 'absent').length || 0;

                    return {
                        ...m,
                        present_count: present,
                        absent_count: absent,
                        total_count: (att?.length || 0),
                    };
                })
            );

            setMeetings(meetingsWithStats);
        } catch (err) {
            console.error('Error fetching history:', err);
        } finally {
            setLoading(false);
        }
    };

    const attendancePct = (m: MeetingRecord) =>
        m.total_count > 0 ? Math.round((m.present_count / m.total_count) * 100) : 0;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <ArrowLeft size={20} color={theme.colors.text} />
                </TouchableOpacity>
                <View style={{ flex: 1, marginLeft: 16 }}>
                    <Text style={styles.title} numberOfLines={1}>Meeting History</Text>
                    {groupName ? (
                        <Text style={styles.subtitle}>{groupName}</Text>
                    ) : null}
                </View>
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : meetings.length === 0 ? (
                <View style={styles.centerContainer}>
                    <CalendarCheck size={48} color={theme.colors.textMuted} />
                    <Text style={styles.emptyTitle}>No Meetings Yet</Text>
                    <Text style={styles.emptySubtitle}>Open your first meeting from the Cell Groups dashboard.</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.content}>
                    {meetings.map((m) => {
                        const pct = attendancePct(m);
                        const isGood = pct >= 75;
                        const isFair = pct >= 50 && pct < 75;
                        const pctColor = isGood ? theme.colors.success : isFair ? theme.colors.warning : theme.colors.error;

                        return (
                            <TouchableOpacity
                                key={m.id}
                                style={styles.card}
                                onPress={() => router.push(`/groups/${m.id}`)}
                            >
                                <View style={styles.cardHeader}>
                                    <View style={styles.iconBox}>
                                        <CalendarCheck size={20} color={theme.colors.primary} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.cardTitle}>{m.title || `Meeting — ${m.scheduled_date}`}</Text>
                                        <Text style={styles.cardDate}>{new Date(m.scheduled_date).toLocaleDateString()}</Text>
                                        <View style={[styles.statusBadge, m.status === 'open' ? styles.statusBadgeOpen : styles.statusBadgeClosed]}>
                                            <Text style={[styles.statusText, m.status === 'open' ? styles.statusTextOpen : styles.statusTextClosed]}>
                                                {m.status}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.pctBox}>
                                        <Text style={[styles.pctValue, { color: pctColor }]}>{pct}%</Text>
                                        <Text style={styles.pctLabel}>Attendance</Text>
                                    </View>
                                </View>

                                {m.total_count > 0 && (
                                    <View style={styles.statsContainer}>
                                        <View style={styles.statsRow}>
                                            <View style={styles.statItem}>
                                                <CheckCircle2 size={12} color={theme.colors.success} />
                                                <Text style={[styles.statItemText, { color: theme.colors.success }]}>{m.present_count} Present</Text>
                                            </View>
                                            <View style={styles.statItem}>
                                                <XCircle size={12} color={theme.colors.textMuted} />
                                                <Text style={styles.statItemText}>{m.absent_count} Absent</Text>
                                            </View>
                                            <View style={styles.statItem}>
                                                <Users size={12} color={theme.colors.textMuted} />
                                                <Text style={styles.statItemText}>{m.total_count} Total</Text>
                                            </View>
                                        </View>
                                        <View style={styles.progressBarBg}>
                                            <View style={[styles.progressBarFill, { width: `${pct}%`, backgroundColor: pctColor }]} />
                                        </View>
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
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
    },
    subtitle: {
        color: theme.colors.textMuted,
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginTop: 4,
    },
    emptyTitle: {
        color: theme.colors.text,
        fontSize: 14,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginTop: 16,
    },
    emptySubtitle: {
        color: theme.colors.textMuted,
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
        textAlign: 'center',
        marginTop: 8,
    },
    content: {
        padding: 20,
        gap: 16,
    },
    card: {
        backgroundColor: theme.colors.card,
        borderRadius: theme.borderRadius.md,
        padding: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
    },
    cardTitle: {
        color: theme.colors.text,
        fontSize: 14,
        fontWeight: '900',
        textTransform: 'uppercase',
    },
    cardDate: {
        color: theme.colors.textMuted,
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginTop: 4,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        marginTop: 8,
        borderWidth: 1,
    },
    statusBadgeOpen: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderColor: 'rgba(16, 185, 129, 0.2)',
    },
    statusBadgeClosed: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    statusText: {
        fontSize: 8,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    statusTextOpen: {
        color: theme.colors.success,
    },
    statusTextClosed: {
        color: theme.colors.textMuted,
    },
    pctBox: {
        alignItems: 'flex-end',
    },
    pctValue: {
        fontSize: 24,
        fontWeight: '900',
    },
    pctLabel: {
        color: theme.colors.textMuted,
        fontSize: 8,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    statsContainer: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderColor: theme.colors.border,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statItemText: {
        color: theme.colors.textMuted,
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    progressBarBg: {
        height: 4,
        backgroundColor: theme.colors.background,
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 2,
    }
});
