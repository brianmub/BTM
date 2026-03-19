import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Image, Pressable, Linking } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInUp } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { User } from "@/lib/storage";

const SAMPLE_FACILITATOR: User = {
  id: "leader1",
  fullName: "Sarah Johnson",
  phone: "+1234567890",
  email: "sarah.johnson@example.com",
  gender: "female",
  maritalStatus: "married",
  role: "leader",
  isApproved: true,
  createdAt: new Date().toISOString(),
};

const SAMPLE_MEMBERS: User[] = [
  {
    id: "m1",
    fullName: "John Smith",
    phone: "+1234567891",
    email: "john@example.com",
    gender: "male",
    maritalStatus: "married",
    role: "participant",
    isApproved: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "m2",
    fullName: "Emily Davis",
    phone: "+1234567892",
    email: "emily@example.com",
    gender: "female",
    maritalStatus: "unmarried",
    role: "participant",
    isApproved: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "m3",
    fullName: "Michael Chen",
    phone: "+1234567893",
    email: "michael@example.com",
    gender: "male",
    maritalStatus: "married",
    role: "participant",
    isApproved: true,
    createdAt: new Date().toISOString(),
  },
];

export default function MyCellScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { user } = useAuth();
  const [facilitator] = useState<User | null>(SAMPLE_FACILITATOR);
  const [members] = useState<User[]>([...SAMPLE_MEMBERS]);
  const [isAssigned] = useState(true);

  const handleCall = (phone: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(`tel:${phone}`);
  };

  const handleEmail = (email: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(`mailto:${email}`);
  };

  if (!isAssigned) {
    return (
      <ThemedView style={styles.container}>
        <View
          style={[
            styles.emptyContainer,
            {
              paddingTop: headerHeight + Spacing["4xl"],
              paddingBottom: tabBarHeight + Spacing["4xl"],
            },
          ]}
        >
          <Image
            source={require("../../assets/images/empty-cell.png")}
            style={styles.emptyImage}
            resizeMode="contain"
          />
          <ThemedText type="h3" style={styles.emptyTitle}>
            Not Assigned Yet
          </ThemedText>
          <ThemedText
            type="body"
            style={{ color: theme.textSecondary, textAlign: "center" }}
          >
            You haven't been assigned to a cell group yet. Check back after the
            enrollment period closes.
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  const allMembers = user
    ? [user, ...members.filter((m) => m.id !== user.id)]
    : members;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.xl,
        paddingBottom: tabBarHeight + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
    >
      <Animated.View entering={FadeInUp.delay(100).duration(500)}>
        <ThemedText type="h3" style={styles.sectionTitle}>
          Your Facilitator
        </ThemedText>
        {facilitator ? (
          <Card elevation={1} style={styles.facilitatorCard}>
            <View style={styles.facilitatorRow}>
              <Image
                source={require("../../assets/images/avatar-default.png")}
                style={styles.facilitatorAvatar}
              />
              <View style={styles.facilitatorInfo}>
                <ThemedText type="h4">{facilitator.fullName}</ThemedText>
                <ThemedText type="small" style={{ color: theme.link }}>
                  Cell Leader
                </ThemedText>
              </View>
            </View>
            <View style={styles.contactButtons}>
              <Pressable
                onPress={() => handleCall(facilitator.phone)}
                style={[styles.contactButton, { backgroundColor: theme.link }]}
              >
                <Feather name="phone" size={18} color="#FFFFFF" />
                <ThemedText type="small" style={{ color: "#FFFFFF", marginLeft: Spacing.sm }}>
                  Call
                </ThemedText>
              </Pressable>
              <Pressable
                onPress={() => handleEmail(facilitator.email)}
                style={[styles.contactButton, { backgroundColor: theme.accent }]}
              >
                <Feather name="mail" size={18} color="#FFFFFF" />
                <ThemedText type="small" style={{ color: "#FFFFFF", marginLeft: Spacing.sm }}>
                  Email
                </ThemedText>
              </Pressable>
            </View>
          </Card>
        ) : null}
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(200).duration(500)}>
        <View style={styles.membersHeader}>
          <ThemedText type="h3">Cell Members</ThemedText>
          <View style={[styles.countBadge, { backgroundColor: theme.backgroundSecondary }]}>
            <ThemedText type="small" style={{ color: theme.link, fontWeight: "600" }}>
              {allMembers.length}
            </ThemedText>
          </View>
        </View>

        {allMembers.map((member, index) => (
          <Animated.View
            key={member.id}
            entering={FadeInUp.delay(300 + index * 50).duration(400)}
          >
            <View
              style={[
                styles.memberRow,
                { borderBottomColor: theme.border },
                index === allMembers.length - 1 && styles.lastMember,
              ]}
            >
              <Image
                source={require("../../assets/images/avatar-default.png")}
                style={styles.memberAvatar}
              />
              <View style={styles.memberInfo}>
                <View style={styles.memberNameRow}>
                  <ThemedText type="body" style={{ fontWeight: "500" }}>
                    {member.fullName}
                  </ThemedText>
                  {member.id === user?.id ? (
                    <View style={[styles.youBadge, { backgroundColor: theme.link }]}>
                      <ThemedText type="small" style={{ color: "#FFFFFF", fontSize: 10 }}>
                        You
                      </ThemedText>
                    </View>
                  ) : null}
                </View>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  {member.maritalStatus === "married" ? "Married" : "Unmarried"} · {member.gender === "male" ? "Male" : "Female"}
                </ThemedText>
              </View>
            </View>
          </Animated.View>
        ))}
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing["2xl"],
  },
  emptyImage: {
    width: 160,
    height: 160,
    marginBottom: Spacing.xl,
    opacity: 0.8,
  },
  emptyTitle: {
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  sectionTitle: {
    marginBottom: Spacing.lg,
  },
  facilitatorCard: {
    marginBottom: Spacing["2xl"],
  },
  facilitatorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  facilitatorAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: Spacing.lg,
  },
  facilitatorInfo: {
    flex: 1,
  },
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
    borderRadius: BorderRadius.xs,
  },
  membersHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
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
    borderBottomWidth: 1,
  },
  lastMember: {
    borderBottomWidth: 0,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: Spacing.lg,
  },
  memberInfo: {
    flex: 1,
  },
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
});
