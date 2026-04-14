import React, { useState, useCallback } from "react";
import { View, StyleSheet, FlatList, RefreshControl, Alert, Modal, Pressable, TextInput, ScrollView, Text } from "react-native";
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
import { storage, Program, Session } from "@/lib/storage";

export default function ProgramManagementScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [showProgramModal, setShowProgramModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);

  const [enrollmentStartStr, setEnrollmentStartStr] = useState("");
  const [enrollmentEndStr, setEnrollmentEndStr] = useState("");
  const [programStartStr, setProgramStartStr] = useState("");

  const [newSessionTitle, setNewSessionTitle] = useState("");
  const [newSessionDateStr, setNewSessionDateStr] = useState("");
  const [newSessionOverview, setNewSessionOverview] = useState("");
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    const [programsData, sessionsData] = await Promise.all([
      storage.getPrograms(),
      storage.getSessions(),
    ]);
    setPrograms(programsData);
    setSessions(sessionsData);
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

  const formatDateForInput = (dateString: string): string => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleEditProgram = (program: Program) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingProgram(program);
    setEnrollmentStartStr(formatDateForInput(program.enrollmentStartDate));
    setEnrollmentEndStr(formatDateForInput(program.enrollmentEndDate));
    setProgramStartStr(formatDateForInput(program.programStartDate));
    setShowProgramModal(true);
  };

  const isValidDateFormat = (dateStr: string): boolean => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateStr)) return false;
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
  };

  const handleSaveProgram = async () => {
    if (!editingProgram) return;

    if (!isValidDateFormat(enrollmentStartStr) || !isValidDateFormat(enrollmentEndStr) || !isValidDateFormat(programStartStr)) {
      Alert.alert("Invalid Date", "Please enter dates in YYYY-MM-DD format (e.g., 2026-03-15)");
      return;
    }

    setSaving(true);
    try {
      await storage.updateProgram(editingProgram.id, {
        enrollmentStartDate: enrollmentStartStr,
        enrollmentEndDate: enrollmentEndStr,
        programStartDate: programStartStr,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowProgramModal(false);
      setEditingProgram(null);
      await loadData();
      Alert.alert("Success", "Program enrollment dates updated.");
    } catch (error) {
      Alert.alert("Error", "Failed to update program. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddSession = (programId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedProgramId(programId);
    const programSessions = sessions.filter(s => s.programId === programId);
    const nextNumber = programSessions.length + 1;
    setNewSessionTitle(`Session ${nextNumber}`);
    const today = new Date();
    setNewSessionDateStr(formatDateForInput(today.toISOString()));
    setNewSessionOverview("");
    setShowSessionModal(true);
  };

  const handleSaveSession = async () => {
    if (!selectedProgramId || !newSessionTitle.trim()) return;

    if (!isValidDateFormat(newSessionDateStr)) {
      Alert.alert("Invalid Date", "Please enter a date in YYYY-MM-DD format (e.g., 2026-03-15)");
      return;
    }

    setSaving(true);
    try {
      const programSessions = sessions.filter(s => s.programId === selectedProgramId);
      const nextNumber = programSessions.length + 1;

      await storage.createSession({
        programId: selectedProgramId,
        sessionNumber: nextNumber,
        title: newSessionTitle.trim(),
        date: newSessionDateStr,
        overview: newSessionOverview.trim(),
        topics: [],
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowSessionModal(false);
      setSelectedProgramId(null);
      await loadData();
      Alert.alert("Success", "New session created.");
    } catch (error) {
      Alert.alert("Error", "Failed to create session. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const renderProgram = ({ item, index }: { item: Program; index: number }) => {
    const programSessions = sessions.filter(s => s.programId === item.id);
    const now = new Date();
    const enrollmentEnd = new Date(item.enrollmentEndDate);
    const isEnrollmentOpen = now <= enrollmentEnd;

    return (
      <Animated.View entering={FadeInUp.delay(100 + index * 100).duration(400)}>
        <Card elevation={1} style={styles.programCard}>
          <View style={styles.programHeader}>
            <View style={styles.programTitleRow}>
              <ThemedText type="h3">{item.name}</ThemedText>
              <Pressable onPress={() => handleEditProgram(item)} testID={`edit-program-${item.id}`}>
                <View style={[styles.editButton, { backgroundColor: theme.link + "20" }]}>
                  <Feather name="edit-2" size={14} color={theme.link} />
                </View>
              </Pressable>
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: isEnrollmentOpen ? theme.success + "20" : theme.textSecondary + "20" },
              ]}
            >
              <ThemedText
                type="small"
                style={{
                  color: isEnrollmentOpen ? theme.success : theme.textSecondary,
                  fontWeight: "600",
                }}
              >
                {isEnrollmentOpen ? "Enrollment Open" : "Enrollment Closed"}
              </ThemedText>
            </View>
          </View>

          <View style={styles.dateSection}>
            <View style={styles.dateRow}>
              <Feather name="calendar" size={14} color={theme.textSecondary} />
              <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.xs }}>
                Enrollment: {formatDate(item.enrollmentStartDate)} - {formatDate(item.enrollmentEndDate)}
              </ThemedText>
            </View>
            <View style={styles.dateRow}>
              <Feather name="play-circle" size={14} color={theme.textSecondary} />
              <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.xs }}>
                Program starts: {formatDate(item.programStartDate)}
              </ThemedText>
            </View>
          </View>

          <View style={[styles.sessionsSection, { borderTopColor: theme.border }]}>
            <View style={styles.sessionsHeader}>
              <ThemedText type="h4">Sessions ({programSessions.length})</ThemedText>
              <Pressable onPress={() => handleAddSession(item.id)} testID={`add-session-${item.id}`}>
                <View style={[styles.addButton, { backgroundColor: theme.success + "20" }]}>
                  <Feather name="plus" size={14} color={theme.success} />
                  <ThemedText type="small" style={{ color: theme.success, marginLeft: Spacing.xs, fontWeight: "600" }}>
                    Add
                  </ThemedText>
                </View>
              </Pressable>
            </View>
            {programSessions.slice(0, 3).map((session, idx) => (
              <View key={session.id} style={[styles.sessionRow, { backgroundColor: theme.backgroundSecondary }]}>
                <View style={[styles.sessionNumber, { backgroundColor: "#B10F2D", zIndex: 10 }]}>
                  <Text 
                    style={{ 
                      color: "#FFFFFF", 
                      fontSize: 18, 
                      fontWeight: "900",
                      textAlign: "center"
                    }}
                  >
                    {String(session.sessionNumber || (idx + 1))}
                  </Text>
                </View>
                <View style={styles.sessionInfo}>
                  <ThemedText type="body" style={{ fontWeight: "500" }}>
                    {session.title}
                  </ThemedText>
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>
                    {formatDate(session.date)}
                  </ThemedText>
                </View>
              </View>
            ))}
            {programSessions.length > 3 ? (
              <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: "center", marginTop: Spacing.sm }}>
                +{programSessions.length - 3} more sessions
              </ThemedText>
            ) : null}
          </View>
        </Card>
      </Animated.View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={programs}
        keyExtractor={item => item.id}
        renderItem={renderProgram}
        contentContainerStyle={[
          styles.content,
          { paddingTop: headerHeight + Spacing.lg, paddingBottom: insets.bottom + 100 },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.link} />
        }
        ListHeaderComponent={
          <Animated.View entering={FadeInUp.delay(50).duration(400)}>
            <ThemedText type="h2" style={styles.title}>Program Management</ThemedText>
            <ThemedText type="body" style={{ color: theme.textSecondary, marginBottom: Spacing.xl }}>
              Manage enrollment periods and sessions
            </ThemedText>
          </Animated.View>
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
        visible={showProgramModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowProgramModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.backgroundRoot }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Pressable onPress={() => setShowProgramModal(false)} style={styles.closeButton} testID="close-program-modal">
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
            <ThemedText type="h4">Edit Enrollment Period</ThemedText>
            <View style={styles.placeholder} />
          </View>

          <ScrollView style={styles.modalContent}>
            <ThemedText type="h4" style={styles.fieldLabel}>Program</ThemedText>
            <ThemedText type="body" style={{ marginBottom: Spacing.xl }}>
              {editingProgram?.name}
            </ThemedText>

            <ThemedText type="h4" style={styles.fieldLabel}>Enrollment Start Date</ThemedText>
            <TextInput
              value={enrollmentStartStr}
              onChangeText={setEnrollmentStartStr}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.textSecondary}
              style={[styles.textInput, { borderColor: theme.border, color: theme.text }]}
              testID="input-enrollment-start"
            />

            <ThemedText type="h4" style={styles.fieldLabel}>Enrollment End Date</ThemedText>
            <TextInput
              value={enrollmentEndStr}
              onChangeText={setEnrollmentEndStr}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.textSecondary}
              style={[styles.textInput, { borderColor: theme.border, color: theme.text }]}
              testID="input-enrollment-end"
            />

            <ThemedText type="h4" style={styles.fieldLabel}>Program Start Date</ThemedText>
            <TextInput
              value={programStartStr}
              onChangeText={setProgramStartStr}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.textSecondary}
              style={[styles.textInput, { borderColor: theme.border, color: theme.text }]}
              testID="input-program-start"
            />

            <Button
              onPress={handleSaveProgram}
              disabled={saving}
              style={{ marginTop: Spacing.xl }}
              testID="save-program-button"
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </ScrollView>
        </View>
      </Modal>

      <Modal
        visible={showSessionModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSessionModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.backgroundRoot }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Pressable onPress={() => setShowSessionModal(false)} style={styles.closeButton} testID="close-session-modal">
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
            <ThemedText type="h4">Add New Session</ThemedText>
            <View style={styles.placeholder} />
          </View>

          <ScrollView style={styles.modalContent}>
            <ThemedText type="h4" style={styles.fieldLabel}>Session Title</ThemedText>
            <TextInput
              value={newSessionTitle}
              onChangeText={setNewSessionTitle}
              placeholder="Enter session title"
              placeholderTextColor={theme.textSecondary}
              style={[styles.textInput, { borderColor: theme.border, color: theme.text }]}
              testID="input-session-title"
            />

            <ThemedText type="h4" style={styles.fieldLabel}>Session Date</ThemedText>
            <TextInput
              value={newSessionDateStr}
              onChangeText={setNewSessionDateStr}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.textSecondary}
              style={[styles.textInput, { borderColor: theme.border, color: theme.text }]}
              testID="input-session-date"
            />

            <ThemedText type="h4" style={styles.fieldLabel}>Overview (Optional)</ThemedText>
            <TextInput
              value={newSessionOverview}
              onChangeText={setNewSessionOverview}
              placeholder="Brief description of the session"
              placeholderTextColor={theme.textSecondary}
              multiline
              numberOfLines={4}
              style={[styles.textInput, styles.textArea, { borderColor: theme.border, color: theme.text }]}
              testID="input-session-overview"
            />

            <Button
              onPress={handleSaveSession}
              disabled={saving || !newSessionTitle.trim()}
              style={{ marginTop: Spacing.xl }}
              testID="create-session-button"
            >
              {saving ? "Creating..." : "Create Session"}
            </Button>
          </ScrollView>
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
  title: {
    marginBottom: Spacing.xs,
  },
  programCard: {
    marginBottom: Spacing.lg,
  },
  programHeader: {
    marginBottom: Spacing.lg,
  },
  programTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  dateSection: {
    marginBottom: Spacing.lg,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  sessionsSection: {
    borderTopWidth: 1,
    paddingTop: Spacing.lg,
  },
  sessionsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  sessionRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
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
    padding: Spacing.xl,
  },
  fieldLabel: {
    marginBottom: Spacing.sm,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
});
