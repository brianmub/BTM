import React, { useState } from "react";
import { View, StyleSheet, ScrollView, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInUp } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";

function ProgressRing({
  progress,
  size,
  strokeWidth,
  color,
  trackColor,
}: {
  progress: number;
  size: number;
  strokeWidth: number;
  color: string;
  trackColor: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <View style={{ width: size, height: size }}>
      <View
        style={[
          styles.ringTrack,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: trackColor,
          },
        ]}
      />
      <View
        style={[
          styles.ringProgress,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: color,
            borderTopColor: "transparent",
            borderRightColor: progress > 0.25 ? color : "transparent",
            borderBottomColor: progress > 0.5 ? color : "transparent",
            borderLeftColor: progress > 0.75 ? color : "transparent",
            transform: [{ rotate: "-90deg" }],
          },
        ]}
      />
      <View style={styles.ringCenter}>
        <ThemedText type="h3">{Math.round(progress * 100)}%</ThemedText>
      </View>
    </View>
  );
}

export default function AdminDashboardScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { user } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const stats = {
    totalParticipants: 48,
    totalLeaders: 5,
    totalCells: 5,
    averageAttendance: 0.82,
    assignmentCompletion: 0.75,
    graduationEligible: 32,
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
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
        />
      }
    >
      <Animated.View entering={FadeInUp.delay(100).duration(500)}>
        <ThemedText type="h1" style={styles.greeting}>
          {getGreeting()},
        </ThemedText>
        <ThemedText type="h2" style={[styles.name, { color: theme.link }]}>
          {user?.fullName?.split(" ")[0] || "Admin"}
        </ThemedText>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(200).duration(500)}>
        <ThemedText type="h3" style={styles.sectionTitle}>
          Program Overview
        </ThemedText>
        <View style={styles.overviewGrid}>
          <Card elevation={1} style={styles.overviewCard}>
            <View style={[styles.overviewIcon, { backgroundColor: theme.link + "20" }]}>
              <Feather name="users" size={24} color={theme.link} />
            </View>
            <ThemedText type="h2">{stats.totalParticipants}</ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Participants
            </ThemedText>
          </Card>
          <Card elevation={1} style={styles.overviewCard}>
            <View style={[styles.overviewIcon, { backgroundColor: theme.accent + "20" }]}>
              <Feather name="user-check" size={24} color={theme.accent} />
            </View>
            <ThemedText type="h2">{stats.totalLeaders}</ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Cell Leaders
            </ThemedText>
          </Card>
          <Card elevation={1} style={styles.overviewCard}>
            <View style={[styles.overviewIcon, { backgroundColor: theme.success + "20" }]}>
              <Feather name="grid" size={24} color={theme.success} />
            </View>
            <ThemedText type="h2">{stats.totalCells}</ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Cell Groups
            </ThemedText>
          </Card>
          <Card elevation={1} style={styles.overviewCard}>
            <View style={[styles.overviewIcon, { backgroundColor: "#8B5CF6" + "20" }]}>
              <Feather name="award" size={24} color="#8B5CF6" />
            </View>
            <ThemedText type="h2">{stats.graduationEligible}</ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Eligible
            </ThemedText>
          </Card>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(300).duration(500)}>
        <ThemedText type="h3" style={styles.sectionTitle}>
          Performance Metrics
        </ThemedText>
        <View style={styles.metricsRow}>
          <Card elevation={1} style={styles.metricCard}>
            <ProgressRing
              progress={stats.averageAttendance}
              size={80}
              strokeWidth={8}
              color={theme.link}
              trackColor={theme.progressTrack}
            />
            <ThemedText type="h4" style={styles.metricLabel}>
              Attendance
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Average rate
            </ThemedText>
          </Card>
          <Card elevation={1} style={styles.metricCard}>
            <ProgressRing
              progress={stats.assignmentCompletion}
              size={80}
              strokeWidth={8}
              color={theme.success}
              trackColor={theme.progressTrack}
            />
            <ThemedText type="h4" style={styles.metricLabel}>
              Assignments
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Completion rate
            </ThemedText>
          </Card>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(400).duration(500)}>
        <ThemedText type="h3" style={styles.sectionTitle}>
          Recent Activity
        </ThemedText>
        <Card elevation={1} style={styles.activityCard}>
          <View style={styles.activityItem}>
            <View style={[styles.activityDot, { backgroundColor: theme.success }]} />
            <View style={styles.activityContent}>
              <ThemedText type="body">New participant registered</ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                2 hours ago
              </ThemedText>
            </View>
          </View>
          <View style={[styles.activityItem, { borderTopColor: theme.border, borderTopWidth: 1 }]}>
            <View style={[styles.activityDot, { backgroundColor: theme.link }]} />
            <View style={styles.activityContent}>
              <ThemedText type="body">Session 3 attendance confirmed</ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                5 hours ago
              </ThemedText>
            </View>
          </View>
          <View style={[styles.activityItem, { borderTopColor: theme.border, borderTopWidth: 1 }]}>
            <View style={[styles.activityDot, { backgroundColor: theme.accent }]} />
            <View style={styles.activityContent}>
              <ThemedText type="body">Cell Leader approved</ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Yesterday
              </ThemedText>
            </View>
          </View>
        </Card>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  greeting: {
    marginBottom: Spacing.xs,
  },
  name: {
    marginBottom: Spacing["2xl"],
  },
  sectionTitle: {
    marginBottom: Spacing.lg,
  },
  overviewGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    marginBottom: Spacing["2xl"],
  },
  overviewCard: {
    flex: 1,
    minWidth: "45%",
    alignItems: "center",
    padding: Spacing.lg,
  },
  overviewIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  metricsRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing["2xl"],
  },
  metricCard: {
    flex: 1,
    alignItems: "center",
    padding: Spacing.xl,
  },
  ringTrack: {
    position: "absolute",
  },
  ringProgress: {
    position: "absolute",
  },
  ringCenter: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  metricLabel: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  activityCard: {
    padding: 0,
    overflow: "hidden",
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
  },
  activityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: Spacing.md,
  },
  activityContent: {
    flex: 1,
  },
});
