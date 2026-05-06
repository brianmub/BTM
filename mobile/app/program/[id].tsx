import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Alert, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { theme } from '../../lib/theme';
import { useAuth } from '../../hooks/useAuth';
import { useTenant } from '../../hooks/useTenant';
import { supabase } from '../../lib/supabase';
import { programService } from '../../services/programService';
import { assignmentService } from '../../services/assignmentService';
import { ArrowLeft, Calendar, Award, Info, Users, FileText, CheckCircle2, QrCode, ClipboardList, Clock, CheckCircle, Send, AlertCircle, XCircle, ChevronRight } from 'lucide-react-native';

type Tab = 'overview' | 'sessions' | 'tasks';

export default function ProgramDetailScreen() {
    const { id: programId } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { profile } = useAuth();
    const { organization } = useTenant();

    const [program, setProgram] = useState<any>(null);
    const [enrollment, setEnrollment] = useState<any>(null);
    const [sessions, setSessions] = useState<any[]>([]);
    const [attendanceMap, setAttendanceMap] = useState<Record<string, any>>({});
    const [assignments, setAssignments] = useState<any[]>([]);
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [enrolling, setEnrolling] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>('overview');

    // Assignment Submission State
    const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
    const [submissionText, setSubmissionText] = useState('');

    useEffect(() => {
        if (programId && profile) fetchAll();
    }, [programId, profile]);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const { data: prog } = await supabase
                .from('programs')
                .select('*')
                .eq('id', programId)
                .single();
            setProgram(prog);

            const { data: enroll } = await supabase
                .from('enrollments')
                .select('*')
                .eq('program_id', programId)
                .eq('user_id', profile!.id)
                .maybeSingle();
            setEnrollment(enroll);

            const { data: sess } = await supabase
                .from('sessions')
                .select('*')
                .eq('program_id', programId)
                .eq('is_active', true)
                .order('session_date', { ascending: true });
            setSessions(sess || []);

            if (sess && sess.length > 0 && profile) {
                const sessionIds = sess.map((s: any) => s.id);
                const { data: attendances } = await supabase
                    .from('attendance')
                    .select('session_id, status, checkin_time')
                    .eq('user_id', profile.id)
                    .in('session_id', sessionIds);

                const attMap: Record<string, any> = {};
                (attendances || []).forEach((a: any) => { attMap[a.session_id] = a; });
                setAttendanceMap(attMap);
            }

            // Fetch Assignments
            if (profile && organization) {
                const asgns = await assignmentService.getAssignmentsByProgram(programId);
                const subs = await assignmentService.getParticipantSubmissions(profile.id, organization.id);
                setAssignments(asgns || []);
                setSubmissions(subs || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleEnroll = async () => {
        if (!program || !profile || !organization) return;
        try {
            setEnrolling(true);
            await programService.enrollInProgram(
                program.id,
                profile.id,
                organization.id,
                'paid'
            );
            Alert.alert('Success', `You have joined ${program.name}!`);
            await fetchAll();
            setActiveTab('sessions');
        } catch (err: any) {
            Alert.alert('Error', err.message);
        } finally {
            setEnrolling(false);
        }
    };

    const handleAssignmentSubmit = async () => {
        if (!selectedAssignment || !profile || !organization) return;
        try {
            await assignmentService.submitAssignment({
                assignment_id: selectedAssignment.id,
                user_id: profile.id,
                organization_id: organization.id,
                submission_text: submissionText,
                status: 'submitted'
            });
            Alert.alert('Success', 'Assignment submitted successfully.');
            setIsSubmitModalOpen(false);
            setSubmissionText('');
            await fetchAll();
        } catch (err: any) {
            Alert.alert('Error', err.message);
        }
    };

    const getSubmissionForAssignment = (assignmentId: string) => {
        return submissions.find(s => s.assignment_id === assignmentId);
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    if (!program) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>Program not found.</Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Text style={styles.backBtnText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const completedSessions = sessions.filter(s => attendanceMap[s.id]?.status === 'present').length;
    const totalSessions = sessions.length;
    const progressPct = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
            {/* HERO */}
            <View style={styles.heroSection}>
                <View style={styles.heroBackground}>
                    {program.image_url ? (
                        <Image source={{ uri: program.image_url }} style={styles.heroImage} />
                    ) : (
                        <View style={styles.heroPlaceholder} />
                    )}
                    <View style={styles.heroOverlay} />
                </View>

                {/* Back button */}
                <TouchableOpacity onPress={() => router.back()} style={styles.backIconBtn}>
                    <ArrowLeft color="#fff" size={20} />
                </TouchableOpacity>

                {enrollment && (
                    <View style={styles.enrolledBadge}>
                        <CheckCircle2 size={12} color="#4ade80" />
                        <Text style={styles.enrolledBadgeText}>Enrolled</Text>
                    </View>
                )}

                <View style={styles.heroContent}>
                    <Text style={styles.categoryText}>{program.category || 'Training Program'}</Text>
                    <Text style={styles.titleText}>{program.name}</Text>
                </View>
            </View>

            {/* JOIN BUTTON */}
            {!enrollment && (
                <View style={styles.enrollContainer}>
                    <TouchableOpacity
                        style={styles.enrollActionBtn}
                        onPress={handleEnroll}
                        disabled={enrolling}
                    >
                        {enrolling ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={styles.enrollActionText}>Join the Program</Text>
                        )}
                    </TouchableOpacity>
                </View>
            )}

            {/* PROGRESS BAR */}
            {enrollment && totalSessions > 0 && (
                <View style={styles.progressContainer}>
                    <View style={styles.progressHeader}>
                        <Text style={styles.progressLabel}>Your Progress</Text>
                        <Text style={styles.progressValue}>{completedSessions}/{totalSessions} Sessions</Text>
                    </View>
                    <View style={styles.progressBarTrack}>
                        <View style={[styles.progressBarFill, { width: `${progressPct}%` }]} />
                    </View>
                </View>
            )}

            {/* TABS */}
            <View style={styles.tabsContainer}>
                <View style={styles.tabsWrapper}>
                    <TouchableOpacity
                        style={[styles.tabBtn, activeTab === 'overview' && styles.tabBtnActive]}
                        onPress={() => setActiveTab('overview')}
                    >
                        <Info size={14} color={activeTab === 'overview' ? '#fff' : theme.colors.textMuted} />
                        <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>Overview</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tabBtn, activeTab === 'sessions' && styles.tabBtnActive, !enrollment && styles.tabBtnDisabled]}
                        onPress={() => enrollment && setActiveTab('sessions')}
                        disabled={!enrollment}
                    >
                        <Calendar size={14} color={activeTab === 'sessions' ? '#fff' : (enrollment ? theme.colors.textMuted : theme.colors.border)} />
                        <Text style={[styles.tabText, activeTab === 'sessions' && styles.tabTextActive, !enrollment && styles.tabTextDisabled]}>Sessions</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tabBtn, activeTab === 'tasks' && styles.tabBtnActive, !enrollment && styles.tabBtnDisabled]}
                        onPress={() => enrollment && setActiveTab('tasks')}
                        disabled={!enrollment}
                    >
                        <Award size={14} color={activeTab === 'tasks' ? '#fff' : (enrollment ? theme.colors.textMuted : theme.colors.border)} />
                        <Text style={[styles.tabText, activeTab === 'tasks' && styles.tabTextActive, !enrollment && styles.tabTextDisabled]}>Tasks</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* TAB CONTENT */}
            <View style={styles.contentContainer}>
                {activeTab === 'overview' && (
                    <View style={styles.overviewTab}>
                        <View style={styles.glassBox}>
                            <View style={styles.boxHeader}>
                                <Info size={16} color={theme.colors.primary} />
                                <Text style={styles.boxTitle}>About This Program</Text>
                            </View>
                            <Text style={styles.boxText}>{program.description || 'No description provided.'}</Text>
                        </View>

                        <View style={styles.statsGrid}>
                            <View style={styles.statBox}>
                                <View style={styles.statBoxHeader}>
                                    <Calendar size={12} color={theme.colors.primary} />
                                    <Text style={styles.statBoxLabel}>Start Date</Text>
                                </View>
                                <Text style={styles.statBoxValue}>{new Date(program.start_date).toLocaleDateString()}</Text>
                            </View>
                            <View style={styles.statBox}>
                                <View style={styles.statBoxHeader}>
                                    <Calendar size={12} color="#ec4899" />
                                    <Text style={styles.statBoxLabel}>End Date</Text>
                                </View>
                                <Text style={styles.statBoxValue}>{program.end_date ? new Date(program.end_date).toLocaleDateString() : 'Ongoing'}</Text>
                            </View>
                            <View style={styles.statBox}>
                                <View style={styles.statBoxHeader}>
                                    <Users size={12} color="#f59e0b" />
                                    <Text style={styles.statBoxLabel}>Capacity</Text>
                                </View>
                                <Text style={styles.statBoxValue}>{program.max_participants || 'Unlimited'}</Text>
                            </View>
                            <View style={styles.statBox}>
                                <View style={styles.statBoxHeader}>
                                    <FileText size={12} color="#10b981" />
                                    <Text style={styles.statBoxLabel}>Sessions</Text>
                                </View>
                                <Text style={styles.statBoxValue}>{totalSessions}</Text>
                            </View>
                        </View>
                    </View>
                )}

                {activeTab === 'sessions' && (
                    <View style={styles.sessionsTab}>
                        {sessions.length === 0 ? (
                            <View style={styles.emptySessions}>
                                <Calendar size={48} color={theme.colors.border} />
                                <Text style={styles.emptySessionsTitle}>No sessions scheduled</Text>
                            </View>
                        ) : (
                            sessions.map((session) => {
                                const att = attendanceMap[session.id];
                                const isPresent = att?.status === 'present';
                                const sessionDate = new Date(session.session_date);
                                const isPast = sessionDate < new Date();

                                return (
                                    <View key={session.id} style={[styles.sessionCard, isPresent ? { borderLeftColor: theme.colors.success, borderLeftWidth: 4 } : null]}>
                                        <View style={[styles.sessionDateCol, isPast ? { backgroundColor: theme.colors.background } : { backgroundColor: 'rgba(220, 38, 38, 0.05)' }]}>
                                            <Text style={styles.sessionDateMonth}>{sessionDate.toLocaleDateString('en-US', { month: 'short' })}</Text>
                                            <Text style={[styles.sessionDateDay, isPast ? { color: theme.colors.textMuted } : { color: theme.colors.primary }]}>{sessionDate.getDate()}</Text>
                                            <Text style={styles.sessionDateWeekday}>{sessionDate.toLocaleDateString('en-US', { weekday: 'short' })}</Text>
                                        </View>
                                        <View style={styles.sessionDetails}>
                                            <View style={styles.sessionHeaderRow}>
                                                <Text style={styles.sessionTitle} numberOfLines={2}>{session.name}</Text>
                                                {att ? (
                                                    <View style={[styles.attBadge, isPresent ? styles.attBadgePresent : styles.attBadgeAbsent]}>
                                                        <Text style={[styles.attBadgeText, isPresent ? styles.attBadgeTextPresent : styles.attBadgeTextAbsent]}>
                                                            {att.status}
                                                        </Text>
                                                    </View>
                                                ) : (
                                                    <View style={[styles.attBadge, isPast ? styles.attBadgeAbsent : styles.attBadgeUpcoming]}>
                                                        <Text style={[styles.attBadgeText, isPast ? styles.attBadgeTextAbsent : styles.attBadgeTextUpcoming]}>
                                                            {isPast ? 'Absent' : 'Upcoming'}
                                                        </Text>
                                                    </View>
                                                )}
                                            </View>

                                            <View style={styles.sessionTimeRow}>
                                                <Clock size={12} color={theme.colors.primary} />
                                                <Text style={styles.sessionTimeText}>
                                                    {session.start_time?.slice(0, 5)} - {session.end_time?.slice(0, 5)}
                                                </Text>
                                            </View>

                                            <View style={styles.sessionActions}>
                                                {att ? (
                                                    <View style={styles.checkedInBtn}>
                                                        <CheckCircle size={12} color={theme.colors.success} />
                                                        <Text style={styles.checkedInText}>Checked In</Text>
                                                    </View>
                                                ) : (
                                                    <TouchableOpacity style={styles.scanInBtn} onPress={() => router.push('/(tabs)')}>
                                                        <QrCode size={12} color="#fff" />
                                                        <Text style={styles.scanInText}>Scan QR</Text>
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                        </View>
                                    </View>
                                );
                            })
                        )}
                    </View>
                )}

                {activeTab === 'tasks' && (
                    <View style={styles.tasksTab}>
                        {assignments.length === 0 ? (
                            <View style={styles.emptySessions}>
                                <Clock size={48} color={theme.colors.border} />
                                <Text style={styles.emptySessionsTitle}>No Active Tasks</Text>
                            </View>
                        ) : (
                            assignments.map((assignment) => {
                                const submission = getSubmissionForAssignment(assignment.id);
                                const isOverdue = new Date(assignment.due_date) < new Date() && !submission;

                                return (
                                    <View key={assignment.id} style={styles.assignmentCard}>
                                        <View style={styles.assignmentHeaderRow}>
                                            <View style={styles.assignmentIconBox}>
                                                <FileText size={20} color={submission ? theme.colors.success : (isOverdue ? theme.colors.error : theme.colors.primary)} />
                                            </View>
                                            <View style={styles.assignmentTitleCol}>
                                                <Text style={styles.assignmentTitle} numberOfLines={1}>{assignment.name}</Text>
                                                <View style={styles.assignmentMetaRow}>
                                                    <Calendar size={10} color={theme.colors.textMuted} />
                                                    <Text style={styles.assignmentDueDate}>Due: {new Date(assignment.due_date).toLocaleDateString()}</Text>
                                                </View>
                                            </View>
                                        </View>

                                        <Text style={styles.assignmentDesc} numberOfLines={2}>
                                            {assignment.description || 'No description provided.'}
                                        </Text>

                                        {submission ? (
                                            <View style={styles.assignmentFooter}>
                                                {submission.status === 'graded' ? (
                                                    <View style={styles.gradeBadge}>
                                                        <CheckCircle size={12} color={theme.colors.success} />
                                                        <Text style={styles.gradeText}>Score: {submission.score}/{assignment.max_score}</Text>
                                                    </View>
                                                ) : (
                                                    <View style={[styles.gradeBadge, { borderColor: theme.colors.primary, backgroundColor: 'rgba(220, 38, 38, 0.1)' }]}>
                                                        <Text style={[styles.gradeText, { color: theme.colors.primary }]}>Submitted</Text>
                                                    </View>
                                                )}

                                                <TouchableOpacity
                                                    style={styles.viewBtn}
                                                    onPress={() => {
                                                        setSelectedAssignment(assignment);
                                                        setSubmissionText(submission.submission_text);
                                                        setIsSubmitModalOpen(true);
                                                    }}
                                                >
                                                    <Text style={styles.viewBtnText}>View Work</Text>
                                                    <ChevronRight size={12} color={theme.colors.textMuted} />
                                                </TouchableOpacity>
                                            </View>
                                        ) : (
                                            <TouchableOpacity
                                                style={isOverdue ? styles.submitBtnOutline : styles.submitBtnRaw}
                                                onPress={() => {
                                                    setSelectedAssignment(assignment);
                                                    setSubmissionText('');
                                                    setIsSubmitModalOpen(true);
                                                }}
                                            >
                                                <Send size={14} color={isOverdue ? theme.colors.text : '#fff'} />
                                                <Text style={isOverdue ? styles.submitBtnOutlineText : styles.submitBtnRawText}>Hand In Task</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                );
                            })
                        )}
                    </View>
                )}
            </View>

            {/* FULL SCREEN MODAL OVERLAY FOR SUBMISSION */}
            {isSubmitModalOpen && selectedAssignment && (
                <View style={StyleSheet.absoluteFill}>
                    <TouchableOpacity
                        style={styles.modalBg}
                        activeOpacity={1}
                        onPress={() => !getSubmissionForAssignment(selectedAssignment.id) ? null : setIsSubmitModalOpen(false)}
                    />
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle}>
                                    {getSubmissionForAssignment(selectedAssignment.id) ? 'My Submission' : 'Hand In Task'}
                                </Text>
                                <Text style={styles.modalSubtitle}>{selectedAssignment.name}</Text>
                            </View>
                            <TouchableOpacity onPress={() => setIsSubmitModalOpen(false)}>
                                <XCircle size={24} color={theme.colors.textMuted} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.modalLabel}>Submission Text</Text>
                        <View style={styles.textAreaContainer}>
                            <TextInput
                                style={styles.textArea}
                                placeholder="Enter your response or findings..."
                                placeholderTextColor={theme.colors.textMuted}
                                value={submissionText}
                                onChangeText={setSubmissionText}
                                multiline
                                numberOfLines={8}
                                textAlignVertical="top"
                                editable={!getSubmissionForAssignment(selectedAssignment.id)}
                            />
                        </View>

                        {!getSubmissionForAssignment(selectedAssignment.id) ? (
                            <>
                                <View style={styles.infoBanner}>
                                    <AlertCircle size={14} color={theme.colors.primary} />
                                    <Text style={styles.infoBannerText}>
                                        Submitting this task marks it as complete. You can update your submission until graded.
                                    </Text>
                                </View>
                                <TouchableOpacity style={styles.confirmSubmitBtn} onPress={handleAssignmentSubmit}>
                                    <CheckCircle size={16} color="#fff" />
                                    <Text style={styles.confirmSubmitBtnText}>Confirm Submission</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <View style={styles.successBanner}>
                                <CheckCircle size={14} color={theme.colors.success} />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.successBannerTitle}>Submission Finalized</Text>
                                    <Text style={styles.successBannerText}>
                                        Submitted on {new Date(getSubmissionForAssignment(selectedAssignment.id)?.submitted_at).toLocaleString()}
                                    </Text>
                                </View>
                            </View>
                        )}
                    </View>
                </View>
            )}
        </ScrollView>
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
        backgroundColor: theme.colors.background,
    },
    errorText: {
        color: theme.colors.text,
        fontSize: 16,
        marginBottom: 16,
    },
    backBtn: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: theme.colors.card,
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    backBtnText: {
        color: theme.colors.text,
        fontWeight: 'bold',
    },
    heroSection: {
        height: 220,
        position: 'relative',
    },
    heroBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: theme.colors.card,
    },
    heroImage: {
        width: '100%',
        height: '100%',
        opacity: 0.5,
    },
    heroPlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: theme.colors.primary,
        opacity: 0.2,
    },
    heroOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '60%',
        backgroundColor: 'rgba(9, 9, 11, 0.8)', // gradient effect simple replacement
    },
    backIconBtn: {
        position: 'absolute',
        top: 40,
        left: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    enrolledBadge: {
        position: 'absolute',
        top: 40,
        right: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: theme.borderRadius.sm,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.4)',
    },
    enrolledBadgeText: {
        color: '#4ade80',
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    heroContent: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
    },
    categoryText: {
        color: theme.colors.primary,
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: 4,
    },
    titleText: {
        color: '#fff',
        fontSize: 28,
        fontWeight: '900',
        textTransform: 'uppercase',
    },
    enrollContainer: {
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.card,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    enrollActionBtn: {
        backgroundColor: theme.colors.primary,
        height: 52,
        borderRadius: theme.borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    enrollActionText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    progressContainer: {
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.card,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    progressHeader: {
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
    progressValue: {
        color: theme.colors.primary,
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    progressBarTrack: {
        height: 8,
        backgroundColor: theme.colors.background,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: theme.colors.border,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: theme.colors.primary,
    },
    tabsContainer: {
        padding: theme.spacing.lg,
        paddingBottom: 0,
    },
    tabsWrapper: {
        flexDirection: 'row',
        backgroundColor: theme.colors.card,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.md,
        padding: 4,
    },
    tabBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        borderRadius: theme.borderRadius.sm,
    },
    tabBtnActive: {
        backgroundColor: theme.colors.primary,
    },
    tabBtnDisabled: {
        opacity: 0.5,
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
    tabTextDisabled: {
        color: theme.colors.border,
    },
    contentContainer: {
        padding: theme.spacing.lg,
    },
    overviewTab: {
        gap: theme.spacing.md,
    },
    glassBox: {
        backgroundColor: theme.colors.card,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.lg,
    },
    boxHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        paddingBottom: 12,
        marginBottom: 12,
    },
    boxTitle: {
        color: theme.colors.text,
        fontSize: 12,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    boxText: {
        color: theme.colors.textMuted,
        fontSize: 14,
        lineHeight: 22,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.sm,
    },
    statBox: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: theme.colors.card,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.md,
    },
    statBoxHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    statBoxLabel: {
        color: theme.colors.textMuted,
        fontSize: 9,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    statBoxValue: {
        color: theme.colors.text,
        fontSize: 14,
        fontWeight: '900',
    },
    sessionsTab: {
        gap: theme.spacing.md,
    },
    emptySessions: {
        padding: 40,
        alignItems: 'center',
        backgroundColor: theme.colors.card,
        borderRadius: theme.borderRadius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderStyle: 'dashed',
    },
    emptySessionsTitle: {
        color: theme.colors.textMuted,
        marginTop: 16,
        fontSize: 14,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    sessionCard: {
        flexDirection: 'row',
        backgroundColor: theme.colors.card,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.lg,
        overflow: 'hidden',
    },
    sessionDateCol: {
        width: 70,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRightWidth: 1,
        borderRightColor: theme.colors.border,
    },
    sessionDateMonth: {
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
        color: theme.colors.textMuted,
    },
    sessionDateDay: {
        fontSize: 24,
        fontWeight: '900',
        marginVertical: 2,
    },
    sessionDateWeekday: {
        fontSize: 8,
        fontWeight: 'bold',
        color: theme.colors.textMuted,
    },
    sessionDetails: {
        flex: 1,
        padding: theme.spacing.md,
    },
    sessionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    sessionTitle: {
        flex: 1,
        fontSize: 14,
        fontWeight: '900',
        color: theme.colors.text,
        textTransform: 'uppercase',
        marginRight: 8,
    },
    attBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: theme.borderRadius.sm,
        borderWidth: 1,
    },
    attBadgePresent: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderColor: 'rgba(16, 185, 129, 0.2)',
    },
    attBadgeAbsent: {
        backgroundColor: 'rgba(244, 63, 94, 0.1)',
        borderColor: 'rgba(244, 63, 94, 0.2)',
    },
    attBadgeUpcoming: {
        backgroundColor: 'rgba(220, 38, 38, 0.1)',
        borderColor: 'rgba(220, 38, 38, 0.2)',
    },
    attBadgeText: {
        fontSize: 8,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    attBadgeTextPresent: { color: theme.colors.success },
    attBadgeTextAbsent: { color: theme.colors.textMuted },
    attBadgeTextUpcoming: { color: theme.colors.primary },
    sessionTimeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 12,
    },
    sessionTimeText: {
        fontSize: 10,
        color: theme.colors.textMuted,
        fontWeight: 'bold',
    },
    sessionActions: {
        flexDirection: 'row',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    scanInBtn: {
        backgroundColor: theme.colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: theme.borderRadius.md,
        gap: 6,
    },
    scanInText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    checkedInBtn: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.2)',
        gap: 6,
    },
    checkedInText: {
        color: theme.colors.success,
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    tasksTab: {
        gap: theme.spacing.md,
    },
    assignmentCard: {
        backgroundColor: theme.colors.card,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.md,
        gap: 12,
    },
    assignmentHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    assignmentIconBox: {
        width: 40,
        height: 40,
        borderRadius: theme.borderRadius.md,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    assignmentTitleCol: {
        flex: 1,
    },
    assignmentTitle: {
        color: theme.colors.text,
        fontSize: 14,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    assignmentMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    assignmentDueDate: {
        color: theme.colors.textMuted,
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    assignmentDesc: {
        color: theme.colors.textMuted,
        fontSize: 12,
        lineHeight: 18,
    },
    assignmentFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    gradeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.2)',
    },
    gradeText: {
        color: theme.colors.success,
        fontSize: 9,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    viewBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: theme.colors.background,
        borderRadius: theme.borderRadius.sm,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    viewBtnText: {
        color: theme.colors.textMuted,
        fontSize: 9,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    submitBtnOutline: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.md,
    },
    submitBtnOutlineText: {
        color: theme.colors.text,
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    submitBtnRaw: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        backgroundColor: theme.colors.primary,
        borderRadius: theme.borderRadius.md,
    },
    submitBtnRawText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    modalBg: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.8)',
    },
    modalContainer: {
        position: 'absolute',
        left: 20,
        right: 20,
        top: '15%',
        backgroundColor: theme.colors.card,
        borderRadius: theme.borderRadius.xl,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.8,
        shadowRadius: 20,
        elevation: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    modalTitle: {
        color: theme.colors.text,
        fontSize: 18,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    modalSubtitle: {
        color: theme.colors.textMuted,
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    modalLabel: {
        color: theme.colors.textMuted,
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
    },
    textAreaContainer: {
        marginBottom: 20,
    },
    textArea: {
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.md,
        padding: 16,
        color: theme.colors.text,
        fontSize: 14,
        minHeight: 120,
    },
    infoBanner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        backgroundColor: 'rgba(220, 38, 38, 0.05)',
        padding: 16,
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: 'rgba(220, 38, 38, 0.2)',
        marginBottom: 20,
    },
    infoBannerText: {
        flex: 1,
        color: theme.colors.primary,
        fontSize: 9,
        lineHeight: 14,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    confirmSubmitBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: theme.colors.primary,
        paddingVertical: 16,
        borderRadius: theme.borderRadius.md,
    },
    confirmSubmitBtnText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    successBanner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        backgroundColor: 'rgba(16, 185, 129, 0.05)',
        padding: 16,
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.2)',
    },
    successBannerTitle: {
        color: theme.colors.success,
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    successBannerText: {
        color: theme.colors.textMuted,
        fontSize: 9,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
    }
});
