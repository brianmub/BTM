import React, { useEffect, useState, useCallback } from "react";
import { View, StyleSheet, ScrollView, Image, Pressable, RefreshControl } from "react-native";
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
import { storage, Session, Assignment, Program, Enrollment, AttendanceRecord, AssignmentSubmission } from "@/lib/storage";

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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [graduationInfo, setGraduationInfo] = useState<{ eligible: boolean; sessionsConfirmed: number; assignmentsConfirmed: number; totalAssignments: number } | null>(null);

  const loadData = useCallback(async () => {
    const [loadedSessions, loadedAssignments, loadedSubmissions, loadedPrograms, loadedEnrollments, loadedAttendance] = await Promise.all([
      storage.getSessions(),
      storage.getAssignments(),
      storage.getSubmissions(),
      storage.getPrograms(),
      storage.getEnrollments(),
      storage.getAttendance(),
    ]);
    setSessions(loadedSessions);
    setAssignments(loadedAssignments);
    setSubmissions(loadedSubmissions);
    setPrograms(loadedPrograms);
    setEnrollments(loadedEnrollments);
    setAttendance(loadedAttendance);
  }, []);

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

  useEffect(() => {
    const checkGraduation = async () => {
      if (user?.id && userEnrollment?.programId) {
        const info = await storage.checkGraduationEligibility(user.id, userEnrollment.programId);
        setGraduationInfo(info);
      }
    };
    checkGraduation();
  }, [user?.id, userEnrollment?.programId, attendance, submissions]);

  const graduationProgress = graduationInfo ? graduationInfo.sessionsConfirmed / 5 : attendedCount / 5;

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
                    <View style={styles.statusRow}>
                      <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                      <ThemedText type="small" style={{ color: statusColor }}>
                        {statusText}
                      </ThemedText>
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
                {attendedCount}/5 sessions confirmed
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
          {attendedCount >= 5 ? (
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
              Attend {5 - attendedCount} more session{5 - attendedCount !== 1 ? "s" : ""} to be eligible
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
