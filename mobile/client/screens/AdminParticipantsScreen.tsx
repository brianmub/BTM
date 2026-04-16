import React, { useState, useCallback } from "react";
import { View, StyleSheet, FlatList, RefreshControl, TextInput, Pressable } from "react-native";
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
import { storage, User, Enrollment, AttendanceRecord, Program } from "@/lib/storage";

interface ParticipantWithStats {
  user: User;
  enrollments: number;
  programNames: string[];
  sessionsAttended: number;
  graduationEligible: boolean;
}

export default function AdminParticipantsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const [participants, setParticipants] = useState<ParticipantWithStats[]>([]);
  const [filteredParticipants, setFilteredParticipants] = useState<ParticipantWithStats[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const calculateAge = (dob: string | undefined) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const loadData = useCallback(async () => {
    const [users, enrollments, attendance, programs] = await Promise.all([
      storage.getAllUsers(),
      storage.getEnrollments(),
      storage.getAttendance(),
      storage.getPrograms(),
    ]);

    const participantUsers = users.filter(u => u.role === "participant");
    const confirmedAttendance = attendance.filter(a => a.confirmedByLeader);

    const participantsWithStats: ParticipantWithStats[] = participantUsers.map(user => {
      const userEnrollments = enrollments.filter(e => e.userId === user.id);
      const userAttendance = confirmedAttendance.filter(a => a.userId === user.id);
      const programNames = userEnrollments
        .map(e => programs.find(p => p.id === e.programId)?.name || "Unknown")
        .slice(0, 2);

      return {
        user,
        enrollments: userEnrollments.length,
        programNames,
        sessionsAttended: userAttendance.length,
        graduationEligible: userAttendance.length >= 5,
      };
    });

    setParticipants(participantsWithStats.sort((a, b) => a.user.fullName.localeCompare(b.user.fullName)));
    setFilteredParticipants(participantsWithStats);
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

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (text.trim() === "") {
      setFilteredParticipants(participants);
    } else {
      const query = text.toLowerCase();
      setFilteredParticipants(
        participants.filter(
          p =>
            p.user.fullName.toLowerCase().includes(query) ||
            p.user.email.toLowerCase().includes(query)
        )
      );
    }
  };

  const renderParticipant = ({ item, index }: { item: ParticipantWithStats; index: number }) => (
    <Animated.View entering={FadeInUp.delay(index * 30).duration(300)}>
      <Card elevation={1} style={styles.participantCard}>
        <View style={styles.cardContent}>
          <View style={[styles.avatar, { backgroundColor: theme.link + "20" }]}>
            <ThemedText type="h4" style={{ color: theme.link }}>
              {item.user.fullName.charAt(0).toUpperCase()}
            </ThemedText>
          </View>
          <View style={styles.info}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <ThemedText type="h4">{item.user.fullName}</ThemedText>
              <ThemedText type="small" style={{ color: theme.link, fontWeight: '700', marginLeft: Spacing.sm }}>
                {calculateAge(item.user.dob) ? `${calculateAge(item.user.dob)}Y` : ''} 
                {item.user.gender ? ` | ${item.user.gender.toUpperCase()}` : ''}
              </ThemedText>
            </View>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {item.user.email}
            </ThemedText>
            <View style={styles.programsRow}>
              {item.programNames.map((name, i) => (
                <View
                  key={i}
                  style={[styles.programTag, { backgroundColor: theme.backgroundSecondary }]}
                >
                  <ThemedText type="small" style={{ color: theme.text }}>{name}</ThemedText>
                </View>
              ))}
              {item.enrollments > 2 ? (
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  +{item.enrollments - 2} more
                </ThemedText>
              ) : null}
            </View>
          </View>
          <View style={styles.statsColumn}>
            <View style={styles.statBadge}>
              <Feather name="check-circle" size={14} color={theme.success} />
              <ThemedText type="small" style={{ marginLeft: 4 }}>
                {item.sessionsAttended}
              </ThemedText>
            </View>
            {item.graduationEligible ? (
              <View style={[styles.eligibleBadge, { backgroundColor: theme.success + "20" }]}>
                <Feather name="award" size={12} color={theme.success} />
              </View>
            ) : null}
          </View>
        </View>
      </Card>
    </Animated.View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIcon, { backgroundColor: theme.backgroundSecondary }]}>
        <Feather name="users" size={48} color={theme.textSecondary} />
      </View>
      <ThemedText type="h3" style={{ marginTop: Spacing.lg }}>
        {searchQuery ? "No Results" : "No Participants"}
      </ThemedText>
      <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "center", marginTop: Spacing.sm }}>
        {searchQuery
          ? "Try a different search term"
          : "Participants will appear here once enrolled"}
      </ThemedText>
    </View>
  );

  const eligibleCount = participants.filter(p => p.graduationEligible).length;

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.searchContainer, { paddingTop: headerHeight + Spacing.lg }]}>
        <View style={[styles.searchBar, { backgroundColor: theme.backgroundSecondary }]}>
          <Feather name="search" size={20} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search by name or email..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 ? (
            <Pressable onPress={() => handleSearch("")}>
              <Feather name="x" size={20} color={theme.textSecondary} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {participants.length > 0 ? (
        <View style={[styles.statsBar, { backgroundColor: theme.backgroundSecondary }]}>
          <View style={styles.statItem}>
            <ThemedText type="h4" style={{ color: theme.link }}>{participants.length}</ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>Total</ThemedText>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
          <View style={styles.statItem}>
            <ThemedText type="h4" style={{ color: theme.success }}>{eligibleCount}</ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>Grad Eligible</ThemedText>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
          <View style={styles.statItem}>
            <ThemedText type="h4" style={{ color: theme.accent }}>{filteredParticipants.length}</ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>Showing</ThemedText>
          </View>
        </View>
      ) : null}

      <FlatList
        data={filteredParticipants}
        renderItem={renderParticipant}
        keyExtractor={(item) => item.user.id}
        contentContainerStyle={{
          paddingTop: Spacing.md,
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
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: 16,
  },
  statsBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: Spacing.md,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  statItem: {
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    height: 30,
  },
  participantCard: {
    marginBottom: Spacing.md,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  programsRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: Spacing.xs,
    gap: Spacing.xs,
  },
  programTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  statsColumn: {
    alignItems: "flex-end",
    gap: Spacing.xs,
  },
  statBadge: {
    flexDirection: "row",
    alignItems: "center",
  },
  eligibleBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
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
