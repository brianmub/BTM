import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, FlatList, RefreshControl, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
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
import { storage, Program, Enrollment } from "@/lib/storage";

type FilterType = "all" | "enrolled" | "available";

export default function ProgramCatalogScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { user } = useAuth();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [enrollingProgramId, setEnrollingProgramId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    // Matches the Home Screen logic exactly
    const orgId = user?.organizationId;
    if (!user?.id || !orgId) return;

    try {
      const [loadedPrograms, loadedEnrollments] = await Promise.all([
        storage.getPrograms(orgId),
        storage.getEnrollments(orgId),
      ]);
      setPrograms(loadedPrograms.filter(p => p.isActive));
      const userEnrollments = loadedEnrollments.filter(e => e.userId === user.id);
      setEnrollments(userEnrollments);
    } catch (err) {
      console.error("Catalog load error:", err);
    }
  }, [user?.id, user?.organizationId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadData();
    setIsRefreshing(false);
  };

  const isEnrolled = (programId: string): boolean => {
    return enrollments.some(e => (e.programId === programId || (e as any).program_id === programId));
  };

  const isEnrollmentOpen = (program: Program): boolean => {
    // If dates are missing, default to open if the program is active
    if (!program.enrollmentStartDate || !program.enrollmentEndDate) {
      return program.isActive;
    }

    const now = new Date();
    const start = new Date(program.enrollmentStartDate);
    const end = new Date(program.enrollmentEndDate);

    // Check if dates are valid
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return program.isActive;
    }

    return now >= start && now <= end;
  };

  const getEnrollmentStatus = (program: Program): { text: string; color: string } => {
    if (isEnrolled(program.id)) {
      const enrollment = enrollments.find(e => e.programId === program.id);
      if (enrollment?.status === "graduated") {
        return { text: "Graduated", color: theme.success };
      }
      return { text: "Active Participant", color: theme.success };
    }
    if (isEnrollmentOpen(program)) {
      return { text: "Open for Enrollment", color: theme.success };
    }
    const now = new Date();
    const start = new Date(program.enrollmentStartDate);
    if (now < start) {
      return { text: "Coming Soon", color: theme.accent };
    }
    return { text: "Enrollment Closed", color: theme.textSecondary };
  };

  const handleEnroll = async (program: Program) => {
    if (!user?.id) return;
    
    // Check if already enrolled to prevent duplicates
    if (isEnrolled(program.id)) {
      Alert.alert("Already Enrolled", "You are already a participant in this program.");
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setEnrollingProgramId(program.id);
    
    try {
      await storage.enrollInProgram(user.id, program.id);
      await loadData();
      Alert.alert("Success", `You have been enrolled in ${program.name}!`);
    } catch (error) {
      console.error("Enrollment error:", error);
      Alert.alert("Error", "Failed to enroll. Please try again.");
    } finally {
      setEnrollingProgramId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const filteredPrograms = programs.filter(program => {
    if (filter === "enrolled") return isEnrolled(program.id);
    if (filter === "available") return !isEnrolled(program.id) && isEnrollmentOpen(program);
    return true;
  });

  const enrolledCount = programs.filter(p => isEnrolled(p.id)).length;
  const availableCount = programs.filter(p => !isEnrolled(p.id) && isEnrollmentOpen(p)).length;

  const renderProgram = ({ item: program, index }: { item: Program; index: number }) => {
    const enrolled = isEnrolled(program.id);
    const enrollmentOpen = isEnrollmentOpen(program);
    const status = getEnrollmentStatus(program);
    const isEnrolling = enrollingProgramId === program.id;

    return (
      <Animated.View entering={FadeInUp.delay(100 + index * 50).duration(400)}>
        <Card elevation={1} style={styles.programCard}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, { backgroundColor: theme.link + "20" }]}>
              <Feather name="book-open" size={24} color={theme.link} />
            </View>
            <View style={[styles.statusBadge, { backgroundColor: status.color + "20" }]}>
              <ThemedText type="small" style={{ color: status.color, fontWeight: "600" }}>
                {status.text}
              </ThemedText>
            </View>
          </View>

          <ThemedText type="h3" style={styles.programName}>
            {program.name}
          </ThemedText>

          <ThemedText type="body" style={{ color: theme.textSecondary, marginBottom: Spacing.md }}>
            {program.description}
          </ThemedText>

          <View style={styles.dateRow}>
            <Feather name="calendar" size={14} color={theme.textSecondary} />
            <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.xs }}>
              Starts: {formatDate(program.programStartDate)}
            </ThemedText>
          </View>

          {!enrolled && enrollmentOpen ? (
            <Button
              onPress={() => handleEnroll(program)}
              disabled={isEnrolling}
              style={styles.enrollButton}
            >
              {isEnrolling ? "Enrolling..." : "Enroll Now"}
            </Button>
          ) : enrolled ? (
            <View style={[styles.enrolledBadge, { backgroundColor: theme.link + "15" }]}>
              <Feather name="check-circle" size={16} color={theme.link} />
              <ThemedText type="body" style={{ color: theme.link, marginLeft: Spacing.xs, fontWeight: "600" }}>
                You're Enrolled
              </ThemedText>
            </View>
          ) : null}
        </Card>
      </Animated.View>
    );
  };

  const FilterChip = ({ label, value, count }: { label: string; value: FilterType; count?: number }) => (
    <Animated.View entering={FadeInUp.delay(50).duration(300)}>
      <Card
        elevation={filter === value ? 2 : 1}
        onPress={() => {
          Haptics.selectionAsync();
          setFilter(value);
        }}
        style={[
          styles.filterChip,
          filter === value ? { borderWidth: 2, borderColor: theme.link } : undefined,
        ]}
      >
        <ThemedText
          type="small"
          style={{
            color: filter === value ? theme.link : theme.text,
            fontWeight: filter === value ? "700" : "500",
          }}
        >
          {label} {count !== undefined ? `(${count})` : ""}
        </ThemedText>
      </Card>
    </Animated.View>
  );

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={filteredPrograms}
        keyExtractor={(item) => item.id}
        renderItem={renderProgram}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: headerHeight + Spacing.lg, paddingBottom: tabBarHeight + Spacing.xl },
        ]}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={theme.link} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Animated.View entering={FadeInUp.delay(100).duration(400)}>
              <ThemedText type="h2" style={styles.title}>
                Program Catalog
              </ThemedText>
              <ThemedText type="body" style={{ color: theme.textSecondary, marginBottom: Spacing.lg }}>
                Browse and enroll in programs to grow your faith
              </ThemedText>
            </Animated.View>

            <View style={styles.filterRow}>
              <FilterChip label="All" value="all" count={programs.length} />
              <FilterChip label="Enrolled" value="enrolled" count={enrolledCount} />
              <FilterChip label="Available" value="available" count={availableCount} />
            </View>
          </View>
        }
        ListEmptyComponent={
          <Animated.View entering={FadeInUp.delay(200).duration(400)} style={styles.emptyState}>
            <Feather name="inbox" size={48} color={theme.textSecondary} />
            <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.md, textAlign: "center" }}>
              {filter === "enrolled"
                ? "You haven't enrolled in any programs yet"
                : filter === "available"
                ? "No programs available for enrollment right now"
                : "No programs available"}
            </ThemedText>
          </Animated.View>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  title: {
    marginBottom: Spacing.xs,
  },
  filterRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  programCard: {
    marginBottom: Spacing.md,
    padding: Spacing.lg,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  programName: {
    marginBottom: Spacing.sm,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  enrollButton: {
    marginTop: Spacing.sm,
  },
  enrolledBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["3xl"],
  },
});
