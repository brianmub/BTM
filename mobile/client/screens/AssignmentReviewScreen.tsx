import React, { useState, useCallback } from "react";
import { View, StyleSheet, FlatList, Pressable, RefreshControl, Alert } from "react-native";
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
import { useAuth } from "@/contexts/AuthContext";
import { storage, Assignment, AssignmentSubmission, User } from "@/lib/storage";

interface SubmissionWithDetails {
  submission: AssignmentSubmission;
  assignment: Assignment;
  user: User;
}

export default function AssignmentReviewScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { user } = useAuth();
  const [pendingSubmissions, setPendingSubmissions] = useState<SubmissionWithDetails[]>([]);
  const [confirmedSubmissions, setConfirmedSubmissions] = useState<SubmissionWithDetails[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const [submissions, assignments, users] = await Promise.all([
      storage.getSubmissions(),
      storage.getAssignments(),
      storage.getAllUsers(),
    ]);

    const pending: SubmissionWithDetails[] = [];
    const confirmed: SubmissionWithDetails[] = [];

    for (const submission of submissions) {
      const assignment = assignments.find(a => a.id === submission.assignmentId);
      const submitter = users.find(u => u.id === submission.userId);
      
      if (assignment && submitter) {
        const detail = { submission, assignment, user: submitter };
        if (submission.isConfirmed) {
          confirmed.push(detail);
        } else {
          pending.push(detail);
        }
      }
    }

    setPendingSubmissions(pending.sort((a, b) => 
      new Date(b.submission.submittedAt).getTime() - new Date(a.submission.submittedAt).getTime()
    ));
    setConfirmedSubmissions(confirmed.sort((a, b) => 
      new Date(b.submission.submittedAt).getTime() - new Date(a.submission.submittedAt).getTime()
    ));
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

  const handleConfirm = async (item: SubmissionWithDetails) => {
    if (!user) return;
    
    setConfirmingId(item.submission.id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    await storage.confirmAssignment(item.assignment.id, item.user.id, user.id);
    await loadData();
    
    setConfirmingId(null);
    Alert.alert("Confirmed", `${item.user.fullName}'s assignment has been confirmed.`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const renderSubmission = ({ item, index }: { item: SubmissionWithDetails; index: number }) => {
    const isConfirming = confirmingId === item.submission.id;
    
    return (
      <Animated.View entering={FadeInUp.delay(index * 50).duration(400)}>
        <Card elevation={1} style={styles.submissionCard}>
          <View style={styles.cardHeader}>
            <View style={[styles.avatar, { backgroundColor: theme.link + "20" }]}>
              <ThemedText type="body" style={{ color: theme.link, fontWeight: "600" }}>
                {item.user.fullName.charAt(0).toUpperCase()}
              </ThemedText>
            </View>
            <View style={styles.headerInfo}>
              <ThemedText type="h4">{item.user.fullName}</ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {formatDate(item.submission.submittedAt)}
              </ThemedText>
            </View>
            {item.submission.isLate ? (
              <View style={[styles.lateBadge, { backgroundColor: theme.error }]}>
                <ThemedText type="small" style={{ color: "#FFFFFF", fontWeight: "600" }}>Late</ThemedText>
              </View>
            ) : null}
          </View>

          <View style={[styles.assignmentInfo, { backgroundColor: theme.backgroundSecondary }]}>
            <Feather name="file-text" size={16} color={theme.textSecondary} />
            <ThemedText type="body" style={{ marginLeft: Spacing.sm, flex: 1 }}>
              {item.assignment.title}
            </ThemedText>
          </View>

          <View style={styles.contentPreview}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Submission:
            </ThemedText>
            <ThemedText type="body" numberOfLines={3} style={{ marginTop: Spacing.xs }}>
              {item.submission.content}
            </ThemedText>
          </View>

          {!item.submission.isConfirmed ? (
            <Button
              onPress={() => handleConfirm(item)}
              disabled={isConfirming}
              style={styles.confirmButton}
            >
              {isConfirming ? "Confirming..." : "Confirm Submission"}
            </Button>
          ) : (
            <View style={[styles.confirmedBadge, { backgroundColor: theme.success + "20" }]}>
              <Feather name="check-circle" size={18} color={theme.success} />
              <ThemedText type="body" style={{ color: theme.success, marginLeft: Spacing.sm }}>
                Confirmed
              </ThemedText>
            </View>
          )}
        </Card>
      </Animated.View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIcon, { backgroundColor: theme.backgroundSecondary }]}>
        <Feather name="inbox" size={48} color={theme.textSecondary} />
      </View>
      <ThemedText type="h3" style={{ marginTop: Spacing.lg }}>
        No Submissions
      </ThemedText>
      <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "center", marginTop: Spacing.sm }}>
        Assignment submissions from your cell members will appear here
      </ThemedText>
    </View>
  );

  const allSubmissions = [...pendingSubmissions, ...confirmedSubmissions];

  return (
    <ThemedView style={styles.container}>
      {pendingSubmissions.length > 0 ? (
        <View style={[styles.pendingBanner, { backgroundColor: theme.accent + "20", marginTop: headerHeight }]}>
          <Feather name="alert-circle" size={18} color={theme.accent} />
          <ThemedText type="body" style={{ color: theme.accent, marginLeft: Spacing.sm }}>
            {pendingSubmissions.length} pending confirmation{pendingSubmissions.length !== 1 ? "s" : ""}
          </ThemedText>
        </View>
      ) : null}

      <FlatList
        data={allSubmissions}
        renderItem={renderSubmission}
        keyExtractor={(item) => item.submission.id}
        contentContainerStyle={{
          paddingTop: pendingSubmissions.length > 0 ? Spacing.md : headerHeight + Spacing.xl,
          paddingBottom: tabBarHeight + Spacing.xl,
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
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pendingBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  submissionCard: {
    marginBottom: Spacing.lg,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  lateBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  assignmentInfo: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  contentPreview: {
    marginBottom: Spacing.lg,
  },
  confirmButton: {
    marginTop: Spacing.sm,
  },
  confirmedBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
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
