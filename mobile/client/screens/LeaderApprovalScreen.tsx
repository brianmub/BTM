import React, { useEffect, useState, useCallback } from "react";
import { View, StyleSheet, FlatList, RefreshControl, Alert } from "react-native";
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
import { useAuth } from "@/contexts/AuthContext";
import { storage, User } from "@/lib/storage";

export default function LeaderApprovalScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const { user } = useAuth();
  const [pendingLeaders, setPendingLeaders] = useState<User[]>([]);
  const [approvedLeaders, setApprovedLeaders] = useState<User[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    const [pending, approved] = await Promise.all([
      storage.getPendingLeaders(),
      storage.getApprovedLeaders(),
    ]);
    setPendingLeaders(pending);
    setApprovedLeaders(approved);
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

  const handleApprove = async (leader: User) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await storage.approveLeader(leader.id, user?.id || "system");
    await loadData();
    Alert.alert("Approved", `${leader.fullName} has been approved as a Cell Leader.`);
  };

  const handleReject = async (leader: User) => {
    Alert.alert(
      "Reject Leader",
      `Are you sure you want to reject ${leader.fullName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await storage.rejectLeader(leader.id, user?.id || "system");
            await loadData();
          },
        },
      ]
    );
  };

  const renderPendingLeader = ({ item, index }: { item: User; index: number }) => (
    <Animated.View entering={FadeInUp.delay(100 + index * 50).duration(400)}>
      <Card elevation={1} style={styles.leaderCard}>
        <View style={styles.leaderInfo}>
          <View style={[styles.avatar, { backgroundColor: theme.link + "20" }]}>
            <ThemedText type="h4" style={{ color: theme.link }}>
              {item.fullName.charAt(0).toUpperCase()}
            </ThemedText>
          </View>
          <View style={styles.leaderDetails}>
            <ThemedText type="h4">{item.fullName}</ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {item.email}
            </ThemedText>
            <View style={styles.leaderMeta}>
              <View style={[styles.metaBadge, { backgroundColor: theme.backgroundSecondary }]}>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  {item.gender === "male" ? "Male" : "Female"}
                </ThemedText>
              </View>
              <View style={[styles.metaBadge, { backgroundColor: theme.backgroundSecondary }]}>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  {item.maritalStatus === "married" ? "Married" : "Unmarried"}
                </ThemedText>
              </View>
            </View>
          </View>
        </View>
        <View style={styles.actionButtons}>
          <Button onPress={() => handleApprove(item)} style={styles.approveButton}>
            Approve
          </Button>
          <Button
            variant="secondary"
            onPress={() => handleReject(item)}
            style={styles.rejectButton}
          >
            Reject
          </Button>
        </View>
      </Card>
    </Animated.View>
  );

  const renderApprovedLeader = ({ item, index }: { item: User; index: number }) => (
    <Animated.View entering={FadeInUp.delay(100 + index * 50).duration(400)}>
      <Card elevation={1} style={styles.approvedCard}>
        <View style={[styles.avatar, { backgroundColor: theme.success + "20" }]}>
          <Feather name="check" size={20} color={theme.success} />
        </View>
        <View style={styles.approvedInfo}>
          <ThemedText type="body" style={{ fontWeight: "600" }}>
            {item.fullName}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {item.email}
          </ThemedText>
        </View>
      </Card>
    </Animated.View>
  );

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={[]}
        renderItem={() => null}
        ListHeaderComponent={
          <>
            <Animated.View entering={FadeInUp.delay(100).duration(400)}>
              <ThemedText type="h3" style={styles.sectionTitle}>
                Pending Approval ({pendingLeaders.length})
              </ThemedText>
            </Animated.View>

            {pendingLeaders.length === 0 ? (
              <Card elevation={1} style={styles.emptyCard}>
                <Feather name="check-circle" size={32} color={theme.success} />
                <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.sm }}>
                  No pending leader requests
                </ThemedText>
              </Card>
            ) : (
              pendingLeaders.map((leader, index) => (
                <View key={leader.id}>{renderPendingLeader({ item: leader, index })}</View>
              ))
            )}

            <Animated.View entering={FadeInUp.delay(300).duration(400)}>
              <ThemedText type="h3" style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>
                Approved Leaders ({approvedLeaders.length})
              </ThemedText>
            </Animated.View>

            {approvedLeaders.length === 0 ? (
              <Card elevation={1} style={styles.emptyCard}>
                <Feather name="users" size={32} color={theme.textSecondary} />
                <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.sm }}>
                  No approved leaders yet
                </ThemedText>
              </Card>
            ) : (
              approvedLeaders.map((leader, index) => (
                <View key={leader.id}>{renderApprovedLeader({ item: leader, index })}</View>
              ))
            )}
          </>
        }
        contentContainerStyle={[
          styles.content,
          { paddingTop: headerHeight + Spacing.lg, paddingBottom: insets.bottom + 100 },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.link} />
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
  sectionTitle: {
    marginBottom: Spacing.lg,
  },
  leaderCard: {
    marginBottom: Spacing.md,
  },
  leaderInfo: {
    flexDirection: "row",
    marginBottom: Spacing.lg,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.lg,
  },
  leaderDetails: {
    flex: 1,
  },
  leaderMeta: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  metaBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  actionButtons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  approveButton: {
    flex: 1,
  },
  rejectButton: {
    flex: 1,
  },
  approvedCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  approvedInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  emptyCard: {
    alignItems: "center",
    paddingVertical: Spacing["2xl"],
  },
});
