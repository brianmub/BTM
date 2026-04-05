import React, { useEffect, useState, useCallback } from "react";
import { View, StyleSheet, ScrollView, Image, Pressable, RefreshControl, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInUp, FadeInRight } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

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
  console.log("[DEBUG] ParticipantHomeScreen loaded - v2 with attendance fixes");
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [userPayments, setUserPayments] = useState<PaymentRecord[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [graduationInfo, setGraduationInfo] = useState<{ eligible: boolean; sessionsConfirmed: number; totalSessions: number; assignmentsConfirmed: number; totalAssignments: number } | null>(null);

  const loadData = useCallback(async () => {
    if (!user?.organizationId) return;

    const [loadedSessions, loadedAssignments, loadedSubmissions, loadedPrograms, loadedEnrollments, loadedAttendance, loadedPayments] = await Promise.all([
      storage.getSessions(user.organizationId),
      storage.getAssignments(user.organizationId),
      storage.getSubmissions(user.organizationId),
      storage.getPrograms(user.organizationId),
      storage.getEnrollments(user.organizationId),
      storage.getUserAttendance(user.id),
      storage.getUserPayments(user.id),
    ]);
    setSessions(loadedSessions);
    setAssignments(loadedAssignments);
    setSubmissions(loadedSubmissions);
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
    a => a.userId === user?.id && a.confirmedByLeader
  );
  const attendedCount = confirmedAttendance.length;

  const upcomingSession = programSessions.find(
    (s) => new Date(s.date) > new Date()
  );

  const pendingAssignments = assignments.filter((a) => {
    if (a.programId !== userEnrollment?.programId) return false;
    const dueDate = new Date(a.dueDate);
    return dueDate > new Date();
  });

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
  }, [user?.id, userEnrollment?.programId, attendance, submissions]);

  const totalSessions = graduationInfo?.totalSessions || programSessions.length || 5;
  const graduationProgress = graduationInfo ? graduationInfo.sessionsConfirmed / totalSessions : attendedCount / totalSessions;

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
          <Card elevation={4} style={[styles.activeSessionCard, { borderColor: theme.success, borderWidth: 2 }]}>
            <View style={styles.activeSessionHeader}>
              <View style={[styles.liveDot, { backgroundColor: theme.success }]} />
              <ThemedText type="small" style={{ color: theme.success, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1 }}>
                Ongoing Session
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
            </View>

            <Pressable 
              onPress={handleCheckout}
              disabled={checkingOut}
              style={({ pressed }) => [
                styles.checkoutButton, 
                { backgroundColor: theme.error, opacity: pressed || checkingOut ? 0.8 : 1 }
              ]}
            >
              <Feather name="log-out" size={18} color="#FFFFFF" />
              <ThemedText type="body" style={styles.checkoutButtonText}>
                {checkingOut ? "Checking out..." : "Check Out Now"}
              </ThemedText>
            </Pressable>
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
              <Card key={program.id} elevation={1} style={[styles.programCard, { marginBottom: Spacing.sm }]}>
                <View style={styles.programHeader}>
                  <View style={[styles.programIcon, { backgroundColor: theme.link + "20" }]}>
                    <Feather name="book-open" size={20} color={theme.link} />
                  </View>
                  <View style={styles.programInfo}>
                    <ThemedText type="h4" numberOfLines={1}>{program.name}</ThemedText>
                    <View style={styles.statusContainer}>
                      <View style={styles.statusRow}>
                        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                        <ThemedText type="small" style={{ color: statusColor }}>
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
                {attendedCount}/{totalSessions} sessions confirmed
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

      <Animated.View entering={FadeInUp.delay(400).duration(500)}>
        <View style={styles.sectionHeader}>
          <ThemedText type="h3">Pending Assignments</ThemedText>
          <Pressable>
            <ThemedText type="link" style={{ color: theme.link }}>
              View All
            </ThemedText>
          </Pressable>
        </View>
        {pendingAssignments.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.assignmentScroll}
          >
            {pendingAssignments.map((assignment, index) => (
              <Animated.View
                key={assignment.id}
                entering={FadeInRight.delay(500 + index * 100).duration(400)}
              >
                <Card elevation={2} style={styles.assignmentCard}>
                  <View style={[styles.assignmentBadge, { backgroundColor: theme.accent }]}>
                    <Feather name="file-text" size={14} color="#FFFFFF" />
                  </View>
                  <ThemedText type="h4" numberOfLines={2} style={styles.assignmentTitle}>
                    {assignment.title}
                  </ThemedText>
                  <View style={styles.assignmentDue}>
                    <Feather name="clock" size={12} color={theme.textSecondary} />
                    <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.xs }}>
                      Due {formatDate(assignment.dueDate)}
                    </ThemedText>
                  </View>
                </Card>
              </Animated.View>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyState}>
            <Image
              source={require("../../assets/images/empty-assignments.png")}
              style={styles.emptyImageSmall}
              resizeMode="contain"
            />
            <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: "center" }}>
              No pending assignments
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
});
