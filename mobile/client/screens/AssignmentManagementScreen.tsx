import React, { useState, useCallback } from "react";
import { View, StyleSheet, FlatList, RefreshControl, Modal, TextInput, Pressable, Alert } from "react-native";
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
import { storage, Assignment, AssignmentSubmission, Program } from "@/lib/storage";

interface AssignmentWithStats extends Assignment {
  programName: string;
  submissionCount: number;
  confirmedCount: number;
}

export default function AssignmentManagementScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const [assignments, setAssignments] = useState<AssignmentWithStats[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const loadData = useCallback(async () => {
    const [allAssignments, submissions, programs] = await Promise.all([
      storage.getAssignments(),
      storage.getSubmissions(),
      storage.getPrograms(),
    ]);

    const assignmentsWithStats: AssignmentWithStats[] = allAssignments.map(assignment => {
      const assignmentSubmissions = submissions.filter(s => s.assignmentId === assignment.id);
      const confirmedSubmissions = assignmentSubmissions.filter(s => s.isConfirmed);
      const program = programs.find(p => p.id === assignment.programId);

      return {
        ...assignment,
        programName: program?.name || "Unknown Program",
        submissionCount: assignmentSubmissions.length,
        confirmedCount: confirmedSubmissions.length,
      };
    });

    setAssignments(
      assignmentsWithStats.sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())
    );
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

  const handleCreateAssignment = async () => {
    if (!newTitle.trim()) {
      Alert.alert("Error", "Please enter a title for the assignment");
      return;
    }

    setIsCreating(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const programs = await storage.getPrograms();
    const firstProgram = programs[0];

    if (!firstProgram) {
      Alert.alert("Error", "No programs available");
      setIsCreating(false);
      return;
    }

    const newAssignment: Assignment = {
      id: `assignment_${Date.now()}`,
      programId: firstProgram.id,
      sessionNumber: 1,
      title: newTitle.trim(),
      description: newDescription.trim() || undefined,
      dueDate: newDueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    await storage.createAssignment(newAssignment);
    await loadData();

    setIsCreating(false);
    setIsModalVisible(false);
    setNewTitle("");
    setNewDescription("");
    setNewDueDate("");
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const isPastDue = (dateString: string) => new Date(dateString) < new Date();

  const renderAssignment = ({ item, index }: { item: AssignmentWithStats; index: number }) => {
    const pastDue = isPastDue(item.dueDate);

    return (
      <Animated.View entering={FadeInUp.delay(index * 40).duration(400)}>
        <Card elevation={1} style={styles.assignmentCard}>
          <View style={styles.cardHeader}>
            <View
              style={[
                styles.assignmentIcon,
                { backgroundColor: pastDue ? theme.error + "20" : theme.link + "20" },
              ]}
            >
              <Feather
                name="file-text"
                size={24}
                color={pastDue ? theme.error : theme.link}
              />
            </View>
            <View style={styles.assignmentInfo}>
              <ThemedText type="h4">{item.title}</ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {item.programName}
              </ThemedText>
            </View>
          </View>

          {item.description ? (
            <ThemedText
              type="body"
              style={{ color: theme.textSecondary, marginTop: Spacing.md }}
              numberOfLines={2}
            >
              {item.description}
            </ThemedText>
          ) : null}

          <View style={[styles.statsRow, { borderTopColor: theme.border }]}>
            <View style={styles.statItem}>
              <Feather name="upload" size={16} color={theme.link} />
              <ThemedText type="body" style={{ marginLeft: Spacing.xs, fontWeight: "600" }}>
                {item.submissionCount}
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.xs }}>
                submitted
              </ThemedText>
            </View>
            <View style={styles.statItem}>
              <Feather name="check-circle" size={16} color={theme.success} />
              <ThemedText type="body" style={{ marginLeft: Spacing.xs, fontWeight: "600" }}>
                {item.confirmedCount}
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.xs }}>
                confirmed
              </ThemedText>
            </View>
          </View>

          <View style={[styles.dueDateRow, { backgroundColor: pastDue ? theme.error + "10" : theme.backgroundSecondary }]}>
            <Feather name="calendar" size={16} color={pastDue ? theme.error : theme.textSecondary} />
            <ThemedText
              type="body"
              style={{ marginLeft: Spacing.sm, color: pastDue ? theme.error : theme.text }}
            >
              Due: {formatDate(item.dueDate)}
            </ThemedText>
            {pastDue ? (
              <View style={[styles.pastDueBadge, { backgroundColor: theme.error }]}>
                <ThemedText type="small" style={{ color: "#FFFFFF", fontWeight: "600" }}>
                  Past Due
                </ThemedText>
              </View>
            ) : null}
          </View>
        </Card>
      </Animated.View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIcon, { backgroundColor: theme.backgroundSecondary }]}>
        <Feather name="file-plus" size={48} color={theme.textSecondary} />
      </View>
      <ThemedText type="h3" style={{ marginTop: Spacing.lg }}>
        No Assignments
      </ThemedText>
      <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "center", marginTop: Spacing.sm }}>
        Create your first assignment to get started
      </ThemedText>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={assignments}
        renderItem={renderAssignment}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: tabBarHeight + Spacing.xl + 60,
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
            progressViewOffset={headerHeight}
          />
        }
      />

      <View style={[styles.fabContainer, { bottom: tabBarHeight + Spacing.lg }]}>
        <Pressable
          style={[styles.fab, { backgroundColor: theme.link }]}
          onPress={() => setIsModalVisible(true)}
        >
          <Feather name="plus" size={24} color="#FFFFFF" />
        </Pressable>
      </View>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.backgroundRoot }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Pressable
              onPress={() => setIsModalVisible(false)}
              style={styles.closeButton}
            >
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
            <ThemedText type="h4">Create Assignment</ThemedText>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.modalContent}>
            <ThemedText type="h4" style={styles.inputLabel}>
              Title *
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.backgroundSecondary,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
              placeholder="Assignment title"
              placeholderTextColor={theme.textSecondary}
              value={newTitle}
              onChangeText={setNewTitle}
            />

            <ThemedText type="h4" style={styles.inputLabel}>
              Description
            </ThemedText>
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: theme.backgroundSecondary,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
              placeholder="Assignment description"
              placeholderTextColor={theme.textSecondary}
              value={newDescription}
              onChangeText={setNewDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <Button
              onPress={handleCreateAssignment}
              disabled={isCreating || !newTitle.trim()}
              style={styles.createButton}
            >
              {isCreating ? "Creating..." : "Create Assignment"}
            </Button>
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
  assignmentCard: {
    marginBottom: Spacing.lg,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  assignmentIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  assignmentInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  statsRow: {
    flexDirection: "row",
    paddingTop: Spacing.md,
    marginTop: Spacing.md,
    borderTopWidth: 1,
    gap: Spacing.xl,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  dueDateRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  pastDueBadge: {
    marginLeft: "auto",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
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
  fabContainer: {
    position: "absolute",
    right: Spacing.lg,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
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
  inputLabel: {
    marginBottom: Spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
    marginBottom: Spacing.lg,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
    minHeight: 100,
    marginBottom: Spacing.lg,
  },
  createButton: {
    marginTop: Spacing.md,
  },
});
