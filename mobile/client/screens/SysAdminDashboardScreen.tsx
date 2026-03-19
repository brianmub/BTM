import React, { useState, useCallback } from "react";
import { View, StyleSheet, ScrollView, RefreshControl, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInUp } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { storage, Program } from "@/lib/storage";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

interface DashboardStats {
  totalPrograms: number;
  activeEnrollments: number;
  pendingLeaders: number;
  approvedLeaders: number;
  totalCells: number;
  totalParticipants: number;
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function SysAdminDashboardScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const [stats, setStats] = useState<DashboardStats>({
    totalPrograms: 0,
    activeEnrollments: 0,
    pendingLeaders: 0,
    approvedLeaders: 0,
    totalCells: 0,
    totalParticipants: 0,
  });
  const [programs, setPrograms] = useState<Program[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    const [allPrograms, users, enrollments, cells] = await Promise.all([
      storage.getPrograms(),
      storage.getAllUsers(),
      storage.getEnrollments(),
      storage.getCellGroups(),
    ]);

    const pendingLeaders = users.filter(u => u.role === "leader" && u.leaderStatus === "pending");
    const approvedLeaders = users.filter(u => u.role === "leader" && u.leaderStatus === "approved");
    const participants = users.filter(u => u.role === "participant");

    setPrograms(allPrograms.filter(p => p.isActive));
    setStats({
      totalPrograms: allPrograms.filter(p => p.isActive).length,
      activeEnrollments: enrollments.filter(e => e.status === "enrolled" || e.status === "assigned").length,
      pendingLeaders: pendingLeaders.length,
      approvedLeaders: approvedLeaders.length,
      totalCells: cells.length,
      totalParticipants: participants.length,
    });
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

  const isEnrollmentOpen = (program: Program): boolean => {
    const now = new Date();
    const end = new Date(program.enrollmentEndDate);
    return now <= end;
  };

  const handleManagePrograms = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("ProgramManagement");
  };

  const statItems = [
    { label: "Active Programs", value: stats.totalPrograms, icon: "book", color: theme.link },
    { label: "Enrollments", value: stats.activeEnrollments, icon: "users", color: theme.success },
    { label: "Pending Leaders", value: stats.pendingLeaders, icon: "user-plus", color: theme.warning },
    { label: "Approved Leaders", value: stats.approvedLeaders, icon: "user-check", color: theme.link },
    { label: "Active Cells", value: stats.totalCells, icon: "layers", color: theme.accent },
    { label: "Participants", value: stats.totalParticipants, icon: "user", color: theme.textSecondary },
  ];

  const quickActions = [
    { label: "Manage Programs", icon: "book-open", onPress: handleManagePrograms },
  ];

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: headerHeight + Spacing.lg, paddingBottom: insets.bottom + 100 },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.link} />
        }
      >
        <Animated.View entering={FadeInUp.delay(100).duration(400)}>
          <ThemedText type="h2" style={styles.greeting}>
            Welcome, {user?.fullName?.split(" ")[0]}
          </ThemedText>
          <ThemedText type="body" style={{ color: theme.textSecondary, marginBottom: Spacing.xl }}>
            System Administration Dashboard
          </ThemedText>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(150).duration(400)}>
          <View style={styles.quickActionsRow}>
            {quickActions.map((action, index) => (
              <Pressable key={index} onPress={action.onPress} style={styles.quickAction}>
                <Card elevation={1} style={[styles.quickActionCard, { borderColor: theme.link }]}>
                  <View style={[styles.quickActionIcon, { backgroundColor: theme.link + "20" }]}>
                    <Feather name={action.icon as any} size={20} color={theme.link} />
                  </View>
                  <ThemedText type="small" style={{ fontWeight: "600", color: theme.link }}>
                    {action.label}
                  </ThemedText>
                </Card>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        <View style={styles.statsGrid}>
          {statItems.map((item, index) => (
            <Animated.View
              key={item.label}
              entering={FadeInUp.delay(200 + index * 50).duration(400)}
              style={styles.statCard}
            >
              <Card elevation={1} style={styles.statCardInner}>
                <View style={[styles.statIcon, { backgroundColor: item.color + "20" }]}>
                  <Feather name={item.icon as any} size={20} color={item.color} />
                </View>
                <ThemedText type="h2" style={styles.statValue}>
                  {item.value}
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  {item.label}
                </ThemedText>
              </Card>
            </Animated.View>
          ))}
        </View>

        <Animated.View entering={FadeInUp.delay(500).duration(400)}>
          <ThemedText type="h3" style={styles.sectionTitle}>
            Programs
          </ThemedText>
        </Animated.View>

        {programs.map((program, index) => (
          <Animated.View key={program.id} entering={FadeInUp.delay(550 + index * 50).duration(400)}>
            <Card elevation={1} style={styles.programCard}>
              <View style={styles.programHeader}>
                <ThemedText type="h4">{program.name}</ThemedText>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: isEnrollmentOpen(program) ? theme.success + "20" : theme.textSecondary + "20" },
                  ]}
                >
                  <ThemedText
                    type="small"
                    style={{
                      color: isEnrollmentOpen(program) ? theme.success : theme.textSecondary,
                      fontWeight: "600",
                    }}
                  >
                    {isEnrollmentOpen(program) ? "Enrollment Open" : "Enrollment Closed"}
                  </ThemedText>
                </View>
              </View>
              <View style={styles.programDetails}>
                <View style={styles.programDetail}>
                  <Feather name="calendar" size={14} color={theme.textSecondary} />
                  <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.xs }}>
                    Starts: {new Date(program.programStartDate).toLocaleDateString()}
                  </ThemedText>
                </View>
                <View style={styles.programDetail}>
                  <Feather name="users" size={14} color={theme.textSecondary} />
                  <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.xs }}>
                    Cell size: {program.minCellSize}-{program.maxCellSize}
                  </ThemedText>
                </View>
              </View>
            </Card>
          </Animated.View>
        ))}
      </ScrollView>
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
  greeting: {
    marginBottom: Spacing.xs,
  },
  quickActionsRow: {
    flexDirection: "row",
    marginBottom: Spacing.xl,
  },
  quickAction: {
    flex: 1,
  },
  quickActionCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
  },
  quickActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -Spacing.xs,
    marginBottom: Spacing.xl,
  },
  statCard: {
    width: "50%",
    padding: Spacing.xs,
  },
  statCardInner: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  statValue: {
    marginBottom: Spacing.xs,
  },
  sectionTitle: {
    marginBottom: Spacing.lg,
  },
  programCard: {
    marginBottom: Spacing.md,
  },
  programHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
  },
  programDetails: {
    flexDirection: "row",
    gap: Spacing.xl,
  },
  programDetail: {
    flexDirection: "row",
    alignItems: "center",
  },
});
