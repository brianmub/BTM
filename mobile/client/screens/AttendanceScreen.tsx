import React, { useState, useEffect } from "react";
import { View, StyleSheet, FlatList, Pressable, Alert, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInUp, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { storage, Session, User, AttendanceRecord } from "@/lib/storage";

interface MemberAttendance {
  member: User;
  isPresent: boolean;
  isPaid: boolean;
  attendanceId?: string;
  paymentId?: string;
  entryTime?: string;
}

function Checkbox({
  checked,
  onToggle,
  color,
}: {
  checked: boolean;
  onToggle: () => void;
  color: string;
}) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSpring(0.9, { damping: 10, stiffness: 200 });
    setTimeout(() => {
      scale.value = withSpring(1, { damping: 10, stiffness: 200 });
    }, 100);
    Haptics.selectionAsync();
    onToggle();
  };

  return (
    <Pressable onPress={handlePress}>
      <Animated.View
        style={[
          styles.checkbox,
          animatedStyle,
          {
            backgroundColor: checked ? color : "transparent",
            borderColor: checked ? color : theme.border,
          },
        ]}
      >
        {checked ? <Feather name="check" size={16} color="#FFFFFF" /> : null}
      </Animated.View>
    </Pressable>
  );
}

export default function AttendanceScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [memberAttendance, setMemberAttendance] = useState<MemberAttendance[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [showSessionPicker, setShowSessionPicker] = useState(false);
  const [cellMembers, setCellMembers] = useState<User[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedSession && cellMembers.length > 0) {
      loadAttendanceForSession(selectedSession);
    }
  }, [selectedSession, cellMembers]);

  const loadData = async () => {
    const loadedSessions = await storage.getSessions();
    setSessions(loadedSessions);
    if (loadedSessions.length > 0) {
      setSelectedSession(loadedSessions[0]);
    }

    if (user?.role === "leader" || user?.role === "facilitator") {
      const allCells = await storage.getCellGroups();
      const leaderCell = allCells.find((c) => c.leaderId === user.id);
      if (leaderCell) {
        const members = await storage.getCellMembers(leaderCell.id);
        setCellMembers(members);
      } else {
        setCellMembers([]);
      }
    } else if (user?.cellId) {
      const members = await storage.getCellMembers(user.cellId);
      setCellMembers(members);
    } else {
      const allUsers = await storage.getAllUsers();
      const participants = allUsers.filter(u => u.role === 'participant');
      setCellMembers(participants);
    }
  };

  const loadAttendanceForSession = async (session: Session) => {
    const allAttendance = await storage.getAttendance();
    const sessionAttendance = allAttendance.filter(a => a.sessionId === session.id);
    
    const payments = await storage.getPayments();
    const sessionPayments = payments.filter(p => p.sessionId === session.id);

    const attendance: MemberAttendance[] = cellMembers.map((member) => {
      const memberAttendance = sessionAttendance.find(a => a.userId === member.id);
      const memberPayment = sessionPayments.find(p => p.userId === member.id);
      return {
        member,
        isPresent: memberAttendance?.confirmedByLeader || false,
        isPaid: memberPayment?.status === 'paid' || memberPayment?.status === 'waived' || false,
        attendanceId: memberAttendance?.id,
        paymentId: memberPayment?.id,
        entryTime: memberAttendance?.entryTime,
      };
    });
    setMemberAttendance(attendance);
    setHasChanges(false);
  };

  const toggleAttendance = (memberId: string) => {
    setMemberAttendance((prev) =>
      prev.map((ma) =>
        ma.member.id === memberId ? { ...ma, isPresent: !ma.isPresent } : ma
      )
    );
    setHasChanges(true);
  };

  const togglePayment = (memberId: string) => {
    setMemberAttendance((prev) =>
      prev.map((ma) =>
        ma.member.id === memberId ? { ...ma, isPaid: !ma.isPaid } : ma
      )
    );
    setHasChanges(true);
  };

  const handleShowQRCode = () => {
    if (!selectedSession) {
      Alert.alert("No Session Selected", "Please select a session first.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("QRDisplay", {
      type: "checkin",
      programId: selectedSession.programId,
      sessionId: selectedSession.id,
      sessionTitle: selectedSession.title,
    });
  };

  const handleSave = async () => {
    if (!selectedSession || !user) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    let confirmedCount = 0;
    let paidCount = 0;

    for (const ma of memberAttendance) {
      if (ma.isPresent && ma.attendanceId) {
        await storage.confirmAttendance(ma.attendanceId, user.id);
        confirmedCount++;
      }
      
      if (ma.isPaid && ma.paymentId) {
        await storage.confirmPayment(ma.paymentId, user.id);
        paidCount++;
      }
    }

    setHasChanges(false);
    Alert.alert(
      "Success", 
      `Confirmed ${confirmedCount} attendance records and ${paidCount} payments!`
    );
  };

  const presentCount = memberAttendance.filter((ma) => ma.isPresent).length;
  const paidCount = memberAttendance.filter((ma) => ma.isPaid).length;

  const renderMember = ({ item, index }: { item: MemberAttendance; index: number }) => (
    <Animated.View entering={FadeInUp.delay(100 + index * 30).duration(400)}>
      <View style={[styles.memberRow, { borderBottomColor: theme.border }]}>
        <Image
          source={require("../../assets/images/avatar-default.png")}
          style={styles.avatar}
        />
        <View style={styles.memberInfo}>
          <ThemedText type="body" style={{ fontWeight: "500" }}>
            {item.member.fullName}
          </ThemedText>
          {item.entryTime && item.entryTime.startsWith('20') && (
            <View style={styles.arrivalBadge}>
              <Feather name="clock" size={10} color={theme.textSecondary} />
              <ThemedText style={[styles.arrivalText, { color: theme.textSecondary }]}>
                {new Date(item.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </ThemedText>
            </View>
          )}
        </View>
        <View style={styles.checkboxContainer}>
          <View style={styles.checkboxColumn}>
            <Checkbox
              checked={item.isPresent}
              onToggle={() => toggleAttendance(item.member.id)}
              color={theme.success}
            />
          </View>
          <View style={styles.checkboxColumn}>
            <Checkbox
              checked={item.isPaid}
              onToggle={() => togglePayment(item.member.id)}
              color={theme.accent}
            />
          </View>
        </View>
      </View>
    </Animated.View>
  );

  const renderHeader = () => (
    <View style={styles.listHeader}>
      <Pressable
        onPress={() => setShowSessionPicker(!showSessionPicker)}
        style={[styles.sessionSelector, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}
      >
        <ThemedText type="body" style={{ fontWeight: "500" }}>
          {selectedSession?.title || "Select Session"}
        </ThemedText>
        <Feather name="chevron-down" size={20} color={theme.textSecondary} />
      </Pressable>

      {showSessionPicker ? (
        <View style={[styles.sessionDropdown, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
          {sessions.map((session) => (
            <Pressable
              key={session.id}
              onPress={() => {
                setSelectedSession(session);
                setShowSessionPicker(false);
              }}
              style={[
                styles.sessionOption,
                { borderBottomColor: theme.border },
                session.id === selectedSession?.id && { backgroundColor: theme.backgroundSecondary },
              ]}
            >
              <ThemedText type="body">{session.title}</ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Session {session.sessionNumber}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      ) : null}

      <Pressable
        onPress={handleShowQRCode}
        style={[styles.qrButton, { backgroundColor: theme.primary }]}
      >
        <Feather name="maximize" size={20} color="#FFFFFF" />
        <ThemedText style={styles.qrButtonText}>
          Show QR Code for Check-In
        </ThemedText>
      </Pressable>

      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <View style={[styles.summaryDot, { backgroundColor: theme.success }]} />
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Present: {presentCount}/{memberAttendance.length}
          </ThemedText>
        </View>
        <View style={styles.summaryItem}>
          <View style={[styles.summaryDot, { backgroundColor: theme.accent }]} />
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Paid: {paidCount}/{memberAttendance.length}
          </ThemedText>
        </View>
      </View>

      <View style={[styles.columnHeaders, { borderBottomColor: theme.border }]}>
        <ThemedText type="small" style={[styles.memberHeader, { color: theme.textSecondary }]}>
          Member / Arrival
        </ThemedText>
        <View style={styles.checkboxHeaders}>
          <ThemedText type="small" style={[styles.columnHeader, { color: theme.success }]}>
            Verified
          </ThemedText>
          <ThemedText type="small" style={[styles.columnHeader, { color: theme.accent }]}>
            Paid
          </ThemedText>
        </View>
      </View>

      <Button 
        variant="secondary" 
        style={styles.bulkVerifyButton}
        onPress={() => {
          setMemberAttendance(prev => prev.map(ma => ma.entryTime ? { ...ma, isPresent: true } : ma));
          setHasChanges(true);
        }}
      >
        <Feather name="check" size={16} /> Verify All Checked-in
      </Button>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Feather name="users" size={48} color={theme.textSecondary} />
      <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
        No members found
      </ThemedText>
      <ThemedText style={[styles.emptySubtext, { color: theme.textSecondary }]}>
        Cell members will appear here once assigned
      </ThemedText>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={memberAttendance}
        renderItem={renderMember}
        keyExtractor={(item) => item.member.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: tabBarHeight + Spacing["6xl"] + Spacing.xl,
          paddingHorizontal: Spacing.lg,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
      />

      {hasChanges ? (
        <View
          style={[
            styles.floatingButton,
            { bottom: tabBarHeight + Spacing.xl },
          ]}
        >
          <Button onPress={handleSave} style={styles.saveButton}>
            Save Attendance
          </Button>
        </View>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listHeader: {
    marginBottom: Spacing.lg,
  },
  sessionSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  sessionDropdown: {
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    marginBottom: Spacing.lg,
    overflow: "hidden",
  },
  sessionOption: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  qrButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.xs,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  qrButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  summaryRow: {
    flexDirection: "row",
    gap: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  summaryItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  summaryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.sm,
  },
  columnHeaders: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  memberHeader: {
    flex: 1,
    fontWeight: "600",
  },
  checkboxHeaders: {
    flexDirection: "row",
    width: 120,
  },
  columnHeader: {
    width: 60,
    textAlign: "center",
    fontWeight: "600",
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: Spacing.md,
  },
  memberInfo: {
    flex: 1,
  },
  checkboxContainer: {
    flexDirection: "row",
    width: 120,
  },
  checkboxColumn: {
    width: 60,
    alignItems: "center",
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  floatingButton: {
    position: "absolute",
    left: Spacing.lg,
    right: Spacing.lg,
  },
  saveButton: {
    width: "100%",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: Spacing["4xl"],
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: Spacing.lg,
  },
  emptySubtext: {
    marginTop: Spacing.sm,
    textAlign: "center",
  },
  arrivalBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  arrivalText: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  bulkVerifyButton: {
    height: 36,
    marginTop: Spacing.md,
    borderRadius: BorderRadius.xs,
  }
});
