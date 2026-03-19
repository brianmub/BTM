import React, { useState, useCallback } from "react";
import { View, StyleSheet, FlatList, RefreshControl, Modal, TextInput, Pressable, Alert, ScrollView } from "react-native";
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
import { Button } from "@/components/Button";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { storage, User, PaymentRecord, Session, AttendanceRecord, PaymentStatus } from "@/lib/storage";

interface ParticipantPayment {
  user: User;
  attendance: AttendanceRecord | null;
  payment: PaymentRecord | null;
}

export default function PaymentRecordingScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { user } = useAuth();
  
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [participants, setParticipants] = useState<ParticipantPayment[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSessionPicker, setShowSessionPicker] = useState(false);
  const [showUnpaidModal, setShowUnpaidModal] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<ParticipantPayment | null>(null);
  const [unpaidReason, setUnpaidReason] = useState("");

  const loadSessions = useCallback(async () => {
    if (!user) return;
    
    const [cells, allSessions, programs] = await Promise.all([
      storage.getCellGroups(),
      storage.getSessions(),
      storage.getPrograms(),
    ]);

    const myCells = cells.filter(c => c.leaderId === user.id);
    const myProgramIds = new Set(myCells.map(c => c.programId));
    
    const relevantSessions = allSessions.filter(s => myProgramIds.has(s.programId));
    const sortedSessions = relevantSessions.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    setSessions(sortedSessions);
    
    if (sortedSessions.length > 0 && !selectedSession) {
      setSelectedSession(sortedSessions[0]);
    }
  }, [user, selectedSession]);

  const loadParticipants = useCallback(async () => {
    if (!user || !selectedSession) return;
    
    const [cells, allUsers, attendance, payments] = await Promise.all([
      storage.getCellGroups(),
      storage.getAllUsers(),
      storage.getSessionAttendance(selectedSession.id),
      storage.getSessionPayments(selectedSession.id),
    ]);

    const myCell = cells.find((c: { leaderId: string; programId: string }) => c.leaderId === user.id && c.programId === selectedSession.programId);
    if (!myCell) {
      setParticipants([]);
      return;
    }

    const cellMembers = await storage.getCellMembers(myCell.id);
    const memberIds = new Set(cellMembers.map((m: { id: string }) => m.id));
    const members = allUsers.filter((u: User) => memberIds.has(u.id));

    const participantList: ParticipantPayment[] = members.map((member: User) => ({
      user: member,
      attendance: attendance.find((a: AttendanceRecord) => a.userId === member.id) || null,
      payment: payments.find((p: PaymentRecord) => p.userId === member.id) || null,
    }));

    participantList.sort((a, b) => {
      const aPresent = a.attendance?.checkedIn ? 1 : 0;
      const bPresent = b.attendance?.checkedIn ? 1 : 0;
      if (aPresent !== bPresent) return bPresent - aPresent;
      
      const aPaid = a.payment?.status === 'paid' || a.payment?.status === 'waived' ? 1 : 0;
      const bPaid = b.payment?.status === 'paid' || b.payment?.status === 'waived' ? 1 : 0;
      if (aPaid !== bPaid) return aPaid - bPaid;
      
      return a.user.fullName.localeCompare(b.user.fullName);
    });

    setParticipants(participantList);
  }, [user, selectedSession]);

  useFocusEffect(
    useCallback(() => {
      loadSessions();
    }, [loadSessions])
  );

  useFocusEffect(
    useCallback(() => {
      loadParticipants();
    }, [loadParticipants])
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadSessions();
    await loadParticipants();
    setIsRefreshing(false);
  };

  const handleConfirmPaid = async (participant: ParticipantPayment) => {
    if (!user || !participant.payment) return;
    
    setIsProcessing(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    try {
      await storage.confirmPayment(participant.payment.id, user.id);
      await loadParticipants();
    } catch (error) {
      Alert.alert("Error", "Failed to confirm payment");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMarkUnpaid = (participant: ParticipantPayment) => {
    if (!participant.payment) return;
    setSelectedParticipant(participant);
    setUnpaidReason("");
    setShowUnpaidModal(true);
  };

  const handleConfirmUnpaid = async () => {
    if (!user || !selectedParticipant?.payment || !unpaidReason.trim()) {
      Alert.alert("Reason Required", "Please enter a reason for marking as unpaid");
      return;
    }
    
    setIsProcessing(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    
    try {
      await storage.markPaymentUnpaid(selectedParticipant.payment.id, unpaidReason.trim(), user.id);
      await loadParticipants();
      setShowUnpaidModal(false);
      setSelectedParticipant(null);
      setUnpaidReason("");
    } catch (error) {
      Alert.alert("Error", "Failed to mark payment as unpaid");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWaive = async (participant: ParticipantPayment) => {
    if (!user || !participant.payment) return;
    
    Alert.alert(
      "Waive Payment",
      `Waive payment for ${participant.user.fullName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Waive",
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            try {
              await storage.waivePayment(participant.payment!.id, user.id);
              await loadParticipants();
            } catch (error) {
              Alert.alert("Error", "Failed to waive payment");
            }
          },
        },
      ]
    );
  };

  const handleBulkConfirm = async () => {
    if (!user) return;
    
    const pendingPresentPayments = participants
      .filter(p => p.attendance?.checkedIn && p.payment?.status === 'pending')
      .map(p => p.payment!.id);
    
    if (pendingPresentPayments.length === 0) {
      Alert.alert("No Pending Payments", "All present participants have already been processed");
      return;
    }
    
    Alert.alert(
      "Confirm All Present",
      `Mark ${pendingPresentPayments.length} present participant(s) as PAID?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm All",
          onPress: async () => {
            setIsProcessing(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            try {
              await storage.bulkConfirmPayments(pendingPresentPayments, user.id);
              await loadParticipants();
            } catch (error) {
              Alert.alert("Error", "Failed to bulk confirm payments");
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status?: PaymentStatus): string => {
    switch (status) {
      case 'paid': return theme.success;
      case 'waived': return theme.link;
      case 'unpaid': return theme.error;
      default: return theme.warning;
    }
  };

  const getStatusLabel = (status?: PaymentStatus): string => {
    switch (status) {
      case 'paid': return 'PAID';
      case 'waived': return 'WAIVED';
      case 'unpaid': return 'UNPAID';
      default: return 'PENDING';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const presentCount = participants.filter(p => p.attendance?.checkedIn).length;
  const paidCount = participants.filter(p => p.payment?.status === 'paid' || p.payment?.status === 'waived').length;
  const pendingCount = participants.filter(p => p.payment?.status === 'pending').length;

  const renderParticipant = ({ item, index }: { item: ParticipantPayment; index: number }) => {
    const isPresent = item.attendance?.checkedIn;
    const status = item.payment?.status || 'pending';
    const statusColor = getStatusColor(status);
    const canConfirm = isPresent && status === 'pending';

    return (
      <Animated.View entering={FadeInUp.delay(index * 30).duration(300)}>
        <Card elevation={1} style={styles.participantCard}>
          <View style={styles.participantRow}>
            <View style={[styles.avatar, { backgroundColor: isPresent ? theme.success + "20" : theme.textSecondary + "20" }]}>
              <ThemedText type="h4" style={{ color: isPresent ? theme.success : theme.textSecondary }}>
                {item.user.fullName.charAt(0).toUpperCase()}
              </ThemedText>
            </View>
            
            <View style={styles.participantInfo}>
              <ThemedText type="body" style={{ fontWeight: "600" }}>
                {item.user.fullName}
              </ThemedText>
              <View style={styles.statusRow}>
                <View style={[styles.attendanceBadge, { backgroundColor: isPresent ? theme.success + "20" : theme.textSecondary + "20" }]}>
                  <Feather 
                    name={isPresent ? "check-circle" : "x-circle"} 
                    size={12} 
                    color={isPresent ? theme.success : theme.textSecondary} 
                  />
                  <ThemedText type="small" style={{ color: isPresent ? theme.success : theme.textSecondary, marginLeft: 4 }}>
                    {isPresent ? "PRESENT" : "ABSENT"}
                  </ThemedText>
                </View>
              </View>
            </View>

            <View style={[styles.paymentBadge, { backgroundColor: statusColor + "20" }]}>
              <ThemedText type="small" style={{ color: statusColor, fontWeight: "700" }}>
                {getStatusLabel(status)}
              </ThemedText>
            </View>
          </View>

          {isPresent && status === 'pending' ? (
            <View style={[styles.actionRow, { borderTopColor: theme.border }]}>
              <Pressable
                onPress={() => handleConfirmPaid(item)}
                disabled={isProcessing}
                style={[styles.actionButton, styles.paidButton, { backgroundColor: theme.success }]}
                testID={`btn-paid-${item.user.id}`}
              >
                <Feather name="check" size={16} color="#FFFFFF" />
                <ThemedText type="small" style={{ color: "#FFFFFF", marginLeft: 6, fontWeight: "700" }}>
                  PAID
                </ThemedText>
              </Pressable>
              
              <Pressable
                onPress={() => handleMarkUnpaid(item)}
                disabled={isProcessing}
                style={[styles.actionButton, { borderColor: theme.error, borderWidth: 1 }]}
              >
                <Feather name="x" size={16} color={theme.error} />
                <ThemedText type="small" style={{ color: theme.error, marginLeft: 6, fontWeight: "600" }}>
                  UNPAID
                </ThemedText>
              </Pressable>
              
              <Pressable
                onPress={() => handleWaive(item)}
                disabled={isProcessing}
                style={[styles.actionButton, { borderColor: theme.link, borderWidth: 1 }]}
              >
                <ThemedText type="small" style={{ color: theme.link, fontWeight: "600" }}>
                  WAIVE
                </ThemedText>
              </Pressable>
            </View>
          ) : null}

          {status === 'unpaid' && item.payment?.unpaidReason ? (
            <View style={[styles.reasonRow, { backgroundColor: theme.error + "10" }]}>
              <ThemedText type="small" style={{ color: theme.error }}>
                Reason: {item.payment.unpaidReason}
              </ThemedText>
            </View>
          ) : null}
        </Card>
      </Animated.View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIcon, { backgroundColor: theme.backgroundSecondary }]}>
        <Feather name="users" size={48} color={theme.textSecondary} />
      </View>
      <ThemedText type="h3" style={{ marginTop: Spacing.lg }}>
        No Participants
      </ThemedText>
      <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "center", marginTop: Spacing.sm }}>
        {selectedSession ? "No cell members found for this session" : "Select a session to view participants"}
      </ThemedText>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { marginTop: headerHeight }]}>
        <Pressable
          onPress={() => setShowSessionPicker(true)}
          style={[styles.sessionSelector, { borderColor: theme.border }]}
        >
          {selectedSession ? (
            <>
              <View>
                <ThemedText type="h4">{selectedSession.title}</ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  {formatDate(selectedSession.date)}
                </ThemedText>
              </View>
              <Feather name="chevron-down" size={20} color={theme.textSecondary} />
            </>
          ) : (
            <>
              <ThemedText type="body" style={{ color: theme.textSecondary }}>
                Select a session
              </ThemedText>
              <Feather name="chevron-down" size={20} color={theme.textSecondary} />
            </>
          )}
        </Pressable>

        {selectedSession && participants.length > 0 ? (
          <View style={[styles.summaryBar, { backgroundColor: theme.backgroundSecondary }]}>
            <View style={styles.summaryItem}>
              <ThemedText type="h4" style={{ color: theme.success }}>{presentCount}</ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>Present</ThemedText>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: theme.border }]} />
            <View style={styles.summaryItem}>
              <ThemedText type="h4" style={{ color: theme.success }}>{paidCount}</ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>Paid</ThemedText>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: theme.border }]} />
            <View style={styles.summaryItem}>
              <ThemedText type="h4" style={{ color: theme.warning }}>{pendingCount}</ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>Pending</ThemedText>
            </View>
          </View>
        ) : null}

        {selectedSession && pendingCount > 0 && presentCount > 0 ? (
          <Button
            onPress={handleBulkConfirm}
            disabled={isProcessing}
            style={styles.bulkButton}
          >
            Mark All Present as PAID
          </Button>
        ) : null}
      </View>

      <FlatList
        data={participants}
        renderItem={renderParticipant}
        keyExtractor={(item) => item.user.id}
        contentContainerStyle={{
          paddingTop: Spacing.md,
          paddingBottom: tabBarHeight + Spacing.xl,
          paddingHorizontal: Spacing.lg,
          flexGrow: 1,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.link}
          />
        }
      />

      <Modal
        visible={showSessionPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSessionPicker(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.backgroundRoot }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Pressable onPress={() => setShowSessionPicker(false)} style={styles.closeButton}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
            <ThemedText type="h4">Select Session</ThemedText>
            <View style={styles.placeholder} />
          </View>
          <ScrollView style={styles.modalContent}>
            {sessions.map((session) => (
              <Pressable
                key={session.id}
                onPress={() => {
                  setSelectedSession(session);
                  setShowSessionPicker(false);
                }}
                style={[
                  styles.sessionOption,
                  { 
                    borderColor: selectedSession?.id === session.id ? theme.primary : theme.border,
                    backgroundColor: selectedSession?.id === session.id ? theme.primary + "10" : "transparent",
                  }
                ]}
              >
                <View>
                  <ThemedText type="h4">{session.title}</ThemedText>
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>
                    {formatDate(session.date)}
                  </ThemedText>
                </View>
                {selectedSession?.id === session.id ? (
                  <Feather name="check-circle" size={20} color={theme.primary} />
                ) : null}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Modal>

      <Modal
        visible={showUnpaidModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowUnpaidModal(false)}
      >
        <View style={styles.unpaidOverlay}>
          <View style={[styles.unpaidModal, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText type="h4" style={{ marginBottom: Spacing.md }}>
              Mark as Unpaid
            </ThemedText>
            <ThemedText type="body" style={{ color: theme.textSecondary, marginBottom: Spacing.lg }}>
              {selectedParticipant?.user.fullName}
            </ThemedText>
            
            <ThemedText type="small" style={{ marginBottom: Spacing.xs, fontWeight: "600" }}>
              Reason (required)
            </ThemedText>
            <TextInput
              value={unpaidReason}
              onChangeText={setUnpaidReason}
              placeholder="Enter reason for non-payment"
              placeholderTextColor={theme.textSecondary}
              style={[styles.reasonInput, { borderColor: theme.border, color: theme.text }]}
              multiline
              testID="input-unpaid-reason"
            />
            
            <View style={styles.unpaidActions}>
              <Pressable
                onPress={() => setShowUnpaidModal(false)}
                style={[styles.cancelButton, { borderColor: theme.border }]}
              >
                <ThemedText type="body">Cancel</ThemedText>
              </Pressable>
              <Pressable
                onPress={handleConfirmUnpaid}
                disabled={isProcessing || !unpaidReason.trim()}
                style={[
                  styles.confirmUnpaidButton, 
                  { backgroundColor: unpaidReason.trim() ? theme.error : theme.textSecondary }
                ]}
              >
                <ThemedText type="body" style={{ color: "#FFFFFF", fontWeight: "600" }}>
                  {isProcessing ? "Processing..." : "Confirm Unpaid"}
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  sessionSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  summaryBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  summaryItem: {
    alignItems: "center",
    paddingHorizontal: Spacing.md,
  },
  summaryDivider: {
    width: 1,
    height: "100%",
  },
  bulkButton: {
    marginBottom: Spacing.sm,
  },
  participantCard: {
    marginBottom: Spacing.sm,
  },
  participantRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  participantInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  statusRow: {
    flexDirection: "row",
    marginTop: 4,
  },
  attendanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  paymentBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  actionRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    flex: 1,
  },
  paidButton: {
    flex: 2,
  },
  reasonRow: {
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
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
  modalContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  sessionOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  unpaidOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  unpaidModal: {
    width: "100%",
    maxWidth: 400,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
  },
  reasonInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    minHeight: 80,
    textAlignVertical: "top",
    fontSize: 16,
    marginBottom: Spacing.lg,
  },
  unpaidActions: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  cancelButton: {
    flex: 1,
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  confirmUnpaidButton: {
    flex: 1,
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
});
