import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Animated, { FadeInUp } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { storage, Session } from "@/lib/storage";

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

export default function LeaderHomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isPendingApproval = user?.leaderStatus === "pending";
  const isRejected = user?.leaderStatus === "rejected";

  const loadData = async () => {
    const loadedSessions = await storage.getSessions();
    setSessions(loadedSessions);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadData();
    setIsRefreshing(false);
  };

  const stats = {
    totalMembers: 10,
    attendedToday: 8,
    pendingPayments: 3,
    assignmentsPending: 4,
  };

  if (isPendingApproval || isRejected) {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: tabBarHeight + Spacing.xl,
          paddingHorizontal: Spacing.lg,
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Animated.View entering={FadeInUp.delay(100).duration(500)} style={{ alignItems: "center" }}>
          <View style={[styles.pendingIcon, { backgroundColor: isPendingApproval ? theme.accent + "20" : theme.error + "20" }]}>
            <Feather 
              name={isPendingApproval ? "clock" : "x-circle"} 
              size={48} 
              color={isPendingApproval ? theme.accent : theme.error} 
            />
          </View>
          <ThemedText type="h2" style={{ textAlign: "center", marginTop: Spacing.xl }}>
            {isPendingApproval ? "Awaiting Approval" : "Application Rejected"}
          </ThemedText>
          <ThemedText 
            type="body" 
            style={{ color: theme.textSecondary, textAlign: "center", marginTop: Spacing.md, paddingHorizontal: Spacing.xl }}
          >
            {isPendingApproval 
              ? "Your application to become a Cell Leader is being reviewed by the administrator. You'll be notified once approved."
              : "Unfortunately, your application to become a Cell Leader was not approved. Please contact the administrator for more information."}
          </ThemedText>
        </Animated.View>
      </ScrollView>
    );
  }

  const upcomingSession = sessions.find(
    (s) => new Date(s.date) > new Date()
  );

  const quickActions: QuickAction[] = [
    {
      id: "attendance",
      icon: "check-circle",
      title: "Take Attendance",
      description: "Record today's session attendance",
      color: theme.link,
      onPress: () => navigation.navigate("AttendanceTab"),
    },
    {
      id: "payments",
      icon: "dollar-sign",
      title: "Confirm Payments",
      description: "Record cash payments received",
      color: theme.accent,
      onPress: () => navigation.navigate("AttendanceTab"),
    },
    {
      id: "assignments",
      icon: "file-text",
      title: "Review Assignments",
      description: "Confirm completed assignments",
      color: theme.success,
      onPress: () => navigation.navigate("AssignmentsTab"),
    },
    {
      id: "members",
      icon: "users",
      title: "View Members",
      description: "See your cell group members",
      color: "#8B5CF6",
      onPress: () => navigation.navigate("MyCellTab"),
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
      weekday: "long",
      month: "short",
      day: "numeric",
    });
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
          {user?.fullName?.split(" ")[0] || "Leader"}
        </ThemedText>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(200).duration(500)}>
        <View style={styles.statsGrid}>
          <Card elevation={1} style={styles.statCard}>
            <Feather name="users" size={20} color={theme.link} />
            <ThemedText type="h2" style={styles.statNumber}>
              {stats.totalMembers}
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Members
            </ThemedText>
          </Card>
          <Card elevation={1} style={styles.statCard}>
            <Feather name="check-circle" size={20} color={theme.success} />
            <ThemedText type="h2" style={styles.statNumber}>
              {stats.attendedToday}
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Attended
            </ThemedText>
          </Card>
          <Card elevation={1} style={styles.statCard}>
            <Feather name="dollar-sign" size={20} color={theme.warning} />
            <ThemedText type="h2" style={styles.statNumber}>
              {stats.pendingPayments}
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Pending
            </ThemedText>
          </Card>
          <Card elevation={1} style={styles.statCard}>
            <Feather name="file-text" size={20} color="#8B5CF6" />
            <ThemedText type="h2" style={styles.statNumber}>
              {stats.assignmentsPending}
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              To Review
            </ThemedText>
          </Card>
        </View>
      </Animated.View>

      {upcomingSession ? (
        <Animated.View entering={FadeInUp.delay(300).duration(500)}>
          <ThemedText type="h3" style={styles.sectionTitle}>
            Next Session
          </ThemedText>
          <Card elevation={1} style={styles.sessionCard}>
            <View style={styles.sessionRow}>
              <View style={[styles.dateBox, { backgroundColor: theme.link }]}>
                <ThemedText type="small" style={{ color: "#FFFFFF", fontWeight: "600" }}>
                  {new Date(upcomingSession.date).toLocaleDateString("en-US", { month: "short" })}
                </ThemedText>
                <ThemedText type="h2" style={{ color: "#FFFFFF" }}>
                  {new Date(upcomingSession.date).getDate()}
                </ThemedText>
              </View>
              <View style={styles.sessionInfo}>
                <ThemedText type="h4">{upcomingSession.title}</ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  {formatDate(upcomingSession.date)}
                </ThemedText>
              </View>
            </View>
          </Card>
        </Animated.View>
      ) : null}

      <Animated.View entering={FadeInUp.delay(400).duration(500)}>
        <ThemedText type="h3" style={styles.sectionTitle}>
          Quick Actions
        </ThemedText>
        <View style={styles.actionsGrid}>
          {quickActions.map((action, index) => (
            <Animated.View
              key={action.id}
              entering={FadeInUp.delay(500 + index * 50).duration(400)}
              style={styles.actionWrapper}
            >
              <Card
                elevation={1}
                style={styles.actionCard}
                onPress={action.onPress}
              >
                <View style={[styles.actionIcon, { backgroundColor: action.color + "20" }]}>
                  <Feather name={action.icon} size={22} color={action.color} />
                </View>
                <ThemedText type="h4" style={styles.actionTitle}>
                  {action.title}
                </ThemedText>
                <ThemedText
                  type="small"
                  style={{ color: theme.textSecondary }}
                  numberOfLines={2}
                >
                  {action.description}
                </ThemedText>
              </Card>
            </Animated.View>
          ))}
        </View>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pendingIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  greeting: {
    marginBottom: Spacing.xs,
  },
  name: {
    marginBottom: Spacing["2xl"],
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    marginBottom: Spacing["2xl"],
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    alignItems: "center",
    padding: Spacing.lg,
  },
  statNumber: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  sectionTitle: {
    marginBottom: Spacing.lg,
  },
  sessionCard: {
    marginBottom: Spacing["2xl"],
  },
  sessionRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateBox: {
    width: 56,
    height: 64,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.lg,
  },
  sessionInfo: {
    flex: 1,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  actionWrapper: {
    width: "48%",
  },
  actionCard: {
    padding: Spacing.lg,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  actionTitle: {
    marginBottom: Spacing.xs,
  },
});
