import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useTenant } from '../../hooks/useTenant';
import { supabase } from '../../lib/supabase';
import { theme } from '../../lib/theme';
import { Calendar, ChevronRight, Clock, Award, Star, Banknote, QrCode, UserCircle2, Trophy, Zap, Shield, Target, TrendingUp, Flame, MapPin } from 'lucide-react-native';
import { useRouter } from 'expo-router';

const BADGE_DEFINITIONS = [
    { id: 'first_step', label: 'First Step', icon: Target, color: theme.colors.warning, desc: 'Joined your first program' },
    { id: 'consistent', label: 'Consistent', icon: Flame, color: '#f97316', desc: 'Attended 5 sessions' },
    { id: 'scholar', label: 'Scholar', icon: Shield, color: '#3b82f6', desc: 'Completed an assignment' },
    { id: 'rising', label: 'Rising Star', icon: Star, color: theme.colors.primary, desc: 'Earned 100 Faith Points' },
];

function XPProgressBar({ xp }: { xp: number }) {
    const level = Math.floor(xp / 100) + 1;
    const currentXP = xp % 100;
    const pct = currentXP;

    return (
        <View style={styles.xpBox}>
            <View style={styles.xpHeader}>
                <View style={styles.xpHeaderLeft}>
                    <View style={styles.zapIconBox}>
                        <Zap size={14} color="#fff" />
                    </View>
                    <View>
                        <Text style={styles.xpLabel}>Faith Level</Text>
                        <Text style={styles.xpLevelValue}>{level}</Text>
                    </View>
                </View>
                <View style={styles.xpHeaderRight}>
                    <Text style={styles.xpLabel}>Faith Points</Text>
                    <Text style={styles.xpLevelValue}>{xp} <Text style={styles.xpLevelMax}>/ {level * 100}</Text></Text>
                </View>
            </View>
            <View style={styles.xpBarTrack}>
                <View style={[styles.xpBarFill, { width: `${pct}%` }]} />
            </View>
            <Text style={styles.xpRemaining}>{100 - currentXP} XP to Level {level + 1}</Text>
        </View>
    );
}

export default function DashboardScreen() {
    const { profile } = useAuth();
    const { organization } = useTenant();
    const router = useRouter();

    const [enrollments, setEnrollments] = useState<any[]>([]);
    const [nextSessions, setNextSessions] = useState<Record<string, any>>({});
    const [badges, setBadges] = useState<string[]>([]);
    const [xp, setXp] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (profile) fetchDashboardData();
    }, [profile]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const { data: enrollmentData } = await supabase
                .from('enrollments')
                .select('*, program:programs(*)')
                .eq('user_id', profile?.id)
                .in('status', ['enrolled', 'active', 'pending']);

            setEnrollments(enrollmentData || []);

            if (enrollmentData && enrollmentData.length > 0) {
                const programIds = enrollmentData.map((e: any) => e.program_id);
                const today = new Date().toISOString().split('T')[0];
                const { data: upcoming } = await supabase
                    .from('sessions')
                    .select('id, name, session_date, start_time, location, program_id')
                    .in('program_id', programIds)
                    .gte('session_date', today)
                    .eq('is_active', true)
                    .order('session_date', { ascending: true });

                const map: Record<string, any> = {};
                (upcoming || []).forEach((s: any) => {
                    if (!map[s.program_id]) map[s.program_id] = s;
                });
                setNextSessions(map);
            }

            const enrollCount = (enrollmentData || []).length;
            const { data: badgeData } = await supabase
                .from('user_badges')
                .select('badge_id')
                .eq('user_id', profile?.id);
            const earnedBadges = (badgeData || []).map((b: any) => b.badge_id);

            if (enrollCount >= 1 && !earnedBadges.includes('first_step')) {
                earnedBadges.push('first_step');
            }
            setBadges(earnedBadges);
            setXp(enrollCount * 50 + earnedBadges.length * 25);
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    const getGreeting = () => {
        const h = new Date().getHours();
        if (h < 12) return 'Good Morning';
        if (h < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* HERO SECTION */}
            <View style={styles.heroSection}>
                <View style={styles.heroBackground} />
                <View style={styles.heroContent}>
                    <View style={styles.headerTop}>
                        <View>
                            <Text style={styles.greeting}>{getGreeting()}</Text>
                            <Text style={styles.userName}>
                                {profile?.first_name ? `${profile.first_name} ${profile.surname?.[0] || ''}`.trim() : 'Welcome'}
                            </Text>
                            <Text style={styles.orgName}>{organization?.name}</Text>
                        </View>
                        {organization?.logo_url ? (
                            <Image source={{ uri: organization.logo_url }} style={styles.orgLogo} />
                        ) : (
                            <View style={styles.orgLogoPlaceholder}>
                                <Text style={styles.orgLogoText}>{organization?.name?.[0] || '⛪'}</Text>
                            </View>
                        )}
                    </View>

                    <XPProgressBar xp={xp} />

                    <View style={styles.quickActions}>
                        <TouchableOpacity style={styles.actionBtnOutline} onPress={() => router.push('/qr-scanner')}>
                            <QrCode size={18} color={theme.colors.text} />
                            <Text style={styles.actionBtnText}>Scan In</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionBtnSolid} onPress={() => router.push('/my-qr')}>
                            <UserCircle2 size={18} color="#fff" />
                            <Text style={styles.actionBtnSolidText}>My ID</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* MAIN CONTENT */}
            <View style={styles.mainContent}>

                {/* TROPHY ROOM */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionTitleRow}>
                            <Trophy size={16} color={theme.colors.primary} />
                            <Text style={styles.sectionTitle}>Trophy Room</Text>
                        </View>
                        <Text style={styles.sectionSubtitle}>{badges.length} / {BADGE_DEFINITIONS.length} Earned</Text>
                    </View>

                    <View style={styles.badgesGrid}>
                        {BADGE_DEFINITIONS.map(badge => {
                            const Icon = badge.icon;
                            const earned = badges.includes(badge.id);
                            return (
                                <View key={badge.id} style={[styles.badgeItem, earned ? styles.badgeItemEarned : null]}>
                                    <View style={[styles.badgeIconBox, earned ? { backgroundColor: badge.color + '20' } : null]}>
                                        <Icon size={20} color={earned ? badge.color : theme.colors.textMuted} />
                                    </View>
                                    <Text style={[styles.badgeLabel, earned ? styles.badgeLabelEarned : null]}>
                                        {badge.label}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                </View>

                {/* MY PROGRAMS */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionTitleRow}>
                            <TrendingUp size={16} color={theme.colors.primary} />
                            <Text style={styles.sectionTitle}>My Programs</Text>
                        </View>
                        <TouchableOpacity onPress={() => router.push('/(tabs)/programs')}>
                            <Text style={styles.linkText}>Browse More</Text>
                        </TouchableOpacity>
                    </View>

                    {loading ? (
                        <ActivityIndicator color={theme.colors.primary} size="large" style={{ marginVertical: 30 }} />
                    ) : enrollments.length > 0 ? (
                        <View style={styles.programsList}>
                            {enrollments.map((enr, idx) => (
                                <TouchableOpacity
                                    key={enr.id}
                                    style={styles.programCard}
                                    onPress={() => router.push(`/(tabs)/programs`)}
                                >
                                    <View style={styles.programIconBox}>
                                        {enr.program.image_url ? (
                                            <Image source={{ uri: enr.program.image_url }} style={styles.programImage} />
                                        ) : (
                                            <Calendar size={24} color={theme.colors.primary + '80'} />
                                        )}
                                    </View>
                                    <View style={styles.programInfo}>
                                        <Text style={styles.programTitle} numberOfLines={1}>{enr.program.name}</Text>
                                        <View style={styles.programMetaInfo}>
                                            {enr.payment_status === 'pending' ? (
                                                <View style={styles.statusBadge}>
                                                    <Banknote size={10} color={theme.colors.warning} />
                                                    <Text style={[styles.statusText, { color: theme.colors.warning }]}>Pay at Office</Text>
                                                </View>
                                            ) : (
                                                <View style={styles.statusBadge}>
                                                    <Clock size={10} color={theme.colors.success} />
                                                    <Text style={[styles.statusText, { color: theme.colors.success }]}>Active</Text>
                                                </View>
                                            )}
                                        </View>
                                        {nextSessions[enr.program_id] && (
                                            <Text style={styles.nextSessionText} numberOfLines={1}>
                                                Next: {new Date(nextSessions[enr.program_id].session_date).toLocaleDateString()}
                                                {' • '}{nextSessions[enr.program_id].start_time?.slice(0, 5)}
                                            </Text>
                                        )}
                                    </View>
                                    <ChevronRight size={20} color={theme.colors.textMuted} />
                                </TouchableOpacity>
                            ))}
                        </View>
                    ) : (
                        <View style={styles.emptyState}>
                            <Award size={48} color={theme.colors.border} />
                            <Text style={styles.emptyStateTitle}>Your journey hasn't started yet.</Text>
                            <Text style={styles.emptyStateText}>Join a program to begin.</Text>
                            <TouchableOpacity style={styles.browseButton} onPress={() => router.push('/(tabs)/programs')}>
                                <Text style={styles.browseButtonText}>Browse Programs</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    content: {
        paddingBottom: theme.spacing.xxl,
    },
    heroSection: {
        backgroundColor: theme.colors.card,
        position: 'relative',
        overflow: 'hidden',
    },
    heroBackground: {
        position: 'absolute',
        right: -80,
        top: 0,
        bottom: 0,
        width: 150,
        backgroundColor: theme.colors.primary,
        opacity: 0.15,
        transform: [{ skewX: '-15deg' }]
    },
    heroContent: {
        padding: theme.spacing.lg,
        paddingTop: theme.spacing.xl,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: theme.spacing.xl,
    },
    greeting: {
        fontSize: 10,
        fontWeight: '800',
        color: 'rgba(255,255,255,0.6)',
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: 4,
    },
    userName: {
        fontSize: 28,
        fontWeight: '900',
        color: '#fff',
        textTransform: 'uppercase',
    },
    orgName: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.6)',
        marginTop: 4,
    },
    orgLogo: {
        width: 48,
        height: 48,
        borderRadius: theme.borderRadius.md,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    orgLogoPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: theme.borderRadius.md,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    orgLogoText: {
        fontSize: 20,
        fontWeight: '900',
        color: '#fff',
    },
    xpBox: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.lg,
    },
    xpHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    xpHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    zapIconBox: {
        width: 28,
        height: 28,
        backgroundColor: theme.colors.primary,
        borderRadius: theme.borderRadius.sm,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: theme.spacing.sm,
    },
    xpLabel: {
        fontSize: 9,
        fontWeight: '900',
        color: 'rgba(255,255,255,0.6)',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    xpLevelValue: {
        fontSize: 18,
        fontWeight: '900',
        color: '#fff',
    },
    xpHeaderRight: {
        alignItems: 'flex-end',
    },
    xpLevelMax: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.5)',
    },
    xpBarTrack: {
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: theme.borderRadius.full,
        overflow: 'hidden',
        marginBottom: theme.spacing.xs,
    },
    xpBarFill: {
        height: '100%',
        backgroundColor: theme.colors.primary,
        borderRadius: theme.borderRadius.full,
    },
    xpRemaining: {
        fontSize: 9,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.5)',
        textTransform: 'uppercase',
        textAlign: 'right',
    },
    quickActions: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
    },
    actionBtnOutline: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: theme.borderRadius.md,
    },
    actionBtnText: {
        color: theme.colors.text,
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    actionBtnSolid: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        backgroundColor: theme.colors.primary,
        borderRadius: theme.borderRadius.md,
    },
    actionBtnSolidText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    mainContent: {
        padding: theme.spacing.lg,
    },
    section: {
        marginBottom: theme.spacing.xl,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '900',
        color: theme.colors.text,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    sectionSubtitle: {
        fontSize: 9,
        fontWeight: '900',
        color: theme.colors.primary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    linkText: {
        fontSize: 10,
        fontWeight: '700',
        color: theme.colors.primary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    badgesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    badgeItem: {
        flex: 1,
        minWidth: '22%',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.sm,
        opacity: 0.5,
    },
    badgeItemEarned: {
        opacity: 1,
        borderColor: theme.colors.primary + '40',
        backgroundColor: theme.colors.card,
    },
    badgeIconBox: {
        width: 36,
        height: 36,
        borderRadius: theme.borderRadius.sm,
        backgroundColor: theme.colors.card,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    badgeLabel: {
        fontSize: 8,
        fontWeight: '900',
        textAlign: 'center',
        textTransform: 'uppercase',
        color: theme.colors.textMuted,
    },
    badgeLabelEarned: {
        color: theme.colors.text,
    },
    programsList: {
        gap: theme.spacing.sm,
    },
    programCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.card,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.lg,
    },
    programIconBox: {
        width: 48,
        height: 48,
        borderRadius: theme.borderRadius.md,
        backgroundColor: 'rgba(220, 38, 38, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: theme.spacing.md,
        overflow: 'hidden',
    },
    programImage: {
        width: '100%',
        height: '100%',
    },
    programInfo: {
        flex: 1,
    },
    programTitle: {
        fontSize: 14,
        fontWeight: '900',
        color: theme.colors.text,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    programMetaInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statusText: {
        fontSize: 9,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    nextSessionText: {
        fontSize: 10,
        color: theme.colors.textMuted,
        fontWeight: '700',
    },
    emptyState: {
        padding: theme.spacing.xl,
        alignItems: 'center',
        backgroundColor: theme.colors.card,
        borderRadius: theme.borderRadius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderStyle: 'dashed',
    },
    emptyStateTitle: {
        color: theme.colors.textMuted,
        fontSize: 14,
        fontWeight: '500',
        marginTop: theme.spacing.md,
    },
    emptyStateText: {
        color: theme.colors.textMuted,
        fontSize: 12,
        marginBottom: theme.spacing.lg,
    },
    browseButton: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.borderRadius.sm,
    },
    browseButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
    }
});
