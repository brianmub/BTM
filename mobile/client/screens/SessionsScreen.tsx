import React, { useEffect, useState, useCallback } from "react";
import { View, StyleSheet, FlatList, Pressable, RefreshControl, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInUp } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useNavigation } from "@react-navigation/native";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { storage, Session, AttendanceRecord } from "@/lib/storage";

export default function SessionsScreen() {
  console.log("[DEBUG] SessionsScreen loaded - v2 with attendance logic fixes");
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [checkingOutId, setCheckingOutId] = useState<string | null>(null);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user?.organizationId) return;

    const [loadedSessions, loadedAttendance] = await Promise.all([
      storage.getSessions(user.organizationId),
      storage.getUserAttendance(user.id),
    ]);
    setSessions(loadedSessions.sort((a, b) => a.sessionNumber - b.sessionNumber));
    setAttendance(loadedAttendance);
  }, [user?.organizationId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadData();
    setIsRefreshing(false);
  };

  const handleCheckIn = async (session: Session) => {
    if (!user) return;
    
    const sessionDate = new Date(session.date);
    const now = new Date();
    const dayDiff = Math.floor((sessionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (dayDiff > 0) {
      Alert.alert(
        "Check-in Not Available",
        `This session is scheduled for ${sessionDate.toLocaleDateString()}. You can check in on the day of the session.`
      );
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await storage.checkInToSession(user.id, session.id, session.programId);
    await loadData();
    
    Alert.alert(
      "Checked In!",
      `You've checked in for "${session.title}". Your facilitator will confirm your attendance.`
    );
  };

  const isCheckedIn = (sessionId: string): boolean => {
    if (!user) return false;
    return attendance.some(a => a.sessionId === sessionId && a.userId === user.id && a.checkedIn);
  };

  const isConfirmed = (sessionId: string): boolean => {
    if (!user) return false;
    return attendance.some(a => a.sessionId === sessionId && a.userId === user.id && a.confirmedByLeader);
  };

  const getAttendanceRecord = (sessionId: string): AttendanceRecord | undefined => {
    if (!user) return undefined;
    return attendance.find(a => a.sessionId === sessionId && a.userId === user.id);
  };

  const formatTime = (isoString?: string): string => {
    if (!isoString) return "-";
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return "-";
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return "-";
    }
  };

  const canCheckOut = async (sessionDate: string): Promise<boolean> => {
    return storage.isCheckoutAvailable(sessionDate);
  };

  const handleQRCheckIn = (session: Session) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("QRScanner", {
      mode: "checkin",
      sessionId: session.id,
      programId: session.programId,
      sessionDate: session.date,
    });
  };

  const handleQRCheckOut = async (session: Session) => {
    const isAvailable = await storage.isCheckoutAvailable(session.date);
    if (!isAvailable) {
      Alert.alert(
        "Check-Out Not Available",
        "Check-out is only available after 11:00 AM on the session date."
      );
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("QRScanner", {
      mode: "checkout",
      sessionId: session.id,
      programId: session.programId,
      sessionDate: session.date,
    });
  };

  const handleDirectCheckOut = async (session: Session) => {
    const isAvailable = await storage.isCheckoutAvailable(session.date);
    if (!isAvailable) {
      Alert.alert(
        "Check-Out Not Available",
        "Check-out is only available after 11:00 AM on the session date."
      );
      return;
    }

    try {
      setCheckingOutId(session.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const result = await storage.checkOutOfSession(user!.id, session.id);
      
      if (result.success) {
        Alert.alert("Success", "Successfully checked out! Hope you enjoyed the session.");
        loadData();
      } else {
        Alert.alert("Error", result.message);
      }
    } catch (err) {
      Alert.alert("Error", "Failed to check out. Please try again or use the QR scanner.");
    } finally {
      setCheckingOutId(null);
    }
  };

  const getSessionStatus = (session: Session): "upcoming" | "available" | "past" => {
    const sessionDate = new Date(session.date);
    const now = new Date();
    const dayDiff = Math.floor((sessionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (dayDiff > 0) return "upcoming";
    if (dayDiff >= -1) return "available";
    return "past";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  const renderSession = ({ item: session, index }: { item: Session; index: number }) => {
    const status = getSessionStatus(session);
    const checkedIn = isCheckedIn(session.id);
    const hasActiveOtherSession = attendance.some(a => a.sessionId !== session.id && a.checkedIn && !a.exitTime);
    const confirmed = isConfirmed(session.id);
    const isExpanded = expandedSessionId === session.id;

    return (
      <Animated.View entering={FadeInUp.delay(index * 100).duration(400)}>
        <Card elevation={1} style={styles.sessionCard}>
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              setExpandedSessionId(isExpanded ? null : session.id);
            }}
          >
            <View style={styles.sessionHeader}>
              <View style={[styles.sessionNumber, { backgroundColor: theme.link }]}>
                <ThemedText type="h4" style={{ color: "#FFFFFF" }}>
                  {session.sessionNumber}
                </ThemedText>
              </View>
              <View style={styles.sessionInfo}>
                <ThemedText type="h4">{session.title}</ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  {formatDate(session.date)}
                </ThemedText>
              </View>
              <View style={styles.statusContainer}>
                {confirmed ? (
                  <View style={[styles.statusBadge, { backgroundColor: theme.success }]}>
                    <Feather name="check-circle" size={14} color="#FFFFFF" />
                  </View>
                ) : checkedIn ? (
                  <View style={[styles.statusBadge, { backgroundColor: theme.accent }]}>
                    <Feather name="clock" size={14} color="#FFFFFF" />
                  </View>
                ) : null}
                <Feather
                  name={isExpanded ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={theme.textSecondary}
                />
              </View>
            </View>
          </Pressable>

          {isExpanded ? (
            <View style={styles.expandedContent}>
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
              
              <ThemedText type="h4" style={styles.overviewTitle}>
                Overview
              </ThemedText>
              <ThemedText type="body" style={{ color: theme.textSecondary, marginBottom: Spacing.lg }}>
                {session.overview}
              </ThemedText>

              {session.topics.length > 0 ? (
                <>
                  <ThemedText type="h4" style={styles.overviewTitle}>
                    Topics Covered
                  </ThemedText>
                  {session.topics.map((topic, i) => (
                    <View key={i} style={styles.topicItem}>
                      <View style={[styles.topicBullet, { backgroundColor: theme.link }]} />
                      <ThemedText type="body" style={{ flex: 1 }}>
                        {topic}
                      </ThemedText>
                    </View>
                  ))}
                </>
              ) : null}

              {checkedIn ? (
                <View style={[styles.timeSection, { backgroundColor: theme.backgroundSecondary }]}>
                  <ThemedText type="h4" style={styles.timeSectionTitle}>
                    Attendance Record
                  </ThemedText>
                  <View style={styles.timeRow}>
                    <View style={styles.timeItem}>
                      <Feather name="log-in" size={16} color={theme.success} />
                      <View style={styles.timeInfo}>
                        <ThemedText type="small" style={{ color: theme.textSecondary }}>
                          Entry Time
                        </ThemedText>
                        <ThemedText type="body">
                          {formatTime(getAttendanceRecord(session.id)?.entryTime)}
                        </ThemedText>
                      </View>
                    </View>
                    <View style={styles.timeItem}>
                      <Feather name="log-out" size={16} color={getAttendanceRecord(session.id)?.exitTime ? theme.primary : theme.textSecondary} />
                      <View style={styles.timeInfo}>
                        <ThemedText type="small" style={{ color: theme.textSecondary }}>
                          Exit Time
                        </ThemedText>
                        <ThemedText type="body">
                          {formatTime(getAttendanceRecord(session.id)?.exitTime)}
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                </View>
              ) : null}

              <View style={styles.actionContainer}>
                {confirmed ? (
                  <View style={[styles.confirmedBadge, { backgroundColor: theme.success + "20" }]}>
                    <Feather name="check-circle" size={18} color={theme.success} />
                    <ThemedText type="body" style={{ color: theme.success, marginLeft: Spacing.sm }}>
                      Attendance Confirmed
                    </ThemedText>
                  </View>
                ) : checkedIn ? (
                  <>
                    <View style={[styles.confirmedBadge, { backgroundColor: theme.accent + "20", marginBottom: Spacing.md }]}>
                      <Feather name="clock" size={18} color={theme.accent} />
                      <ThemedText type="body" style={{ color: theme.accent, marginLeft: Spacing.sm }}>
                        Checked In - Awaiting Confirmation
                      </ThemedText>
                    </View>
                    {!getAttendanceRecord(session.id)?.exitTime ? (
                      <Button
                        variant="primary"
                        onPress={() => handleDirectCheckOut(session)}
                        loading={checkingOutId === session.id}
                        style={[styles.checkInButton, { backgroundColor: theme.error }]}
                      >
                        Check Out Now
                      </Button>
                    ) : null}
                  </>
                ) : !hasActiveOtherSession ? (
                  <View style={styles.qrButtonsContainer}>
                    <Button
                      onPress={() => handleQRCheckIn(session)}
                      disabled={status === "past"}
                      style={styles.qrButton}
                    >
                      Scan QR to Check In
                    </Button>
                    <ThemedText type="small" style={[styles.qrHint, { color: theme.textSecondary }]}>
                      Scan the session QR code to record your entry time
                    </ThemedText>
                  </View>
                ) : (
                  <View style={[styles.confirmedBadge, { backgroundColor: theme.textSecondary + "20" }]}>
                    <Feather name="alert-circle" size={18} color={theme.textSecondary} />
                    <ThemedText type="body" style={{ color: theme.textSecondary, marginLeft: Spacing.sm }}>
                      Another session is currently active
                    </ThemedText>
                  </View>
                )}
              </View>
            </View>
          ) : null}
        </Card>
      </Animated.View>
    );
  };

  const attendedCount = attendance.filter(a => a.userId === user?.id && a.confirmedByLeader).length;

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        renderItem={renderSession}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: tabBarHeight + Spacing.xl,
          paddingHorizontal: Spacing.lg,
        }}
        ListHeaderComponent={
          <View style={styles.header}>
            <ThemedText type="h2" style={styles.title}>
              Sessions
            </ThemedText>
            <View style={[styles.attendanceSummary, { backgroundColor: theme.backgroundSecondary }]}>
              <Feather name="check-circle" size={16} color={theme.link} />
              <ThemedText type="small" style={{ marginLeft: Spacing.sm }}>
                {attendedCount}/{sessions.length} sessions confirmed
              </ThemedText>
            </View>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.link}
          />
        }
        scrollIndicatorInsets={{ bottom: insets.bottom }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    marginBottom: Spacing.md,
  },
  attendanceSummary: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
  },
  sessionCard: {
    marginBottom: Spacing.md,
  },
  sessionHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  sessionNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  sessionInfo: {
    flex: 1,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  statusBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  expandedContent: {
    marginTop: Spacing.lg,
  },
  divider: {
    height: 1,
    marginBottom: Spacing.lg,
  },
  overviewTitle: {
    marginBottom: Spacing.sm,
  },
  topicItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Spacing.sm,
    paddingLeft: Spacing.sm,
  },
  topicBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
    marginRight: Spacing.md,
  },
  actionContainer: {
    marginTop: Spacing.xl,
  },
  checkInButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  confirmedBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xs,
  },
  timeSection: {
    marginTop: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
  },
  timeSectionTitle: {
    marginBottom: Spacing.md,
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  timeItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  timeInfo: {
    marginLeft: Spacing.xs,
  },
  qrButtonsContainer: {
    alignItems: "center",
  },
  qrButton: {
    width: "100%",
  },
  qrHint: {
    marginTop: Spacing.sm,
    textAlign: "center",
  },
});
