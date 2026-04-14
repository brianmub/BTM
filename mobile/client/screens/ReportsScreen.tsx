import React, { useState, useCallback } from "react";
import { View, StyleSheet, ScrollView, Pressable, Modal, FlatList, RefreshControl, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInUp } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { storage, User, Enrollment, AttendanceRecord, AssignmentSubmission, Assignment, Session, Program, PaymentRecord } from "@/lib/storage";

interface ReportItem {
  id: string;
  icon: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
  color: string;
}

interface GraduationCandidate {
  id: string;
  name: string;
  sessionsAttended: number;
  assignmentsCompleted: number;
  totalAssignments: number;
  isEligible: boolean;
}

interface AttendanceReportItem {
  sessionId: string;
  sessionTitle: string;
  sessionNumber: number;
  programName: string;
  date: string;
  checkedInCount: number;
  confirmedCount: number;
  totalParticipants: number;
}

interface AssignmentReportItem {
  assignmentId: string;
  title: string;
  programName: string;
  dueDate: string;
  submittedCount: number;
  confirmedCount: number;
  totalParticipants: number;
}

interface PaymentReportItem {
  programId: string;
  programName: string;
  totalCollected: number;
  totalPending: number;
  paidCount: number;
  pendingCount: number;
}

interface ReportStats {
  totalEnrollments: number;
  averageAttendance: number;
  assignmentCompletion: number;
  graduationEligible: number;
  totalPayments: number;
}

export default function ReportsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<GraduationCandidate[]>([]);
  const [attendanceReport, setAttendanceReport] = useState<AttendanceReportItem[]>([]);
  const [assignmentReport, setAssignmentReport] = useState<AssignmentReportItem[]>([]);
  const [paymentReport, setPaymentReport] = useState<PaymentReportItem[]>([]);
  const [stats, setStats] = useState<ReportStats>({
    totalEnrollments: 0,
    averageAttendance: 0,
    assignmentCompletion: 0,
    graduationEligible: 0,
    totalPayments: 0,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const [users, enrollments, attendance, submissions, assignments, sessions, programs, payments] = await Promise.all([
      storage.getAllUsers(),
      storage.getEnrollments(),
      storage.getAttendance(),
      storage.getSubmissions(),
      storage.getAssignments(),
      storage.getSessions(),
      storage.getPrograms(),
      storage.getPayments(),
    ]);

    const participants = users.filter(u => u.role === "participant");
    const confirmedAttendance = attendance.filter(a => a.confirmedByLeader);
    const confirmedSubmissions = submissions.filter(s => s.isConfirmed);

    // Graduation candidates
    const graduationCandidates: GraduationCandidate[] = [];
    let eligibleCount = 0;

    for (const participant of participants) {
      const userEnrollments = enrollments.filter(e => e.userId === participant.id);
      if (userEnrollments.length === 0) continue;

      const userAttendance = confirmedAttendance.filter(a => a.userId === participant.id);
      const userSubmissions = confirmedSubmissions.filter(s => s.userId === participant.id);
      
      const sessionsAttended = userAttendance.length;
      const assignmentsCompleted = userSubmissions.length;
      const totalAssignments = assignments.length;
      const isEligible = sessionsAttended >= 5 && (totalAssignments === 0 || assignmentsCompleted >= totalAssignments);

      if (isEligible) eligibleCount++;

      graduationCandidates.push({
        id: participant.id,
        name: participant.fullName,
        sessionsAttended,
        assignmentsCompleted,
        totalAssignments,
        isEligible,
      });
    }

    // Attendance report by session
    const attendanceItems: AttendanceReportItem[] = sessions.map(session => {
      const program = programs.find(p => p.id === session.programId);
      const sessionAttendance = attendance.filter(a => a.sessionId === session.id);
      const checkedIn = sessionAttendance.filter(a => a.checkedIn).length;
      const confirmed = sessionAttendance.filter(a => a.confirmedByLeader).length;
      const programEnrollments = enrollments.filter(e => e.programId === session.programId);

      return {
        sessionId: session.id,
        sessionTitle: session.title,
        sessionNumber: session.sessionNumber,
        programName: program?.name || "Unknown",
        date: session.date,
        checkedInCount: checkedIn,
        confirmedCount: confirmed,
        totalParticipants: programEnrollments.length,
      };
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Assignment report
    const assignmentItems: AssignmentReportItem[] = assignments.map(assignment => {
      const program = programs.find(p => p.id === assignment.programId);
      const assignmentSubmissions = submissions.filter(s => s.assignmentId === assignment.id);
      const submitted = assignmentSubmissions.length;
      const confirmed = assignmentSubmissions.filter(s => s.isConfirmed).length;
      const programEnrollments = enrollments.filter(e => e.programId === assignment.programId);

      return {
        assignmentId: assignment.id,
        title: assignment.title,
        programName: program?.name || "Unknown",
        dueDate: assignment.dueDate,
        submittedCount: submitted,
        confirmedCount: confirmed,
        totalParticipants: programEnrollments.length,
      };
    }).sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());

    // Payment report by program
    const paymentItems: PaymentReportItem[] = programs.map(program => {
      const programPayments = payments.filter(p => p.programId === program.id);
      const paidPayments = programPayments.filter(p => p.isPaid);
      const pendingPayments = programPayments.filter(p => !p.isPaid);
      const totalCollected = paidPayments.reduce((sum, p) => sum + p.amount, 0);
      const totalPending = pendingPayments.reduce((sum, p) => sum + p.amount, 0);

      return {
        programId: program.id,
        programName: program.name,
        totalCollected,
        totalPending,
        paidCount: paidPayments.length,
        pendingCount: pendingPayments.length,
      };
    });

    const totalSessions = attendance.length > 0 ? new Set(attendance.map(a => a.sessionId)).size : 1;
    const avgAttendance = participants.length > 0 && totalSessions > 0
      ? Math.round((confirmedAttendance.length / (participants.length * totalSessions)) * 100)
      : 0;
    
    const assignmentCompletion = assignments.length > 0 && participants.length > 0
      ? Math.round((submissions.length / (assignments.length * participants.length)) * 100)
      : 0;

    const totalPaymentsCollected = payments.filter(p => p.isPaid).reduce((sum, p) => sum + p.amount, 0);

    setCandidates(graduationCandidates.sort((a, b) => (b.isEligible ? 1 : 0) - (a.isEligible ? 1 : 0)));
    setAttendanceReport(attendanceItems);
    setAssignmentReport(assignmentItems);
    setPaymentReport(paymentItems);
    setStats({
      totalEnrollments: enrollments.length,
      averageAttendance: Math.min(avgAttendance, 100),
      assignmentCompletion: Math.min(assignmentCompletion, 100),
      graduationEligible: eligibleCount,
      totalPayments: totalPaymentsCollected,
    });
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

  const reports: ReportItem[] = [
    {
      id: "attendance",
      icon: "check-circle",
      title: "Attendance Report",
      description: "View attendance statistics per session and per cell",
      color: theme.link,
    },
    {
      id: "assignments",
      icon: "file-text",
      title: "Assignment Report",
      description: "Track assignment completion rates across all cells",
      color: theme.success,
    },
    {
      id: "payments",
      icon: "dollar-sign",
      title: "Payment Summary",
      description: "Review cash payment records and outstanding balances",
      color: theme.accent,
    },
    {
      id: "graduation",
      icon: "award",
      title: "Graduation List",
      description: "View participants eligible for graduation",
      color: "#8B5CF6",
    },
  ];

  const handleReportPress = (reportId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveModal(reportId);
  };

  const closeModal = () => setActiveModal(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
  };

  const eligibleCount = candidates.filter((c) => c.isEligible).length;

  const renderCandidate = ({ item }: { item: GraduationCandidate }) => (
    <View style={[styles.candidateRow, { borderBottomColor: theme.border }]}>
      <View style={styles.candidateInfo}>
        <ThemedText type="body" style={{ fontWeight: "500" }}>
          {item.name}
        </ThemedText>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          {item.sessionsAttended} sessions · {item.assignmentsCompleted}/{item.totalAssignments} assignments
        </ThemedText>
      </View>
      <View
        style={[
          styles.eligibilityBadge,
          { backgroundColor: item.isEligible ? theme.success : theme.error },
        ]}
      >
        <Feather
          name={item.isEligible ? "check" : "x"}
          size={14}
          color="#FFFFFF"
        />
      </View>
    </View>
  );

  const renderAttendanceItem = ({ item }: { item: AttendanceReportItem }) => {
    const attendanceRate = item.totalParticipants > 0 
      ? Math.round((item.confirmedCount / item.totalParticipants) * 100) 
      : 0;

    return (
      <Card elevation={1} style={styles.reportItemCard}>
        <View style={styles.reportItemHeader}>
          <View style={[styles.sessionBadge, { backgroundColor: "#B10F2D" }]}>
            <Text style={{ color: "#FFFFFF", fontWeight: "900", fontSize: 18, textAlign: 'center' }}>
              {item.sessionNumber}
            </Text>
          </View>
          <View style={styles.reportItemInfo}>
            <ThemedText type="body" style={{ fontWeight: "600" }}>
              {item.sessionTitle}
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {item.programName} · {formatDate(item.date)}
            </ThemedText>
          </View>
        </View>
        <View style={[styles.reportItemStats, { borderTopColor: theme.border }]}>
          <View style={styles.statColumn}>
            <ThemedText type="h4" style={{ color: theme.link }}>{item.checkedInCount}</ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>Checked In</ThemedText>
          </View>
          <View style={styles.statColumn}>
            <ThemedText type="h4" style={{ color: theme.success }}>{item.confirmedCount}</ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>Confirmed</ThemedText>
          </View>
          <View style={styles.statColumn}>
            <ThemedText type="h4" style={{ color: theme.accent }}>{attendanceRate}%</ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>Rate</ThemedText>
          </View>
        </View>
      </Card>
    );
  };

  const renderAssignmentItem = ({ item }: { item: AssignmentReportItem }) => {
    const completionRate = item.totalParticipants > 0 
      ? Math.round((item.confirmedCount / item.totalParticipants) * 100) 
      : 0;
    const isPastDue = new Date(item.dueDate) < new Date();

    return (
      <Card elevation={1} style={styles.reportItemCard}>
        <View style={styles.reportItemHeader}>
          <View style={[styles.assignmentIcon, { backgroundColor: isPastDue ? theme.error + "20" : theme.success + "20" }]}>
            <Feather name="file-text" size={20} color={isPastDue ? theme.error : theme.success} />
          </View>
          <View style={styles.reportItemInfo}>
            <ThemedText type="body" style={{ fontWeight: "600" }}>
              {item.title}
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {item.programName} · Due {formatDate(item.dueDate)}
            </ThemedText>
          </View>
          {isPastDue ? (
            <View style={[styles.pastDueBadge, { backgroundColor: theme.error }]}>
              <ThemedText type="small" style={{ color: "#FFF", fontWeight: "600" }}>Past Due</ThemedText>
            </View>
          ) : null}
        </View>
        <View style={[styles.reportItemStats, { borderTopColor: theme.border }]}>
          <View style={styles.statColumn}>
            <ThemedText type="h4" style={{ color: theme.link }}>{item.submittedCount}</ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>Submitted</ThemedText>
          </View>
          <View style={styles.statColumn}>
            <ThemedText type="h4" style={{ color: theme.success }}>{item.confirmedCount}</ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>Confirmed</ThemedText>
          </View>
          <View style={styles.statColumn}>
            <ThemedText type="h4" style={{ color: theme.accent }}>{completionRate}%</ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>Complete</ThemedText>
          </View>
        </View>
      </Card>
    );
  };

  const renderPaymentItem = ({ item }: { item: PaymentReportItem }) => (
    <Card elevation={1} style={styles.reportItemCard}>
      <View style={styles.reportItemHeader}>
        <View style={[styles.paymentIcon, { backgroundColor: theme.accent + "20" }]}>
          <Feather name="dollar-sign" size={20} color={theme.accent} />
        </View>
        <View style={styles.reportItemInfo}>
          <ThemedText type="body" style={{ fontWeight: "600" }}>
            {item.programName}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {item.paidCount + item.pendingCount} total payments
          </ThemedText>
        </View>
      </View>
      <View style={[styles.reportItemStats, { borderTopColor: theme.border }]}>
        <View style={styles.statColumn}>
          <ThemedText type="h4" style={{ color: theme.success }}>{formatCurrency(item.totalCollected)}</ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>Collected</ThemedText>
        </View>
        <View style={styles.statColumn}>
          <ThemedText type="h4" style={{ color: theme.error }}>{formatCurrency(item.totalPending)}</ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>Pending</ThemedText>
        </View>
        <View style={styles.statColumn}>
          <ThemedText type="h4" style={{ color: theme.link }}>{item.paidCount}</ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>Paid</ThemedText>
        </View>
      </View>
    </Card>
  );

  const totalCollected = paymentReport.reduce((sum, p) => sum + p.totalCollected, 0);
  const totalPending = paymentReport.reduce((sum, p) => sum + p.totalPending, 0);

  return (
    <ThemedView style={styles.container}>
      <ScrollView
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
            progressViewOffset={headerHeight}
          />
        }
      >
        <Animated.View entering={FadeInUp.delay(100).duration(500)}>
          <ThemedText type="h3" style={styles.sectionTitle}>
            Available Reports
          </ThemedText>
        </Animated.View>

        {reports.map((report, index) => (
          <Animated.View
            key={report.id}
            entering={FadeInUp.delay(150 + index * 50).duration(400)}
          >
            <Card
              elevation={1}
              style={styles.reportCard}
              onPress={() => handleReportPress(report.id)}
            >
              <View style={styles.reportRow}>
                <View style={[styles.reportIcon, { backgroundColor: report.color + "20" }]}>
                  <Feather name={report.icon} size={24} color={report.color} />
                </View>
                <View style={styles.reportContent}>
                  <ThemedText type="h4">{report.title}</ThemedText>
                  <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.xs }}>
                    {report.description}
                  </ThemedText>
                </View>
                <Feather name="chevron-right" size={20} color={theme.textSecondary} />
              </View>
            </Card>
          </Animated.View>
        ))}

        <Animated.View entering={FadeInUp.delay(400).duration(500)}>
          <ThemedText type="h3" style={[styles.sectionTitle, { marginTop: Spacing["2xl"] }]}>
            Quick Stats
          </ThemedText>
          <Card elevation={1} style={styles.quickStatsCard}>
            <View style={styles.statRow}>
              <ThemedText type="body">Total Enrollments</ThemedText>
              <ThemedText type="h4" style={{ color: theme.link }}>{stats.totalEnrollments}</ThemedText>
            </View>
            <View style={[styles.statRow, { borderTopColor: theme.border, borderTopWidth: 1 }]}>
              <ThemedText type="body">Average Attendance</ThemedText>
              <ThemedText type="h4" style={{ color: theme.success }}>{stats.averageAttendance}%</ThemedText>
            </View>
            <View style={[styles.statRow, { borderTopColor: theme.border, borderTopWidth: 1 }]}>
              <ThemedText type="body">Assignment Completion</ThemedText>
              <ThemedText type="h4" style={{ color: theme.accent }}>{stats.assignmentCompletion}%</ThemedText>
            </View>
            <View style={[styles.statRow, { borderTopColor: theme.border, borderTopWidth: 1 }]}>
              <ThemedText type="body">Graduation Eligible</ThemedText>
              <ThemedText type="h4" style={{ color: "#8B5CF6" }}>{stats.graduationEligible}</ThemedText>
            </View>
            <View style={[styles.statRow, { borderTopColor: theme.border, borderTopWidth: 1 }]}>
              <ThemedText type="body">Total Payments</ThemedText>
              <ThemedText type="h4" style={{ color: theme.success }}>{formatCurrency(stats.totalPayments)}</ThemedText>
            </View>
          </Card>
        </Animated.View>
      </ScrollView>

      {/* Attendance Report Modal */}
      <Modal
        visible={activeModal === "attendance"}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.backgroundRoot }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Pressable onPress={closeModal} style={styles.closeButton}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
            <ThemedText type="h4">Attendance Report</ThemedText>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.modalSummary}>
            <View style={[styles.summaryBox, { backgroundColor: theme.link + "20" }]}>
              <ThemedText type="h2" style={{ color: theme.link }}>
                {attendanceReport.length}
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.link }}>
                Sessions
              </ThemedText>
            </View>
            <View style={[styles.summaryBox, { backgroundColor: theme.success + "20" }]}>
              <ThemedText type="h2" style={{ color: theme.success }}>
                {stats.averageAttendance}%
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.success }}>
                Avg Rate
              </ThemedText>
            </View>
          </View>

          <FlatList
            data={attendanceReport}
            renderItem={renderAttendanceItem}
            keyExtractor={(item) => item.sessionId}
            contentContainerStyle={styles.modalList}
            ListEmptyComponent={
              <View style={styles.emptyList}>
                <Feather name="calendar" size={48} color={theme.textSecondary} />
                <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.md }}>
                  No sessions recorded yet
                </ThemedText>
              </View>
            }
          />
        </View>
      </Modal>

      {/* Assignment Report Modal */}
      <Modal
        visible={activeModal === "assignments"}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.backgroundRoot }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Pressable onPress={closeModal} style={styles.closeButton}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
            <ThemedText type="h4">Assignment Report</ThemedText>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.modalSummary}>
            <View style={[styles.summaryBox, { backgroundColor: theme.success + "20" }]}>
              <ThemedText type="h2" style={{ color: theme.success }}>
                {assignmentReport.length}
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.success }}>
                Assignments
              </ThemedText>
            </View>
            <View style={[styles.summaryBox, { backgroundColor: theme.accent + "20" }]}>
              <ThemedText type="h2" style={{ color: theme.accent }}>
                {stats.assignmentCompletion}%
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.accent }}>
                Complete
              </ThemedText>
            </View>
          </View>

          <FlatList
            data={assignmentReport}
            renderItem={renderAssignmentItem}
            keyExtractor={(item) => item.assignmentId}
            contentContainerStyle={styles.modalList}
            ListEmptyComponent={
              <View style={styles.emptyList}>
                <Feather name="file-text" size={48} color={theme.textSecondary} />
                <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.md }}>
                  No assignments created yet
                </ThemedText>
              </View>
            }
          />
        </View>
      </Modal>

      {/* Payment Report Modal */}
      <Modal
        visible={activeModal === "payments"}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.backgroundRoot }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Pressable onPress={closeModal} style={styles.closeButton}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
            <ThemedText type="h4">Payment Summary</ThemedText>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.modalSummary}>
            <View style={[styles.summaryBox, { backgroundColor: theme.success + "20" }]}>
              <ThemedText type="h3" style={{ color: theme.success }}>
                {formatCurrency(totalCollected)}
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.success }}>
                Collected
              </ThemedText>
            </View>
            <View style={[styles.summaryBox, { backgroundColor: theme.error + "20" }]}>
              <ThemedText type="h3" style={{ color: theme.error }}>
                {formatCurrency(totalPending)}
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.error }}>
                Pending
              </ThemedText>
            </View>
          </View>

          <FlatList
            data={paymentReport}
            renderItem={renderPaymentItem}
            keyExtractor={(item) => item.programId}
            contentContainerStyle={styles.modalList}
            ListEmptyComponent={
              <View style={styles.emptyList}>
                <Feather name="dollar-sign" size={48} color={theme.textSecondary} />
                <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.md }}>
                  No payment records yet
                </ThemedText>
              </View>
            }
          />
        </View>
      </Modal>

      {/* Graduation Modal */}
      <Modal
        visible={activeModal === "graduation"}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.backgroundRoot }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Pressable onPress={closeModal} style={styles.closeButton}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
            <ThemedText type="h4">Graduation List</ThemedText>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.modalSummary}>
            <View style={[styles.summaryBox, { backgroundColor: theme.success + "20" }]}>
              <ThemedText type="h2" style={{ color: theme.success }}>
                {eligibleCount}
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.success }}>
                Eligible
              </ThemedText>
            </View>
            <View style={[styles.summaryBox, { backgroundColor: theme.error + "20" }]}>
              <ThemedText type="h2" style={{ color: theme.error }}>
                {candidates.length - eligibleCount}
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.error }}>
                Not Eligible
              </ThemedText>
            </View>
          </View>

          <View style={styles.requirementsInfo}>
            <Feather name="info" size={16} color={theme.textSecondary} />
            <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.sm, flex: 1 }}>
              Eligibility: 5+ confirmed sessions AND all assignments completed
            </ThemedText>
          </View>

          <FlatList
            data={candidates}
            renderItem={renderCandidate}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.candidateList}
            ListEmptyComponent={
              <View style={styles.emptyList}>
                <Feather name="users" size={48} color={theme.textSecondary} />
                <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.md }}>
                  No participants enrolled yet
                </ThemedText>
              </View>
            }
          />
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionTitle: {
    marginBottom: Spacing.lg,
  },
  reportCard: {
    marginBottom: Spacing.md,
  },
  reportRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  reportIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  reportContent: {
    flex: 1,
  },
  quickStatsCard: {
    padding: 0,
    overflow: "hidden",
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholder: {
    width: 40,
  },
  modalSummary: {
    flexDirection: "row",
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  summaryBox: {
    flex: 1,
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  modalList: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  reportItemCard: {
    marginBottom: Spacing.md,
  },
  reportItemHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  sessionBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  assignmentIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  paymentIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  reportItemInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  reportItemStats: {
    flexDirection: "row",
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  statColumn: {
    flex: 1,
    alignItems: "center",
  },
  pastDueBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  requirementsInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  candidateList: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  candidateRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  candidateInfo: {
    flex: 1,
  },
  eligibilityBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyList: {
    alignItems: "center",
    paddingVertical: Spacing["2xl"],
  },
});
