import React, { useState, useCallback } from "react";
import { View, StyleSheet, FlatList, RefreshControl, Alert, Modal, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
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
import { storage, Program, CellGroup, User, Enrollment } from "@/lib/storage";

interface ProgramCellInfo {
  program: Program;
  cells: CellGroup[];
  enrolledCount: number;
  canCreateCells: boolean;
  approvedLeadersCount: number;
}

interface CellMemberInfo {
  user: User;
  cellId?: string;
  cellName?: string;
}

export default function CellManagementScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const { user } = useAuth();
  const [programInfo, setProgramInfo] = useState<ProgramCellInfo[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState<string | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<ProgramCellInfo | null>(null);
  const [cellMembers, setCellMembers] = useState<CellMemberInfo[]>([]);
  const [selectedMember, setSelectedMember] = useState<CellMemberInfo | null>(null);
  const [reassigning, setReassigning] = useState(false);

  const calculateAge = (dob: string | undefined) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const loadData = async () => {
    const [programs, cells, enrollments, users] = await Promise.all([
      storage.getPrograms(),
      storage.getCellGroups(),
      storage.getEnrollments(),
      storage.getAllUsers(),
    ]);

    const approvedLeaders = users.filter(u => u.role === "leader" && u.leaderStatus === "approved");

    const info: ProgramCellInfo[] = programs
      .filter(p => p.isActive)
      .map(program => {
        const programCells = cells.filter(c => c.programId === program.id);
        const programEnrollments = enrollments.filter(e => e.programId === program.id);
        const enrolledOnly = programEnrollments.filter(e => e.status === "enrolled");
        
        const now = new Date();
        const enrollmentEnd = new Date(program.enrollmentEndDate);
        const enrollmentClosed = now > enrollmentEnd;
        
        const canCreateCells = enrollmentClosed && programCells.length === 0 && enrolledOnly.length > 0 && approvedLeaders.length > 0;

        return {
          program,
          cells: programCells,
          enrolledCount: programEnrollments.length,
          canCreateCells,
          approvedLeadersCount: approvedLeaders.length,
        };
      });

    setProgramInfo(info);
  };

  const loadCellMembers = async (programCellInfo: ProgramCellInfo) => {
    const members: CellMemberInfo[] = [];
    const users = await storage.getAllUsers();
    
    for (const cell of programCellInfo.cells) {
      const cellMembersList = await storage.getCellMembers(cell.id);
      for (const member of cellMembersList) {
        const memberUser = users.find(u => u.id === member.id);
        if (memberUser) {
          members.push({
            user: memberUser,
            cellId: cell.id,
            cellName: cell.name,
          });
        }
      }
    }

    try {
      const unassigned = await storage.getUnassignedParticipants(programCellInfo.program.id);
      for (const user of unassigned) {
        members.push({
          user: user,
          cellId: "unassigned",
          cellName: "Not Assigned",
        });
      }
    } catch (err) {
      console.log("Could not load unassigned", err);
    }
    
    setCellMembers(members);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCreateCells = async (programId: string) => {
    setCreating(programId);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    try {
      const cells = await storage.createCellsForProgram(programId, user?.id || "system");
      await loadData();
      
      if (cells.length > 0) {
        Alert.alert(
          "Cells Created",
          `Successfully created ${cells.length} cell(s) with balanced distribution of participants.`
        );
      } else {
        Alert.alert("Error", "Could not create cells. Ensure you have approved leaders and enrolled participants.");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to create cells. Please try again.");
    } finally {
      setCreating(null);
    }
  };

  const handleManageCells = async (programCellInfo: ProgramCellInfo) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedProgram(programCellInfo);
    await loadCellMembers(programCellInfo);
  };

  const handleReassignMember = async (member: CellMemberInfo, targetCellId: string) => {
    if (member.cellId === targetCellId) return;
    
    setReassigning(true);
    try {
      await storage.reassignCellMember(
        member.user.id,
        member.cellId || "unassigned",
        targetCellId,
        user?.id || "system"
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      if (selectedProgram) {
        await loadCellMembers(selectedProgram);
      }
      setSelectedMember(null);
      Alert.alert("Success", `${member.user.fullName} has been reassigned.`);
    } catch (error) {
      Alert.alert("Error", "Failed to reassign member. Please try again.");
    } finally {
      setReassigning(false);
    }
  };

  const renderProgram = ({ item, index }: { item: ProgramCellInfo; index: number }) => {
    const { program, cells, enrolledCount, canCreateCells, approvedLeadersCount } = item;
    const now = new Date();
    const enrollmentEnd = new Date(program.enrollmentEndDate);
    const enrollmentClosed = now > enrollmentEnd;

    return (
      <Animated.View entering={FadeInUp.delay(100 + index * 100).duration(400)}>
        <Card elevation={1} style={styles.programCard}>
          <View style={styles.programHeader}>
            <ThemedText type="h3">{program.name}</ThemedText>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: enrollmentClosed ? theme.textSecondary + "20" : theme.success + "20" },
              ]}
            >
              <ThemedText
                type="small"
                style={{
                  color: enrollmentClosed ? theme.textSecondary : theme.success,
                  fontWeight: "600",
                }}
              >
                {enrollmentClosed ? "Enrollment Closed" : "Enrollment Open"}
              </ThemedText>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Feather name="users" size={16} color={theme.textSecondary} />
              <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.xs }}>
                {enrolledCount} enrolled
              </ThemedText>
            </View>
            <View style={styles.statItem}>
              <Feather name="user-check" size={16} color={theme.textSecondary} />
              <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.xs }}>
                {approvedLeadersCount} leaders
              </ThemedText>
            </View>
            <View style={styles.statItem}>
              <Feather name="layers" size={16} color={theme.textSecondary} />
              <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.xs }}>
                {cells.length} cells
              </ThemedText>
            </View>
          </View>

          {cells.length > 0 ? (
            <View style={styles.cellsList}>
              <View style={styles.cellsHeader}>
                <ThemedText type="h4">Active Cells</ThemedText>
                <Pressable onPress={() => handleManageCells(item)}>
                  <View style={[styles.manageButton, { backgroundColor: theme.link + "20" }]}>
                    <Feather name="edit-2" size={14} color={theme.link} />
                    <ThemedText type="small" style={{ color: theme.link, marginLeft: Spacing.xs, fontWeight: "600" }}>
                      Manage
                    </ThemedText>
                  </View>
                </Pressable>
              </View>
              {cells.map(cell => (
                <View key={cell.id} style={[styles.cellItem, { backgroundColor: theme.backgroundSecondary }]}>
                  <View style={[styles.cellIcon, { backgroundColor: theme.link + "20" }]}>
                    <Feather name="users" size={16} color={theme.link} />
                  </View>
                  <View style={styles.cellInfo}>
                    <ThemedText type="body" style={{ fontWeight: "600" }}>
                      {cell.name}
                    </ThemedText>
                    <ThemedText type="small" style={{ color: theme.textSecondary }}>
                      {cell.memberIds.length} members
                    </ThemedText>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.noCells}>
              {canCreateCells ? (
                <>
                  <ThemedText type="body" style={{ color: theme.textSecondary, marginBottom: Spacing.lg, textAlign: "center" }}>
                    Enrollment is closed. You can now create balanced cells for this program.
                  </ThemedText>
                  <Button
                    onPress={() => handleCreateCells(program.id)}
                    disabled={creating === program.id}
                  >
                    {creating === program.id ? "Creating..." : "Create Cells"}
                  </Button>
                </>
              ) : (
                <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "center" }}>
                  {!enrollmentClosed
                    ? "Cells will be created after enrollment closes."
                    : enrolledCount === 0
                    ? "No participants enrolled in this program."
                    : approvedLeadersCount === 0
                    ? "Approve cell leaders before creating cells."
                    : "Cells have not been created yet."}
                </ThemedText>
              )}
            </View>
          )}
        </Card>
      </Animated.View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={programInfo}
        keyExtractor={item => item.program.id}
        renderItem={renderProgram}
        contentContainerStyle={[
          styles.content,
          { paddingTop: headerHeight + Spacing.lg, paddingBottom: insets.bottom + 100 },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.link} />
        }
        ListEmptyComponent={
          <Card elevation={1} style={styles.emptyCard}>
            <Feather name="inbox" size={32} color={theme.textSecondary} />
            <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.sm }}>
              No programs available
            </ThemedText>
          </Card>
        }
      />

      <Modal
        visible={selectedProgram !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedProgram(null)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.backgroundRoot }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Pressable onPress={() => setSelectedProgram(null)} style={styles.closeButton}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
            <ThemedText type="h4">Manage Cell Members</ThemedText>
            <View style={styles.placeholder} />
          </View>

          <ScrollView style={styles.modalContent}>
            <ThemedText type="body" style={{ color: theme.textSecondary, marginBottom: Spacing.lg }}>
              Tap on a member to reassign them to a different cell.
            </ThemedText>

            {[{ id: "unassigned", name: "Not Assigned" }, ...(selectedProgram?.cells || [])].map(cell => (
              <View key={cell.id} style={styles.cellSection}>
                <View style={[styles.cellSectionHeader, { backgroundColor: theme.link + "10" }]}>
                  <Feather name="users" size={16} color={theme.link} />
                  <ThemedText type="h4" style={{ marginLeft: Spacing.sm, color: theme.link }}>
                    {cell.name}
                  </ThemedText>
                </View>
                {cellMembers.filter(m => m.cellId === cell.id).map(member => (
                  <Pressable
                    key={member.user.id}
                    onPress={() => setSelectedMember(member)}
                    style={[styles.memberRow, { borderBottomColor: theme.border }]}
                  >
                    <View style={[styles.memberAvatar, { backgroundColor: theme.backgroundSecondary }]}>
                      <ThemedText type="body" style={{ fontWeight: "600" }}>
                        {member.user.fullName.charAt(0).toUpperCase()}
                      </ThemedText>
                    </View>
                    <View style={styles.memberInfo}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <ThemedText type="body">{member.user.fullName}</ThemedText>
                        <ThemedText type="small" style={{ color: theme.link, fontWeight: '700', marginLeft: Spacing.sm }}>
                            {calculateAge(member.user.dob) ? `${calculateAge(member.user.dob)}Y` : ''} 
                            {member.user.gender ? ` | ${member.user.gender.toUpperCase()}` : ''}
                        </ThemedText>
                      </View>
                      <ThemedText type="small" style={{ color: theme.textSecondary }}>
                        {member.user.email}
                      </ThemedText>
                    </View>
                    <Feather name="more-vertical" size={18} color={theme.textSecondary} />
                  </Pressable>
                ))}
                {cellMembers.filter(m => m.cellId === cell.id).length === 0 ? (
                  <ThemedText type="small" style={{ color: theme.textSecondary, padding: Spacing.md, textAlign: "center" }}>
                    No members in this cell
                  </ThemedText>
                ) : null}
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>

      <Modal
        visible={selectedMember !== null}
        animationType="fade"
        transparent
        onRequestClose={() => setSelectedMember(null)}
      >
        <View style={styles.reassignOverlay}>
          <View style={[styles.reassignModal, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText type="h4" style={{ marginBottom: Spacing.md }}>
              Reassign {selectedMember?.user.fullName}
            </ThemedText>
            <ThemedText type="body" style={{ color: theme.textSecondary, marginBottom: Spacing.lg }}>
              Current cell: {selectedMember?.cellName}
            </ThemedText>
            <ThemedText type="h4" style={{ marginBottom: Spacing.md }}>
              Move to:
            </ThemedText>
            {selectedProgram?.cells
              .filter(c => c.id !== selectedMember?.cellId)
              .map(cell => (
                <Pressable
                  key={cell.id}
                  onPress={() => selectedMember && handleReassignMember(selectedMember, cell.id)}
                  disabled={reassigning}
                  style={[styles.reassignOption, { backgroundColor: theme.backgroundSecondary }]}
                >
                  <Feather name="users" size={18} color={theme.link} />
                  <ThemedText type="body" style={{ marginLeft: Spacing.md }}>
                    {cell.name}
                  </ThemedText>
                </Pressable>
              ))}
            <Pressable
              onPress={() => setSelectedMember(null)}
              style={[styles.cancelButton, { borderColor: theme.border }]}
            >
              <ThemedText type="body" style={{ color: theme.textSecondary }}>
                Cancel
              </ThemedText>
            </Pressable>
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
  content: {
    paddingHorizontal: Spacing.xl,
  },
  programCard: {
    marginBottom: Spacing.lg,
  },
  programHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.xl,
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  cellsList: {
    marginTop: Spacing.md,
  },
  cellsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  manageButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  cellItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  cellIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  cellInfo: {
    flex: 1,
  },
  noCells: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
  },
  emptyCard: {
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  placeholder: {
    width: 32,
  },
  modalContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  cellSection: {
    marginBottom: Spacing.xl,
  },
  cellSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderBottomWidth: 1,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  memberInfo: {
    flex: 1,
  },
  reassignOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  reassignModal: {
    width: "100%",
    maxWidth: 400,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
  },
  reassignOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  cancelButton: {
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginTop: Spacing.md,
  },
});
