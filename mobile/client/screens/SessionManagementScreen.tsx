import React, { useState, useCallback } from "react";
import { View, StyleSheet, FlatList, RefreshControl, Modal, TextInput, Pressable } from "react-native";
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
import { storage, Session, Program } from "@/lib/storage";
import { useAuth } from "@/contexts/AuthContext";

interface SessionWithProgram extends Session {
  programName: string;
}

export default function SessionManagementScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionWithProgram[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedSession, setSelectedSession] = useState<SessionWithProgram | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editOverview, setEditOverview] = useState("");
  const [editTopics, setEditTopics] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const loadData = useCallback(async () => {
    if (!user?.organizationId) return;
    const [allSessions, programs] = await Promise.all([
      storage.getSessions(user.organizationId),
      storage.getPrograms(user.organizationId),
    ]);

    const sessionsWithProgram: SessionWithProgram[] = allSessions.map(session => ({
      ...session,
      programName: programs.find(p => p.id === session.programId)?.name || "Unknown Program",
    }));

    setSessions(
      sessionsWithProgram.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    );
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

  const handleEditSession = (session: SessionWithProgram) => {
    setSelectedSession(session);
    setEditOverview(session.overview || "");
    setEditTopics(session.topics?.join("\n") || "");
    setIsEditModalVisible(true);
  };

  const handleSaveSession = async () => {
    if (!selectedSession) return;

    setIsSaving(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const updatedSession: Session = {
      ...selectedSession,
      overview: editOverview.trim(),
      topics: editTopics.split("\n").map(t => t.trim()).filter(t => t.length > 0),
    };

    await storage.updateSession(updatedSession);
    await loadData();

    setIsSaving(false);
    setIsEditModalVisible(false);
    setSelectedSession(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const isPast = (dateString: string) => new Date(dateString) < new Date();

  const renderSession = ({ item, index }: { item: SessionWithProgram; index: number }) => {
    const past = isPast(item.date);

    return (
      <Animated.View entering={FadeInUp.delay(index * 40).duration(400)}>
        <Card
          elevation={1}
          style={past ? { ...styles.sessionCard, opacity: 0.7 } : styles.sessionCard}
          onPress={() => handleEditSession(item)}
        >
          <View style={styles.cardHeader}>
            <View
              style={[
                styles.sessionNumber,
                { backgroundColor: past ? theme.textSecondary + "20" : theme.link + "20" },
              ]}
            >
              <ThemedText
                type="h4"
                style={{ color: past ? theme.textSecondary : theme.link }}
              >
                {item.sessionNumber}
              </ThemedText>
            </View>
            <View style={styles.sessionInfo}>
              <ThemedText type="h4">{item.title}</ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {item.programName}
              </ThemedText>
            </View>
            <View style={styles.dateContainer}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {formatDate(item.date)}
              </ThemedText>
              {past ? (
                <View style={[styles.pastBadge, { backgroundColor: theme.textSecondary + "20" }]}>
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>Past</ThemedText>
                </View>
              ) : null}
            </View>
          </View>

          {item.overview ? (
            <ThemedText
              type="body"
              style={{ color: theme.textSecondary, marginTop: Spacing.md }}
              numberOfLines={2}
            >
              {item.overview}
            </ThemedText>
          ) : null}

          {item.topics && item.topics.length > 0 ? (
            <View style={styles.topicsRow}>
              <Feather name="list" size={14} color={theme.textSecondary} />
              <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.xs }}>
                {item.topics.length} topic{item.topics.length !== 1 ? "s" : ""}
              </ThemedText>
            </View>
          ) : null}

          <View style={styles.editHint}>
            <Feather name="edit-2" size={14} color={theme.link} />
            <ThemedText type="small" style={{ color: theme.link, marginLeft: Spacing.xs }}>
              Tap to edit
            </ThemedText>
          </View>
        </Card>
      </Animated.View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIcon, { backgroundColor: theme.backgroundSecondary }]}>
        <Feather name="calendar" size={48} color={theme.textSecondary} />
      </View>
      <ThemedText type="h3" style={{ marginTop: Spacing.lg }}>
        No Sessions
      </ThemedText>
      <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "center", marginTop: Spacing.sm }}>
        Sessions will appear here once created
      </ThemedText>
    </View>
  );

  const upcomingCount = sessions.filter(s => !isPast(s.date)).length;

  return (
    <ThemedView style={styles.container}>
      {sessions.length > 0 ? (
        <View style={[styles.headerStats, { marginTop: headerHeight }]}>
          <View style={[styles.statPill, { backgroundColor: theme.link + "20" }]}>
            <ThemedText type="body" style={{ color: theme.link, fontWeight: "600" }}>
              {sessions.length} total
            </ThemedText>
          </View>
          <View style={[styles.statPill, { backgroundColor: theme.success + "20" }]}>
            <ThemedText type="body" style={{ color: theme.success, fontWeight: "600" }}>
              {upcomingCount} upcoming
            </ThemedText>
          </View>
        </View>
      ) : null}

      <FlatList
        data={sessions}
        renderItem={renderSession}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingTop: sessions.length > 0 ? Spacing.md : headerHeight + Spacing.xl,
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

      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.backgroundRoot }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Pressable
              onPress={() => setIsEditModalVisible(false)}
              style={styles.closeButton}
            >
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
            <ThemedText type="h4" style={{ flex: 1, textAlign: "center" }}>
              Edit Session
            </ThemedText>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.modalContent}>
            {selectedSession ? (
              <>
                <View style={[styles.sessionBanner, { backgroundColor: theme.link + "10" }]}>
                  <ThemedText type="h3">{selectedSession.title}</ThemedText>
                  <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.xs }}>
                    Session {selectedSession.sessionNumber} · {formatDate(selectedSession.date)}
                  </ThemedText>
                </View>

                <ThemedText type="h4" style={styles.inputLabel}>
                  Overview
                </ThemedText>
                <TextInput
                  style={[
                    styles.textArea,
                    {
                      backgroundColor: theme.backgroundSecondary,
                      borderColor: theme.border,
                      color: theme.text,
                    },
                  ]}
                  placeholder="Enter session overview..."
                  placeholderTextColor={theme.textSecondary}
                  value={editOverview}
                  onChangeText={setEditOverview}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />

                <ThemedText type="h4" style={styles.inputLabel}>
                  Topics Covered (one per line)
                </ThemedText>
                <TextInput
                  style={[
                    styles.textArea,
                    {
                      backgroundColor: theme.backgroundSecondary,
                      borderColor: theme.border,
                      color: theme.text,
                    },
                  ]}
                  placeholder="Enter topics, one per line..."
                  placeholderTextColor={theme.textSecondary}
                  value={editTopics}
                  onChangeText={setEditTopics}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />

                <Button
                  onPress={handleSaveSession}
                  disabled={isSaving}
                  style={styles.saveButton}
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerStats: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.md,
  },
  statPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  sessionCard: {
    marginBottom: Spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  sessionNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  sessionInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  dateContainer: {
    alignItems: "flex-end",
  },
  pastBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.xs,
  },
  topicsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  editHint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: Spacing.md,
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
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholder: {
    width: 40,
  },
  modalContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  sessionBanner: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
  },
  inputLabel: {
    marginBottom: Spacing.sm,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
    minHeight: 100,
    marginBottom: Spacing.lg,
  },
  saveButton: {
    marginTop: Spacing.md,
  },
});
