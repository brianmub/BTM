import React, { useState, useCallback } from "react";
import { View, StyleSheet, ScrollView, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Animated, { FadeInUp } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { storage, Session, Program, Assignment } from "@/lib/storage";

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

interface QuickAction {
  id: string;
  icon: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
  color: string;
  onPress: () => void;
}

export default function FacilitatorHomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { user } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalSessions: 0,
    upcomingSessions: 0,
    totalAssignments: 0,
    activePrograms: 0,
  });
  const [nextSession, setNextSession] = useState<Session | null>(null);

  const loadData = useCallback(async () => {
    if (!user?.organizationId) return;
    const [sessions, programs, assignments] = await Promise.all([
      storage.getSessions(user.organizationId),
      storage.getPrograms(user.organizationId),
      storage.getAssignments(user.organizationId),
    ]);

    const now = new Date();
    const upcomingSessions = sessions.filter(s => new Date(s.date) > now);
    const activePrograms = programs.filter(p => p.isActive);

    const sortedUpcoming = upcomingSessions.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    setStats({
      totalSessions: sessions.length,
      upcomingSessions: upcomingSessions.length,
      totalAssignments: assignments.length,
      activePrograms: activePrograms.length,
    });
    setNextSession(sortedUpcoming[0] || null);
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

  const quickActions: QuickAction[] = [
    {
      id: "sessions",
      icon: "calendar",
      title: "Manage Sessions",
      description: "View and edit session content",
      color: theme.link,
      onPress: () => navigation.navigate("SessionsTab"),
    },
    {
      id: "assignments",
      icon: "file-text",
      title: "Manage Assignments",
      description: "Create and track assignments",
      color: theme.success,
      onPress: () => navigation.navigate("AssignmentsTab"),
    },
    {
      id: "materials",
      icon: "folder",
      title: "Session Materials",
      description: "Upload resources and materials",
      color: theme.accent,
      onPress: () => {},
    },
    {
      id: "announcements",
      icon: "bell",
      title: "Announcements",
      description: "Send updates to participants",
      color: "#8B5CF6",
      onPress: () => {},
    },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
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
            progressViewOffset={headerHeight}
          />
        }
      >
        <Animated.View entering={FadeInUp.delay(100).duration(500)}>
          <ThemedText type="h2">
            {getGreeting()}, {user?.fullName.split(" ")[0]}
          </ThemedText>
          <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.xs }}>
            Here's your facilitator overview
          </ThemedText>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).duration(500)} style={styles.statsGrid}>
          <Card elevation={1} style={[styles.statCard, { backgroundColor: theme.link + "15" }]}>
            <Feather name="calendar" size={24} color={theme.link} />
            <ThemedText type="h2" style={{ color: theme.link, marginTop: Spacing.sm }}>
              {stats.totalSessions}
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Total Sessions
            </ThemedText>
          </Card>
          <Card elevation={1} style={[styles.statCard, { backgroundColor: theme.success + "15" }]}>
            <Feather name="clock" size={24} color={theme.success} />
            <ThemedText type="h2" style={{ color: theme.success, marginTop: Spacing.sm }}>
              {stats.upcomingSessions}
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Upcoming
            </ThemedText>
          </Card>
          <Card elevation={1} style={[styles.statCard, { backgroundColor: theme.accent + "15" }]}>
            <Feather name="file-text" size={24} color={theme.accent} />
            <ThemedText type="h2" style={{ color: theme.accent, marginTop: Spacing.sm }}>
              {stats.totalAssignments}
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Assignments
            </ThemedText>
          </Card>
          <Card elevation={1} style={[styles.statCard, { backgroundColor: "#8B5CF6" + "15" }]}>
            <Feather name="book-open" size={24} color="#8B5CF6" />
            <ThemedText type="h2" style={{ color: "#8B5CF6", marginTop: Spacing.sm }}>
              {stats.activePrograms}
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Programs
            </ThemedText>
          </Card>
        </Animated.View>

        {nextSession ? (
          <Animated.View entering={FadeInUp.delay(300).duration(500)}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              Next Session
            </ThemedText>
            <Card elevation={2} style={styles.nextSessionCard}>
              <View style={styles.sessionHeader}>
                <View style={[styles.sessionIcon, { backgroundColor: theme.link + "20" }]}>
                  <Feather name="play-circle" size={24} color={theme.link} />
                </View>
                <View style={styles.sessionInfo}>
                  <ThemedText type="h4">{nextSession.title}</ThemedText>
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>
                    Session {nextSession.sessionNumber} · {formatDate(nextSession.date)}
                  </ThemedText>
                </View>
              </View>
              {nextSession.overview ? (
                <ThemedText
                  type="body"
                  style={{ color: theme.textSecondary, marginTop: Spacing.md }}
                  numberOfLines={2}
                >
                  {nextSession.overview}
                </ThemedText>
              ) : null}
            </Card>
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeInUp.delay(400).duration(500)}>
          <ThemedText type="h3" style={styles.sectionTitle}>
            Quick Actions
          </ThemedText>
          <View style={styles.actionsGrid}>
            {quickActions.map((action) => (
              <Card
                key={action.id}
                elevation={1}
                style={styles.actionCard}
                onPress={action.onPress}
              >
                <View style={[styles.actionIcon, { backgroundColor: action.color + "20" }]}>
                  <Feather name={action.icon} size={22} color={action.color} />
                </View>
                <ThemedText type="body" style={{ fontWeight: "600", marginTop: Spacing.sm }}>
                  {action.title}
                </ThemedText>
                <ThemedText
                  type="small"
                  style={{ color: theme.textSecondary, marginTop: Spacing.xs }}
                >
                  {action.description}
                </ThemedText>
              </Card>
            ))}
          </View>
        </Animated.View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: Spacing.xl,
    gap: Spacing.md,
  },
  statCard: {
    width: "47%",
    alignItems: "center",
    paddingVertical: Spacing.lg,
  },
  sectionTitle: {
    marginTop: Spacing["2xl"],
    marginBottom: Spacing.md,
  },
  nextSessionCard: {
    padding: Spacing.lg,
  },
  sessionHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  sessionIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  sessionInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  actionCard: {
    width: "47%",
    padding: Spacing.lg,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
});
