import React, { useState, useCallback } from "react";
import { View, StyleSheet, FlatList, RefreshControl } from "react-native";
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
import { storage, Program, Enrollment, Session } from "@/lib/storage";

interface ProgramWithStats extends Program {
  enrollmentCount: number;
  sessionCount: number;
  isEnrollmentOpen: boolean;
}

export default function AdminProgramsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const [programs, setPrograms] = useState<ProgramWithStats[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const [allPrograms, enrollments, sessions] = await Promise.all([
      storage.getPrograms(),
      storage.getEnrollments(),
      storage.getSessions(),
    ]);

    const now = new Date();
    const programsWithStats: ProgramWithStats[] = allPrograms.map(program => {
      const programEnrollments = enrollments.filter(e => e.programId === program.id);
      const programSessions = sessions.filter(s => s.programId === program.id);
      const enrollmentStart = new Date(program.enrollmentStartDate);
      const enrollmentEnd = new Date(program.enrollmentEndDate);
      const isEnrollmentOpen = now >= enrollmentStart && now <= enrollmentEnd;

      return {
        ...program,
        enrollmentCount: programEnrollments.length,
        sessionCount: programSessions.length,
        isEnrollmentOpen,
      };
    });

    setPrograms(programsWithStats.sort((a, b) => a.name.localeCompare(b.name)));
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const renderProgram = ({ item, index }: { item: ProgramWithStats; index: number }) => (
    <Animated.View entering={FadeInUp.delay(index * 50).duration(400)}>
      <Card elevation={1} style={styles.programCard}>
        <View style={styles.cardHeader}>
          <View style={[styles.programIcon, { backgroundColor: theme.link + "20" }]}>
            <Feather name="book-open" size={24} color={theme.link} />
          </View>
          <View style={styles.headerInfo}>
            <ThemedText type="h4">{item.name}</ThemedText>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: item.isEnrollmentOpen ? theme.success + "20" : theme.textSecondary + "20" },
                ]}
              >
                <ThemedText
                  type="small"
                  style={{ color: item.isEnrollmentOpen ? theme.success : theme.textSecondary, fontWeight: "600" }}
                >
                  {item.isEnrollmentOpen ? "Enrollment Open" : "Enrollment Closed"}
                </ThemedText>
              </View>
            </View>
          </View>
        </View>

        <ThemedText type="body" style={{ color: theme.textSecondary, marginBottom: Spacing.md }} numberOfLines={2}>
          {item.description}
        </ThemedText>

        <View style={[styles.statsRow, { borderTopColor: theme.border }]}>
          <View style={styles.statItem}>
            <Feather name="users" size={16} color={theme.link} />
            <ThemedText type="body" style={{ marginLeft: Spacing.xs, fontWeight: "600" }}>
              {item.enrollmentCount}
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.xs }}>
              enrolled
            </ThemedText>
          </View>
          <View style={styles.statItem}>
            <Feather name="calendar" size={16} color={theme.accent} />
            <ThemedText type="body" style={{ marginLeft: Spacing.xs, fontWeight: "600" }}>
              {item.sessionCount}
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.xs }}>
              sessions
            </ThemedText>
          </View>
        </View>

        <View style={[styles.dateRow, { backgroundColor: theme.backgroundSecondary }]}>
          <View style={styles.dateItem}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>Enrollment Period</ThemedText>
            <ThemedText type="body" style={{ fontWeight: "500" }}>
              {formatDate(item.enrollmentStartDate)} - {formatDate(item.enrollmentEndDate)}
            </ThemedText>
          </View>
          <View style={styles.dateItem}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>Program Start</ThemedText>
            <ThemedText type="body" style={{ fontWeight: "500" }}>
              {formatDate(item.programStartDate)}
            </ThemedText>
          </View>
        </View>
      </Card>
    </Animated.View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIcon, { backgroundColor: theme.backgroundSecondary }]}>
        <Feather name="book" size={48} color={theme.textSecondary} />
      </View>
      <ThemedText type="h3" style={{ marginTop: Spacing.lg }}>
        No Programs
      </ThemedText>
      <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "center", marginTop: Spacing.sm }}>
        Programs will appear here once created
      </ThemedText>
    </View>
  );

  const totalEnrollments = programs.reduce((sum, p) => sum + p.enrollmentCount, 0);
  const activePrograms = programs.filter(p => p.isActive).length;

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={programs}
        renderItem={renderProgram}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: tabBarHeight + Spacing.xl,
          paddingHorizontal: Spacing.lg,
          flexGrow: 1,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        ListHeaderComponent={
          programs.length > 0 ? (
            <View style={[styles.summaryCard, { backgroundColor: theme.link + "10" }]}>
              <View style={styles.summaryItem}>
                <ThemedText type="h2" style={{ color: theme.link }}>{programs.length}</ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>Total Programs</ThemedText>
              </View>
              <View style={[styles.summaryDivider, { backgroundColor: theme.border }]} />
              <View style={styles.summaryItem}>
                <ThemedText type="h2" style={{ color: theme.success }}>{activePrograms}</ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>Active</ThemedText>
              </View>
              <View style={[styles.summaryDivider, { backgroundColor: theme.border }]} />
              <View style={styles.summaryItem}>
                <ThemedText type="h2" style={{ color: theme.accent }}>{totalEnrollments}</ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>Enrollments</ThemedText>
              </View>
            </View>
          ) : null
        }
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
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
  },
  summaryItem: {
    alignItems: "center",
  },
  summaryDivider: {
    width: 1,
    height: 40,
  },
  programCard: {
    marginBottom: Spacing.lg,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  programIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  headerInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  statusRow: {
    flexDirection: "row",
    marginTop: Spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  statsRow: {
    flexDirection: "row",
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    marginBottom: Spacing.md,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  dateRow: {
    flexDirection: "row",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.lg,
  },
  dateItem: {
    flex: 1,
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
});
