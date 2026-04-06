import React, { useEffect, useState, useCallback } from "react";
import { View, StyleSheet, ScrollView, Image, Pressable, RefreshControl, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInUp, FadeInRight } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { useNavigation } from "@react-navigation/native";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { storage, Session, Assignment, Program, Enrollment, AttendanceRecord, AssignmentSubmission, PaymentRecord } from "@/lib/storage";

function ProgressBar({ progress, color, trackColor }: { progress: number; color: string; trackColor: string }) {
  return (
    <View style={[styles.progressTrack, { backgroundColor: trackColor }]}>
      <View
        style={[
          styles.progressFill,
          { backgroundColor: color, width: `${Math.min(progress * 100, 100)}%` },
        ]}
      />
    </View>
  );
}

export default function ParticipantHomeScreen() {
  const navigation = useNavigation<any>();
  console.log("[DEBUG] ParticipantHomeScreen loaded - v2 with attendance fixes");
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [userPayments, setUserPayments] = useState<PaymentRecord[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [graduationInfo, setGraduationInfo] = useState<{ eligible: boolean; sessionsConfirmed: number; totalSessions: number; sessionsWithPaidPayments: number } | null>(null);
  const [userGroups, setUserGroups] = useState<Record<string, any>>({}); // programId -> groupInfo
  const [memberPreviews, setMemberPreviews] = useState<Record<string, any>>({}); // programId -> memberInfo

  const loadData = useCallback(async () => {
    if (!user?.organizationId) return;

    const [loadedSessions, loadedPrograms, loadedEnrollments, loadedAttendance, loadedPayments] = await Promise.all([
      storage.getSessions(user.organizationId),
      storage.getPrograms(user.organizationId),
      storage.getEnrollments(user.organizationId),
      storage.getUserAttendance(user.id),
      storage.getUserPayments(user.id),
    ]);

    // Fetch cell groups + facilitator info
    const { data: groupData } = await (await import('../lib/supabase')).supabase
      .from('group_members')
      .select(`
        group:program_groups(
          id, 
          name, 
          program_id,
          facilitator:facilitator_id(id, first_name, surname)
        )
      `)
      .eq('user_id', user.id);

    const groupMap: Record<string, any> = {};
    const groupMemberInfo: Record<string, { count: number, others: string[] }> = {};

    if (groupData && groupData.length > 0) {
      await Promise.all(groupData.map(async (g: any) => {
        const groupObj = Array.isArray(g.group) ? g.group[0] : g.group;
        if (groupObj) {
          groupMap[groupObj.program_id] = {
            id: groupObj.id,
            name: groupObj.name,
            facilitatorName: groupObj.facilitator 
              ? `${groupObj.facilitator.first_name} ${groupObj.facilitator.surname}`
              : 'Unassigned'
          };

          // Fetch other members for this group
          const { data: members } = await (await import('../lib/supabase')).supabase
            .from('group_members')
            .select('users(first_name, surname)')
            .eq('group_id', groupObj.id)
            .neq('user_id', user.id)
            .limit(3);

          const { count } = await (await import('../lib/supabase')).supabase
            .from('group_members')
            .select('id', { count: 'exact', head: true })
            .eq('group_id', groupObj.id)
            .neq('user_id', user.id);

          groupMemberInfo[groupObj.program_id] = {
             count: count || 0,
             others: (members || []).map((m: any) => m.users?.first_name || 'Member')
          };
        }
      }));
    }
    
    setUserGroups(groupMap);
    setMemberPreviews(groupMemberInfo);
    setSessions(loadedSessions);
    setPrograms(loadedPrograms);
    setEnrollments(loadedEnrollments);
    setAttendance(loadedAttendance);
    setUserPayments(loadedPayments);
  }, [user?.id, user?.organizationId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadData();
    setIsRefreshing(false);
  };

  const userEnrollments = enrollments.filter(e => e.userId === user?.id);
  const userEnrollment = userEnrollments[0];
  const enrolledPrograms = programs.filter(p => userEnrollments.some(e => e.programId === p.id));
  const currentProgram = programs.find(p => p.id === userEnrollment?.programId);
  const programSessions = sessions.filter(s => s.programId === userEnrollment?.programId);
  
  const confirmedAttendance = attendance.filter(
    a => a.userId === user?.id && (a.isVerified || a.confirmedByLeader) && a.programId === userEnrollment?.programId
  );
  const attendedCount = confirmedAttendance.length;

  const upcomingSession = programSessions.find(
    (s) => new Date(s.date) > new Date()
  );

  const activeAttendance = attendance.find(a => a.userId === user?.id && a.checkedIn && !a.exitTime);
  const activeSession = activeAttendance ? sessions.find(s => s.id === activeAttendance.sessionId) : null;

  const handleCheckout = async () => {
    if (!activeAttendance || !activeSession || !user) return;
    
    try {
      setCheckingOut(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const result = await storage.checkOutOfSession(user.id, activeSession.id);
      
      if (result.success) {
        Alert.alert("Success", "Successfully checked out! Hope you enjoyed the session.");
        loadData();
      } else {
        Alert.alert("Error", result.message);
      }
    } catch (err) {
      Alert.alert("Error", "FAILED_TO_CHECKOUT");
    } finally {
      setCheckingOut(false);
    }
  };

  useEffect(() => {
    const checkGraduation = async () => {
      if (user?.id && userEnrollment?.programId) {
        const info = await storage.checkGraduationEligibility(user.id, userEnrollment.programId);
        setGraduationInfo(info);
      }
    };
    checkGraduation();
  }, [user?.id, userEnrollment?.programId, attendance]);

  const totalSessions = graduationInfo?.totalSessions || programSessions.length || 5;
  const graduationProgress = totalSessions > 0 ? (graduationInfo ? graduationInfo.sessionsConfirmed / totalSessions : attendedCount / totalSessions) : 0;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const getEnrollmentStatusText = () => {
    if (!userEnrollment) return "Not enrolled";
    switch (userEnrollment.status) {
      case "enrolled":
        return "Enrolled - Awaiting Cell Assignment";
      case "assigned":
        return "Assigned to Cell Group";
      case "graduated":
        return "Graduated";
      case "incomplete":
        return "Incomplete - Re-enrollment Required";
      default:
        return "Unknown";
    }
  };

  const getEnrollmentStatusColor = () => {
    if (!userEnrollment) return theme.textSecondary;
    switch (userEnrollment.status) {
      case "enrolled":
        return theme.accent;
      case "assigned":
        return theme.success;
      case "graduated":
        return theme.link;
      case "incomplete":
        return theme.warning;
      default:
        return theme.textSecondary;
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.xl,
        paddingBottom: tabBarHeight + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor={theme.link}
        />
      }
    >
      <Animated.View entering={FadeInUp.delay(100).duration(500)}>
        <ThemedText type="h1" style={styles.greeting}>
          {getGreeting()},
        </ThemedText>
        <ThemedText type="h2" style={[styles.name, { color: theme.link }]}>
          {user?.fullName?.split(" ")[0] || "there"}
        </ThemedText>
      </Animated.View>

      {activeSession && activeAttendance && (
        <Animated.View entering={FadeInUp.delay(120).duration(500)}>
          <Card elevation={4} style={[
            styles.activeSessionCard, 
            { borderColor: (activeAttendance.isVerified || activeAttendance.confirmedByLeader) ? theme.success : "#F59E0B", borderWidth: 2 }
          ]}>
            <View style={styles.activeSessionHeader}>
              <View style={[styles.liveDot, { backgroundColor: activeAttendance.isVerified ? theme.success : "#F59E0B" }]} />
              <ThemedText type="small" style={{ color: activeAttendance.isVerified ? theme.success : "#F59E0B", fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5 }}>
                {activeAttendance.isVerified ? "Verified Session" : "Awaiting Verification"}
              </ThemedText>
            </View>
            
            <ThemedText type="h3" style={styles.activeSessionTitle}>{activeSession.title}</ThemedText>
            
            <View style={styles.activeSessionDetails}>
              <View style={styles.detailRow}>
                <Feather name="clock" size={14} color={theme.textSecondary} />
                <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.xs }}>
                  Checked in at {activeAttendance.entryTime || activeAttendance.checkedInAt ? 
                    new Date(activeAttendance.entryTime || activeAttendance.checkedInAt!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 
                    "Just now"}
                </ThemedText>
              </View>
              {!activeAttendance.isVerified && (
                <View style={[styles.detailRow, { marginTop: 4 }]}>
                  <Feather name="info" size={14} color="#F59E0B" />
                  <ThemedText type="small" style={{ color: "#F59E0B", marginLeft: Spacing.xs, fontWeight: "600" }}>
                    Facilitator must verify your presence.
                  </ThemedText>
                </View>
              )}
            </View>

            <View style={{ flexDirection: "row", gap: Spacing.sm }}>
                <Pressable 
                onPress={handleCheckout}
                disabled={checkingOut}
                style={({ pressed }) => [
                    styles.checkoutButton, 
                    { backgroundColor: theme.backgroundSecondary, opacity: pressed || checkingOut ? 0.8 : 1, flex: 1, borderWidth: 1, borderColor: theme.border }
                ]}
                >
                <Feather name="log-out" size={16} color={theme.textSecondary} />
                <ThemedText type="body" style={[styles.checkoutButtonText, { color: theme.textSecondary, fontSize: 13 }]}>
                    {checkingOut ? "..." : "Check Out"}
                </ThemedText>
                </Pressable>
                
                {activeAttendance.isVerified && (
                    <View style={[styles.verifiedBadge, { backgroundColor: theme.success + "15", flex: 1.5, justifyContent: "center", alignItems: "center", borderRadius: BorderRadius.md, flexDirection: "row", gap: 6 }]}>
                        <Feather name="shield" size={16} color={theme.success} />
                        <ThemedText style={{ color: theme.success, fontWeight: "800", fontSize: 13 }}>Validated</ThemedText>
                    </View>
                )}
            </View>
          </Card>
        </Animated.View>
      )}

      {enrolledPrograms.length > 0 ? (
        <Animated.View entering={FadeInUp.delay(150).duration(500)}>
          <ThemedText type="h3" style={styles.sectionTitle}>
            My Programs ({enrolledPrograms.length})
          </ThemedText>
          {enrolledPrograms.map((program, index) => {
            const enrollment = userEnrollments.find(e => e.programId === program.id);
            const statusColor = enrollment?.status === "graduated" ? theme.success : 
                                enrollment?.status === "assigned" ? theme.success : theme.accent;
            const statusText = enrollment?.status === "graduated" ? "Graduated" :
                              enrollment?.status === "assigned" ? "In Cell Group" : "Enrolled";
            return (
              <View key={program.id} style={{ marginBottom: Spacing.xl }}>
                <Card elevation={1} style={styles.programCard}>
                  <View style={styles.programHeader}>
                    <View style={[styles.programIcon, { backgroundColor: theme.link + "20" }]}>
                      <Feather name="book-open" size={20} color={theme.link} />
                    </View>
                    <View style={styles.programInfo}>
                      <ThemedText type="h4" numberOfLines={1}>{program.name}</ThemedText>
                      <View style={styles.statusContainer}>
                        <View style={styles.statusRow}>
                          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                          <ThemedText type="small" style={{ color: statusColor, fontWeight: "800", textTransform: 'uppercase' }}>
                            {statusText}
                          </ThemedText>
                        </View>
                        
                        {/* Payment Status Badge */}
                        {userPayments.some(p => p.programId === program.id) && (
                          <View style={[
                            styles.paymentBadge, 
                            { backgroundColor: userPayments.find(p => p.programId === program.id)?.status === 'paid' ? theme.success + '20' : theme.warning + '20' }
                          ]}>
                            <ThemedText type="small" style={{ 
                              color: userPayments.find(p => p.programId === program.id)?.status === 'paid' ? theme.success : theme.warning,
                              fontSize: 10,
                              fontWeight: '800',
                              textTransform: 'uppercase'
                            }}>
                              {userPayments.find(p => p.programId === program.id)?.status}
                            </ThemedText>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                </Card>

                {/* New Dedicated Cell Identity Section */}
                {userGroups[program.id] && (
                  <Animated.View entering={FadeInUp.delay(200).duration(500)} style={styles.cellIdentitySection}>
                    <Pressable 
                      onPress={() => navigation.navigate('MyCellTab')}
                      style={({ pressed }) => [
                        styles.cellIdentityCard,
                        { borderColor: theme.link + '30', borderStyle: 'dashed', opacity: pressed ? 0.8 : 1 }
                      ]}
                    >
                      <View style={styles.cellIdentityHeader}>
                        <View>
                          <ThemedText type="small" style={styles.cellIdentityLabel}>Your Cell Group</ThemedText>
                          <ThemedText type="h3" style={styles.cellIdentityName}>{userGroups[program.id].name}</ThemedText>
                        </View>
                        <View style={styles.facilitatorGroup}>
                           <ThemedText type="small" style={styles.facilitatorLabel}>Facilitator</ThemedText>
                           <ThemedText type="body" style={styles.facilitatorName}>{userGroups[program.id].facilitatorName}</ThemedText>
                        </View>
                      </View>

                      {memberPreviews[program.id] && memberPreviews[program.id].count > 0 && (
                        <View style={styles.mateSection}>
                          <ThemedText type="small" style={styles.mateLabel}>Together with {memberPreviews[program.id].count} cell mates:</ThemedText>
                          <View style={styles.mateList}>
                             {memberPreviews[program.id].others.map((name: string, i: number) => (
                               <View key={i} style={[styles.mateAvatar, { backgroundColor: theme.link + (i === 0 ? '40' : i === 1 ? '25' : '15') }]}>
                                 <ThemedText style={styles.mateInitial}>{name[0]}</ThemedText>
                               </View>
                             ))}
                             <View style={styles.moreMates}>
                                <Feather name="arrow-right" size={12} color={theme.textSecondary} />
                             </View>
                          </View>
                        </View>
                      )}
                    </Pressable>
                  </Animated.View>
                )}
              </View>
            );
          })}
        </Animated.View>
      ) : (
        <Animated.View entering={FadeInUp.delay(150).duration(500)}>
          <Card elevation={1} style={styles.programCard}>
            <View style={styles.emptyProgramState}>
              <Feather name="book" size={32} color={theme.textSecondary} />
              <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.sm, textAlign: "center" }}>
                You're not enrolled in any programs yet
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.link, marginTop: Spacing.xs }}>
                Go to Programs tab to browse and enroll
              </ThemedText>
            </View>
          </Card>
        </Animated.View>
      )}

      <Animated.View entering={FadeInUp.delay(200).duration(500)}>
        <Card elevation={1} style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View style={styles.progressIconContainer}>
              <Feather name="award" size={20} color={theme.link} />
            </View>
            <View style={styles.progressText}>
              <ThemedText type="h4">Graduation Progress</ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {attendedCount}/{totalSessions} sessions verified
              </ThemedText>
            </View>
            <ThemedText type="h3" style={{ color: theme.link }}>
              {Math.round(graduationProgress * 100)}%
            </ThemedText>
          </View>
          <ProgressBar
            progress={graduationProgress}
            color={theme.link}
            trackColor={theme.progressTrack}
          />
          {attendedCount >= totalSessions && totalSessions > 0 ? (
            <View style={[styles.eligibleBadge, { backgroundColor: theme.success }]}>
              <Feather name="check-circle" size={14} color="#FFFFFF" />
              <ThemedText type="small" style={{ color: "#FFFFFF", marginLeft: Spacing.xs }}>
                Eligible for Graduation
              </ThemedText>
            </View>
          ) : (
            <ThemedText
              type="small"
              style={{ color: theme.textSecondary, marginTop: Spacing.md }}
            >
              Attend {Math.max(0, totalSessions - attendedCount)} more session{totalSessions - attendedCount !== 1 ? "s" : ""} to be eligible
            </ThemedText>
          )}
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(300).duration(500)}>
        <ThemedText type="h3" style={styles.sectionTitle}>
          Next Session
        </ThemedText>
        {upcomingSession ? (
          <Card elevation={1} style={styles.sessionCard}>
            <View style={styles.sessionDate}>
              <View style={[styles.dateBox, { backgroundColor: theme.link }]}>
                <ThemedText type="small" style={{ color: "#FFFFFF", fontWeight: "600" }}>
                  {new Date(upcomingSession.date).toLocaleDateString("en-US", { weekday: "short" })}
                </ThemedText>
                <ThemedText type="h2" style={{ color: "#FFFFFF" }}>
                  {new Date(upcomingSession.date).getDate()}
                </ThemedText>
              </View>
              <View style={styles.sessionInfo}>
                <ThemedText type="h4">{upcomingSession.title}</ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Session {upcomingSession.sessionNumber} of {programSessions.length}
                </ThemedText>
                <ThemedText
                  type="small"
                  style={{ color: theme.textSecondary, marginTop: Spacing.xs }}
                  numberOfLines={2}
                >
                  {upcomingSession.overview}
                </ThemedText>
              </View>
            </View>
          </Card>
        ) : (
          <View style={styles.emptyState}>
            <Image
              source={require("../../assets/images/empty-sessions.png")}
              style={styles.emptyImage}
              resizeMode="contain"
            />
            <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "center" }}>
              No upcoming sessions
            </ThemedText>
          </View>
        )}
      </Animated.View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  greeting: {
    marginBottom: Spacing.xs,
  },
  name: {
    marginBottom: Spacing["2xl"],
  },
  programCard: {
    marginBottom: Spacing.lg,
  },
  programHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  programIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  programInfo: {
    flex: 1,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.sm,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.xs,
  },
  paymentBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  cellIdentitySection: {
    marginTop: -Spacing.md,
  },
  cellIdentityCard: {
    backgroundColor: 'transparent',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
  },
  cellIdentityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  cellIdentityLabel: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cellIdentityName: {
    fontSize: 16,
    fontWeight: '900',
    marginTop: 2,
  },
  facilitatorGroup: {
    alignItems: 'flex-end',
  },
  facilitatorLabel: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  facilitatorName: {
    fontSize: 12,
    fontWeight: '900',
    marginTop: 2,
  },
  mateSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: Spacing.md,
  },
  mateLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  mateList: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mateAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.xs,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  mateInitial: {
    fontSize: 10,
    fontWeight: '900',
    color: '#1e293b',
  },
  moreMates: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeSessionCard: {
    marginBottom: Spacing.xl,
    padding: Spacing.lg,
  },
  activeSessionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.sm,
  },
  activeSessionTitle: {
    marginBottom: Spacing.md,
  },
  activeSessionDetails: {
    marginBottom: Spacing.lg,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  checkoutButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  progressCard: {
    marginBottom: Spacing["2xl"],
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  progressIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  progressText: {
    flex: 1,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  eligibleBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.md,
  },
  sectionTitle: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
    marginTop: Spacing.xl,
  },
  sessionCard: {
    marginBottom: Spacing.lg,
  },
  sessionDate: {
    flexDirection: "row",
  },
  dateBox: {
    width: 56,
    height: 64,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.lg,
  },
  sessionInfo: {
    flex: 1,
    justifyContent: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
  },
  emptyProgramState: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
  },
  emptyImage: {
    width: 120,
    height: 120,
    marginBottom: Spacing.lg,
    opacity: 0.8,
  },
  emptyImageSmall: {
    width: 80,
    height: 80,
    marginBottom: Spacing.md,
    opacity: 0.8,
  },
  assignmentScroll: {
    paddingRight: Spacing.lg,
    gap: Spacing.md,
  },
  assignmentCard: {
    width: 180,
    padding: Spacing.lg,
  },
  assignmentBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  assignmentTitle: {
    marginBottom: Spacing.sm,
  },
  assignmentDue: {
    flexDirection: "row",
    alignItems: "center",
  },
  verifiedBadge: {
    height: 44,
  },
});
