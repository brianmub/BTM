import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, ScrollView, Pressable, Linking, ActivityIndicator, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInUp } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useFocusEffect } from "@react-navigation/native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

interface CellGroup {
  id: string;
  name: string;
  description: string;
  max_capacity: number;
}

interface Member {
  id: string;
  first_name: string;
  surname: string;
  email: string;
  role: string;
}

interface Facilitator {
  id: string;
  first_name: string;
  surname: string;
  email: string;
  phone?: string;
}

export default function MyCellScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cellGroup, setCellGroup] = useState<CellGroup | null>(null);
  const [facilitator, setFacilitator] = useState<Facilitator | null>(null);
  const [members, setMembers] = useState<Member[]>([]);

  const loadCellData = useCallback(async () => {
    if (!user?.id) return;

    try {
      // 1. Find the groups this user belongs to
      const { data: memberships, error: memError } = await supabase
        .from("group_members")
        .select(`
          group_id,
          group:program_groups (
            id,
            name,
            description,
            max_capacity,
            facilitator_id
          )
        `)
        .eq("user_id", user.id);

      if (memError || !memberships || memberships.length === 0) {
        setCellGroup(null);
        setFacilitator(null);
        setMembers([]);
        return;
      }

      // For now, we take the FIRST group. In the future, we could add a picker.
      const membership = memberships[0];
      const group = Array.isArray(membership.group)
        ? membership.group[0]
        : membership.group;

      if (!group) return;

      setCellGroup({
        id: group.id,
        name: group.name,
        description: group.description,
        max_capacity: group.max_capacity,
      });

      // 2. Fetch facilitator info
      if (group.facilitator_id) {
        const { data: facData } = await supabase
          .from("users")
          .select("id, first_name, surname, email, phone")
          .eq("id", group.facilitator_id)
          .maybeSingle();

        setFacilitator(facData ?? null);
      } else {
        setFacilitator(null);
      }

      // 3. Fetch all members in the group
      const { data: membersData } = await supabase
        .from("group_members")
        .select(`
          user_id,
          users (id, first_name, surname, email, role)
        `)
        .eq("group_id", group.id);

      const memberList = (membersData || [])
        .map((m: any) => (Array.isArray(m.users) ? m.users[0] : m.users))
        .filter(Boolean);

      setMembers(memberList);
    } catch (err) {
      console.error("Error loading cell data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadCellData();
    }, [loadCellData])
  );

  const handleRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    loadCellData();
  };

  const handleCall = (phone: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(`tel:${phone}`);
  };

  const handleEmail = (email: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(`mailto:${email}`);
  };

  const getInitials = (first: string, last: string) =>
    `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase();

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator color={theme.link} size="large" />
      </ThemedView>
    );
  }

  if (!cellGroup) {
    return (
      <ThemedView style={styles.centered}>
        <View style={[styles.emptyIcon, { backgroundColor: theme.backgroundSecondary }]}>
          <Feather name="users" size={36} color={theme.textSecondary} />
        </View>
        <ThemedText type="h3" style={styles.emptyTitle}>
          No Cell Group Yet
        </ThemedText>
        <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "center", maxWidth: 260 }}>
          You haven't been assigned to a cell group yet. Your program admin will assign you soon.
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.xl,
        paddingBottom: tabBarHeight + Spacing["2xl"],
        paddingHorizontal: Spacing.lg,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.link} />
      }
    >
      {/* Group Header Card */}
      <Animated.View entering={FadeInUp.delay(50).duration(400)}>
        <Card elevation={2} style={[styles.groupCard, { borderColor: theme.link + "30", borderWidth: 1 }]}>
          <View style={[styles.groupIcon, { backgroundColor: theme.link + "15" }]}>
            <Feather name="users" size={22} color={theme.link} />
          </View>
          <ThemedText type="h2" style={{ marginTop: Spacing.md }}>{cellGroup.name}</ThemedText>
          {cellGroup.description ? (
            <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.xs }}>
              {cellGroup.description}
            </ThemedText>
          ) : null}
          <View style={styles.statsRow}>
            <View style={[styles.statChip, { backgroundColor: theme.backgroundSecondary }]}>
              <Feather name="users" size={12} color={theme.link} />
              <ThemedText type="small" style={{ color: theme.link, marginLeft: Spacing.xs, fontWeight: "700" }}>
                {members.length} Members
              </ThemedText>
            </View>
            {cellGroup.max_capacity > 0 && (
              <View style={[styles.statChip, { backgroundColor: theme.backgroundSecondary }]}>
                <Feather name="bar-chart-2" size={12} color={theme.textSecondary} />
                <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.xs }}>
                  Capacity: {cellGroup.max_capacity}
                </ThemedText>
              </View>
            )}
          </View>
        </Card>
      </Animated.View>

      {/* Facilitator Section */}
      <Animated.View entering={FadeInUp.delay(150).duration(400)}>
        <ThemedText type="h3" style={styles.sectionTitle}>Your Facilitator</ThemedText>
        {facilitator ? (
          <Card elevation={1} style={styles.facilitatorCard}>
            <View style={styles.facilitatorRow}>
              <View style={[styles.avatar, { backgroundColor: theme.link + "20" }]}>
                <ThemedText type="body" style={{ color: theme.link, fontWeight: "800" }}>
                  {getInitials(facilitator.first_name, facilitator.surname)}
                </ThemedText>
              </View>
              <View style={styles.facilitatorInfo}>
                <ThemedText type="h4">{facilitator.first_name} {facilitator.surname}</ThemedText>
                <ThemedText type="small" style={{ color: theme.link }}>Cell Facilitator</ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: 2 }}>{facilitator.email}</ThemedText>
              </View>
            </View>
            <View style={styles.contactButtons}>
              {facilitator.phone && (
                <Pressable
                  onPress={() => handleCall(facilitator.phone!)}
                  style={[styles.contactButton, { backgroundColor: theme.link }]}
                >
                  <Feather name="phone" size={16} color="#FFFFFF" />
                  <ThemedText type="small" style={{ color: "#FFFFFF", marginLeft: Spacing.sm, fontWeight: "700" }}>
                    Call
                  </ThemedText>
                </Pressable>
              )}
              <Pressable
                onPress={() => handleEmail(facilitator.email)}
                style={[styles.contactButton, { backgroundColor: theme.accent ?? theme.link + "99" }]}
              >
                <Feather name="mail" size={16} color="#FFFFFF" />
                <ThemedText type="small" style={{ color: "#FFFFFF", marginLeft: Spacing.sm, fontWeight: "700" }}>
                  Email
                </ThemedText>
              </Pressable>
            </View>
          </Card>
        ) : (
          <Card elevation={1} style={styles.emptyCard}>
            <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: "center" }}>
              No facilitator assigned yet
            </ThemedText>
          </Card>
        )}
      </Animated.View>

      {/* Members Section */}
      <Animated.View entering={FadeInUp.delay(250).duration(400)}>
        <View style={styles.membersHeader}>
          <ThemedText type="h3">Cell Members</ThemedText>
          <View style={[styles.countBadge, { backgroundColor: theme.link + "20" }]}>
            <ThemedText type="small" style={{ color: theme.link, fontWeight: "700" }}>
              {members.length}
            </ThemedText>
          </View>
        </View>

        <Card elevation={1}>
          {members.length === 0 ? (
            <View style={styles.emptyCard}>
              <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: "center" }}>
                No members in this group yet
              </ThemedText>
            </View>
          ) : (
            members.map((member, index) => {
              const isMe = member.id === user?.id;
              return (
                <Animated.View
                  key={member.id}
                  entering={FadeInUp.delay(300 + index * 40).duration(350)}
                >
                  <View
                    style={[
                      styles.memberRow,
                      { borderBottomColor: theme.border },
                      index === members.length - 1 && styles.lastMember,
                    ]}
                  >
                    <View style={[
                      styles.memberAvatar,
                      { backgroundColor: isMe ? theme.link + "20" : theme.backgroundSecondary }
                    ]}>
                      <ThemedText type="small" style={{
                        fontWeight: "800",
                        color: isMe ? theme.link : theme.textSecondary,
                        fontSize: 13
                      }}>
                        {getInitials(member.first_name, member.surname)}
                      </ThemedText>
                    </View>
                    <View style={styles.memberInfo}>
                      <View style={styles.memberNameRow}>
                        <ThemedText type="body" style={{ fontWeight: "600" }}>
                          {member.first_name} {member.surname}
                        </ThemedText>
                        {isMe && (
                          <View style={[styles.youBadge, { backgroundColor: theme.link }]}>
                            <ThemedText type="small" style={{ color: "#FFFFFF", fontSize: 9, fontWeight: "800" }}>
                              You
                            </ThemedText>
                          </View>
                        )}
                      </View>
                      <ThemedText type="small" style={{ color: theme.textSecondary }}>
                        {member.email}
                      </ThemedText>
                    </View>
                  </View>
                </Animated.View>
              );
            })
          )}
        </Card>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing["2xl"],
    gap: Spacing.lg,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  groupCard: {
    marginBottom: Spacing["2xl"],
    padding: Spacing.xl,
  },
  groupIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    flexWrap: "wrap",
  },
  statChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  sectionTitle: {
    marginBottom: Spacing.lg,
    marginTop: Spacing.xl,
  },
  facilitatorCard: {
    marginBottom: Spacing.xl,
  },
  facilitatorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.lg,
  },
  facilitatorInfo: { flex: 1 },
  contactButtons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  contactButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  membersHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
    marginTop: Spacing.xl,
  },
  countBadge: {
    marginLeft: Spacing.sm,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
  },
  lastMember: { borderBottomWidth: 0 },
  memberAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.lg,
  },
  memberInfo: { flex: 1 },
  memberNameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  youBadge: {
    marginLeft: Spacing.sm,
    paddingVertical: 2,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  emptyCard: {
    paddingVertical: Spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
});
