import React, { useState, useCallback } from "react";
import { View, StyleSheet, FlatList, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInUp } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { storage, AuditLog, AuditAction } from "@/lib/storage";

const getActionInfo = (action: AuditAction): { icon: string; color: string; label: string } => {
  switch (action) {
    case "leader_approved":
      return { icon: "user-check", color: "#22C55E", label: "Leader Approved" };
    case "leader_rejected":
      return { icon: "user-x", color: "#EF4444", label: "Leader Rejected" };
    case "cell_created":
      return { icon: "layers", color: "#3B82F6", label: "Cell Created" };
    case "cell_member_assigned":
      return { icon: "user-plus", color: "#8B5CF6", label: "Member Assigned" };
    case "cell_member_override":
      return { icon: "edit", color: "#F59E0B", label: "Override Applied" };
    case "attendance_confirmed":
      return { icon: "check-circle", color: "#22C55E", label: "Attendance Confirmed" };
    case "payment_confirmed":
      return { icon: "dollar-sign", color: "#22C55E", label: "Payment Confirmed" };
    case "assignment_confirmed":
      return { icon: "file-text", color: "#22C55E", label: "Assignment Confirmed" };
    case "graduation_granted":
      return { icon: "award", color: "#F59E0B", label: "Graduation Granted" };
    case "enrollment_created":
      return { icon: "user-plus", color: "#3B82F6", label: "Enrollment Created" };
    default:
      return { icon: "activity", color: "#6B7C73", label: "Action" };
  }
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export default function AuditLogScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    const auditLogs = await storage.getAuditLogs();
    setLogs(auditLogs);
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

  const renderLog = ({ item, index }: { item: AuditLog; index: number }) => {
    const actionInfo = getActionInfo(item.action);

    return (
      <Animated.View entering={FadeInUp.delay(50 + index * 30).duration(300)}>
        <View style={[styles.logItem, { borderBottomColor: theme.border }]}>
          <View style={[styles.logIcon, { backgroundColor: actionInfo.color + "20" }]}>
            <Feather name={actionInfo.icon as any} size={16} color={actionInfo.color} />
          </View>
          <View style={styles.logContent}>
            <View style={styles.logHeader}>
              <ThemedText type="body" style={{ fontWeight: "600" }}>
                {actionInfo.label}
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {formatDate(item.timestamp)}
              </ThemedText>
            </View>
            <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: 2 }}>
              {item.details}
            </ThemedText>
          </View>
        </View>
      </Animated.View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={logs}
        keyExtractor={item => item.id}
        renderItem={renderLog}
        contentContainerStyle={[
          styles.content,
          { paddingTop: headerHeight + Spacing.lg, paddingBottom: insets.bottom + 100 },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.link} />
        }
        ListEmptyComponent={
          <Card elevation={1} style={styles.emptyCard}>
            <Feather name="file-text" size={32} color={theme.textSecondary} />
            <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.sm }}>
              No audit logs yet
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.xs, textAlign: "center" }}>
              Actions like leader approvals, cell creation, and payment confirmations will appear here.
            </ThemedText>
          </Card>
        }
        ListHeaderComponent={
          <Animated.View entering={FadeInUp.delay(100).duration(400)}>
            <ThemedText type="h2" style={styles.title}>
              Audit Log
            </ThemedText>
            <ThemedText type="body" style={{ color: theme.textSecondary, marginBottom: Spacing.xl }}>
              Track all critical system actions
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
  content: {
    paddingHorizontal: Spacing.xl,
  },
  title: {
    marginBottom: Spacing.xs,
  },
  logItem: {
    flexDirection: "row",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  logIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  logContent: {
    flex: 1,
  },
  logHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  emptyCard: {
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
    paddingHorizontal: Spacing.xl,
  },
});
