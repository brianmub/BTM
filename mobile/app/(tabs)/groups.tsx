import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Modal, Alert } from 'react-native';
import { theme } from '../../lib/theme';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useTenant } from '../../hooks/useTenant';
import { useRouter } from 'expo-router';
import { Users, CalendarPlus, History, ClipboardList, Calendar, X, MapPin, Clock } from 'lucide-react-native';

export default function GroupsScreen() {
    const { profile } = useAuth();
    const { organization } = useTenant();
    const router = useRouter();

    const [groups, setGroups] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [scheduleGroup, setScheduleGroup] = useState<any>(null);

    const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().split('T')[0]);
    const [scheduleTime, setScheduleTime] = useState('18:00');
    const [scheduleVenue, setScheduleVenue] = useState('');
    const [scheduleNotes, setScheduleNotes] = useState('');
    const [scheduling, setScheduling] = useState(false);

    const handleScheduleMeeting = async () => {
        if (!scheduleGroup || !organization || !profile) return;
        setScheduling(true);
        try {
            const formattedDate = new Date(scheduleDate).toLocaleDateString('en-ZA', {
                day: 'numeric', month: 'long', year: 'numeric'
            });
            const { data, error } = await supabase
                .from('cell_meetings')
                .insert([{
                    group_id: scheduleGroup.id,
                    organization_id: organization.id,
                    scheduled_date: scheduleDate,
                    meeting_time: scheduleTime,
                    title: `${scheduleGroup.name} — ${formattedDate}`,
                    venue: scheduleVenue || null,
                    notes: scheduleNotes || null,
                    status: 'open',
                    created_by: profile.id,
                }])
                .select()
                .single();

            if (error) throw error;
            setScheduleGroup(null);
            router.push(`/groups/${data.id}`);
        } catch (err: any) {
            Alert.alert('Error', err.message);
        } finally {
            setScheduling(false);
        }
    };

    useEffect(() => {
        if (organization && profile) fetchMyGroups();
    }, [organization, profile]);

    const fetchMyGroups = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('program_groups')
                .select(`
                    id,
                    name,
                    description,
                    max_capacity,
                    members:group_members(count)
                `)
                .eq('organization_id', organization!.id)
                .or(`facilitator_id.eq.${profile!.id},second_facilitator_id.eq.${profile!.id}`);

            if (error) throw error;

            const groupsWithMeetings = await Promise.all(
                (data || []).map(async (g: any) => {
                    const { data: meetings } = await supabase
                        .from('cell_meetings')
                        .select('id, scheduled_date, status')
                        .eq('group_id', g.id)
                        .order('scheduled_date', { ascending: false })
                        .limit(5);

                    const openMeeting = meetings?.find((m: any) => m.status === 'open');
                    const lastClosed = meetings?.find((m: any) => m.status === 'closed');

                    return {
                        ...g,
                        member_count: g.members[0]?.count || 0,
                        last_meeting_date: lastClosed?.scheduled_date || null,
                        open_meeting_id: openMeeting?.id || null,
                    };
                })
            );

            setGroups(groupsWithMeetings);
        } catch (err) {
            console.error('Error fetching cell groups:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.title}>Cell Groups</Text>
                    <Text style={styles.subtitle}>Your small groups — schedule meetings & track attendance</Text>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
                ) : groups.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Users size={48} color={theme.colors.textMuted} />
                        <Text style={styles.emptyTitle}>No Groups Assigned</Text>
                        <Text style={styles.emptyText}>Ask your program admin to assign you to a cell group.</Text>
                    </View>
                ) : (
                    <View style={styles.grid}>
                        {groups.map((group) => (
                            <View key={group.id} style={styles.card}>
                                <View style={styles.cardHeaderRow}>
                                    <View style={styles.iconBox}>
                                        <Users size={20} color={theme.colors.primary} />
                                    </View>
                                    {group.open_meeting_id && (
                                        <View style={styles.openBadge}>
                                            <Text style={styles.openBadgeText}>Meeting Open</Text>
                                        </View>
                                    )}
                                </View>

                                <View style={styles.cardTitleSection}>
                                    <Text style={styles.cardTitle}>{group.name}</Text>
                                    <Text style={styles.cardDesc} numberOfLines={2}>
                                        {group.description || 'No description provided.'}
                                    </Text>
                                </View>

                                <View style={styles.statsRow}>
                                    <View style={styles.statBox}>
                                        <Text style={styles.statValue}>{group.member_count}</Text>
                                        <Text style={styles.statLabel}>Members</Text>
                                    </View>
                                    <View style={styles.statBox}>
                                        <Text style={styles.statValue}>{group.max_capacity || '∞'}</Text>
                                        <Text style={styles.statLabel}>Capacity</Text>
                                    </View>
                                    {group.last_meeting_date && (
                                        <View style={[styles.statBox, { alignItems: 'flex-end', flex: 1 }]}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                                <Calendar size={10} color={theme.colors.textMuted} />
                                                <Text style={styles.statLabel}>Last Meeting</Text>
                                            </View>
                                            <Text style={[styles.statValue, { fontSize: 12, marginTop: 2 }]}>
                                                {new Date(group.last_meeting_date).toLocaleDateString()}
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                <View style={styles.actionsRow}>
                                    {group.open_meeting_id ? (
                                        <TouchableOpacity
                                            style={styles.btnPrimary}
                                            onPress={() => router.push(`/groups/${group.open_meeting_id}`)}
                                        >
                                            <ClipboardList size={14} color="#fff" />
                                            <Text style={styles.btnPrimaryText}>Resume Register</Text>
                                        </TouchableOpacity>
                                    ) : (
                                        <TouchableOpacity
                                            style={styles.btnPrimary}
                                            onPress={() => setScheduleGroup(group)}
                                        >
                                            <CalendarPlus size={14} color="#fff" />
                                            <Text style={styles.btnPrimaryText}>Schedule Meeting</Text>
                                        </TouchableOpacity>
                                    )}
                                    <TouchableOpacity
                                        style={styles.btnOutline}
                                        onPress={() => router.push(`/groups/${group.id}/history`)}
                                    >
                                        <History size={16} color={theme.colors.text} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>

            <Modal
                visible={!!scheduleGroup}
                transparent
                animationType="fade"
                onRequestClose={() => setScheduleGroup(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <TouchableOpacity style={styles.modalClose} onPress={() => setScheduleGroup(null)}>
                            <X size={20} color={theme.colors.textMuted} />
                        </TouchableOpacity>

                        <View style={styles.modalHeader}>
                            <View style={styles.modalIconBox}>
                                <CalendarPlus size={20} color={theme.colors.primary} />
                            </View>
                            <Text style={styles.modalTitle}>Schedule Meeting</Text>
                            <Text style={styles.modalSubtitle}>{scheduleGroup?.name}</Text>
                        </View>

                        <ScrollView style={styles.formScroll}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>
                                    <Calendar size={10} color={theme.colors.textMuted} /> Date (YYYY-MM-DD)
                                </Text>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="e.g. 2024-10-15"
                                    placeholderTextColor={theme.colors.textMuted}
                                    value={scheduleDate}
                                    onChangeText={setScheduleDate}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>
                                    <Clock size={10} color={theme.colors.textMuted} /> Time (HH:MM)
                                </Text>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="e.g. 18:00"
                                    placeholderTextColor={theme.colors.textMuted}
                                    value={scheduleTime}
                                    onChangeText={setScheduleTime}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>
                                    <MapPin size={10} color={theme.colors.textMuted} /> Venue (optional)
                                </Text>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="e.g. 12 Oak Street"
                                    placeholderTextColor={theme.colors.textMuted}
                                    value={scheduleVenue}
                                    onChangeText={setScheduleVenue}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>
                                    Notes (optional)
                                </Text>
                                <TextInput
                                    style={[styles.textInput, { height: 80 }]}
                                    placeholder="Study topic, reminder, etc."
                                    placeholderTextColor={theme.colors.textMuted}
                                    multiline
                                    numberOfLines={3}
                                    textAlignVertical="top"
                                    value={scheduleNotes}
                                    onChangeText={setScheduleNotes}
                                />
                            </View>
                        </ScrollView>

                        <TouchableOpacity
                            style={styles.submitBtn}
                            onPress={handleScheduleMeeting}
                            disabled={scheduling}
                        >
                            {scheduling ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={styles.submitBtnText}>Open Register</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    content: {
        padding: 20,
        paddingTop: 60,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: theme.colors.text,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    subtitle: {
        fontSize: 10,
        fontWeight: '900',
        color: theme.colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginTop: 4,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        backgroundColor: theme.colors.card,
        borderRadius: theme.borderRadius.xl,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: theme.colors.border,
        marginTop: 20,
    },
    emptyTitle: {
        color: theme.colors.text,
        fontSize: 14,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginTop: 16,
    },
    emptyText: {
        color: theme.colors.textMuted,
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
        textAlign: 'center',
        marginTop: 8,
    },
    grid: {
        gap: 20,
    },
    card: {
        backgroundColor: theme.colors.card,
        borderRadius: theme.borderRadius.xl,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: 24,
    },
    cardHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: 'rgba(220, 38, 38, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(220, 38, 38, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    openBadge: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.2)',
    },
    openBadgeText: {
        color: theme.colors.success,
        fontSize: 8,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    cardTitleSection: {
        marginBottom: 16,
    },
    cardTitle: {
        color: theme.colors.text,
        fontSize: 18,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    cardDesc: {
        color: theme.colors.textMuted,
        fontSize: 12,
        lineHeight: 18,
    },
    statsRow: {
        flexDirection: 'row',
        paddingVertical: 16,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: theme.colors.border,
        gap: 24,
        marginBottom: 16,
    },
    statBox: {
        justifyContent: 'center',
    },
    statValue: {
        color: theme.colors.text,
        fontSize: 20,
        fontWeight: '900',
    },
    statLabel: {
        color: theme.colors.textMuted,
        fontSize: 9,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginTop: 2,
    },
    actionsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    btnPrimary: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.primary,
        borderRadius: theme.borderRadius.md,
        height: 44,
        gap: 8,
    },
    btnPrimaryText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    btnOutline: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.md,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: theme.colors.card,
        borderRadius: theme.borderRadius.xl,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: 24,
        maxHeight: '80%',
    },
    modalClose: {
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 10,
        padding: 8,
    },
    modalHeader: {
        marginBottom: 24,
    },
    modalIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(220, 38, 38, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(220, 38, 38, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        color: theme.colors.text,
        fontSize: 20,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    modalSubtitle: {
        color: theme.colors.textMuted,
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginTop: 4,
    },
    formScroll: {
        marginBottom: 24,
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        color: theme.colors.textMuted,
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
    },
    textInput: {
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.md,
        padding: 12,
        color: theme.colors.text,
        fontSize: 14,
        fontWeight: '700',
    },
    submitBtn: {
        backgroundColor: theme.colors.primary,
        height: 48,
        borderRadius: theme.borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitBtnText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
    }
});
