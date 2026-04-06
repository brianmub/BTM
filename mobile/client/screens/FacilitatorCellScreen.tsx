import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

interface Member {
  id: string;
  first_name: string;
  surname: string;
  email: string;
}

interface Session {
  id: string;
  title: string;
  session_number: number;
  date: string;
  program_id: string;
}

interface AttendanceState {
  present: boolean;
  verified: boolean;
  checkedIn: boolean;
  recordId?: string;
}

// Animated checkbox / toggle
function AttendanceStatusToggle({ 
    checkedIn, 
    verified, 
    onToggle 
}: { 
    checkedIn: boolean; 
    verified: boolean; 
    onToggle: () => void 
}) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePress = () => {
    scale.value = withSpring(0.85, { damping: 10 });
    setTimeout(() => { scale.value = withSpring(1); }, 120);
    Haptics.selectionAsync();
    onToggle();
  };

  // Icon logic:
  // Not checked in -> empty circle
  // Checked in but not verified -> check-circle (outline/low opacity)
  // Verified -> check-circle (solid)
  
  return (
    <Pressable onPress={handlePress} style={styles.toggleContainer}>
      <Animated.View style={[
        styles.statusBadge,
        anim,
        {
          backgroundColor: verified ? theme.success : (checkedIn ? theme.success + "20" : "transparent"),
          borderColor: verified || checkedIn ? theme.success : theme.border,
        },
      ]}>
        {verified ? (
          <Feather name="shield" size={12} color="#fff" />
        ) : checkedIn ? (
          <Feather name="check" size={12} color={theme.success} />
        ) : null}
      </Animated.View>
      <ThemedText type="small" style={{ 
        color: verified ? theme.success : (checkedIn ? theme.success : theme.textSecondary),
        fontWeight: verified || checkedIn ? "700" : "400",
        fontSize: 10,
        marginTop: 2
      }}>
        {verified ? "VERIFIED" : (checkedIn ? "PENDING" : "ABSENT")}
      </ThemedText>
    </Pressable>
  );
}

export default function FacilitatorCellScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [groupName, setGroupName] = useState("");
  const [programId, setProgramId] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  
  // map of userId -> AttendanceState
  const [attendance, setAttendance] = useState<Record<string, AttendanceState>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    try {
      // 1. Find the group this facilitator manages
      const { data: groupData } = await supabase
        .from("program_groups")
        .select("id, name, program_id")
        .or(`facilitator_id.eq.${user.id},second_facilitator_id.eq.${user.id}`)
        .maybeSingle();

      if (!groupData) {
        setGroupId(null);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      setGroupId(groupData.id);
      setGroupName(groupData.name);
      setProgramId(groupData.program_id);

      // 2. Get group members
      const { data: memberData } = await supabase
        .from("group_members")
        .select(`user_id, users (id, first_name, surname, email)`)
        .eq("group_id", groupData.id);

      const memberList: Member[] = (memberData || [])
        .map((m: any) => Array.isArray(m.users) ? m.users[0] : m.users)
        .filter(Boolean);
      setMembers(memberList);

      // 3. Get sessions (Using sessions table from schema)
      const { data: sessionData } = await supabase
        .from("sessions")
        .select("id, name, session_number, session_date, program_id")
        .eq("program_id", groupData.program_id)
        .order("session_number", { ascending: true });

      const sessionList: Session[] = (sessionData || []).map(s => ({
        id: s.id,
        title: s.name,
        session_number: s.session_number,
        date: s.session_date,
        program_id: s.program_id
      }));
      setSessions(sessionList);

      // Default to current or most recent
      const now = new Date();
      const past = sessionList.filter(s => new Date(s.date) <= now);
      const defaultSession = past[past.length - 1] ?? sessionList[0] ?? null;
      setSelectedSession(defaultSession);

      // 4. Load attendance_records
      if (defaultSession && memberList.length > 0) {
        await loadAttendance(defaultSession.id, memberList);
      }
    } catch (err) {
      console.error("FacilitatorCellScreen error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  const loadAttendance = async (sessionId: string, memberList: Member[]) => {
    const { data: attData } = await supabase
      .from("attendance_records")
      .select("id, user_id, status, is_verified, checked_in")
      .eq("session_id", sessionId);

    const attMap: Record<string, AttendanceState> = {};
    memberList.forEach(m => { 
        attMap[m.id] = { present: false, verified: false, checkedIn: false }; 
    });

    (attData || []).forEach((a: any) => {
      attMap[a.user_id] = {
        present: a.status === 'present',
        verified: a.is_verified || false,
        checkedIn: a.checked_in || false,
        recordId: a.id
      };
    });

    setAttendance(attMap);
    setHasChanges(false);
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadData();
    }, [loadData])
  );

  const handleRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    loadData();
  };

  const handleSelectSession = async (session: Session) => {
    setSelectedSession(session);
    setShowPicker(false);
    await loadAttendance(session.id, members);
  };

  const toggleMember = (userId: string) => {
    setAttendance(prev => {
        const current = prev[userId];
        let next: AttendanceState;

        // Sequence:
        // 1. Not here -> Verify (Mark Present + Verified)
        // 2. Pending (Checked in but not verified) -> Verify
        // 3. Verified -> Unverify/Absent
        
        if (current.verified) {
            next = { ...current, present: false, verified: false, checkedIn: false };
        } else {
            next = { ...current, present: true, verified: true, checkedIn: true };
        }

        return { ...prev, [userId]: next };
    });
    setHasChanges(true);
  };

  const verifyCheckedIn = () => {
    setAttendance(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(uid => {
            if (next[uid].checkedIn) {
                next[uid] = { ...next[uid], verified: true, present: true };
            }
        });
        return next;
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!selectedSession || !groupId || !user?.organizationId) return;
    setSaving(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      // Build records to upsert
      const records = members.map(m => {
        const state = attendance[m.id];
        return {
          session_id: selectedSession.id,
          user_id: m.id,
          program_id: programId,
          organization_id: user.organizationId,
          status: state.present ? 'present' : 'absent',
          is_verified: state.verified,
          checked_in: state.checkedIn,
          verified_by: state.verified ? user.id : null,
          verified_at: state.verified ? new Date().toISOString() : null,
          // If they are marked present/verified, ensure timestamps exist
          checked_in_at: state.checkedIn ? (state.recordId ? undefined : new Date().toISOString()) : null,
          entry_time: state.checkedIn ? (state.recordId ? undefined : new Date().toISOString()) : null,
        };
      });

      const { error } = await supabase
        .from("attendance_records")
        .upsert(records, { 
            onConflict: "session_id,user_id",
            ignoreDuplicates: false 
        });

      if (error) throw error;

      setHasChanges(false);
      await loadAttendance(selectedSession.id, members);
      Alert.alert("✅ Synchronized", "Attendance records have been updated and verified.");
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (first: string, last: string) =>
    `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase();

  const verifiedCount = members.filter(m => attendance[m.id]?.verified).length;
  const pendingCount = members.filter(m => attendance[m.id]?.checkedIn && !attendance[m.id]?.verified).length;

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator color={theme.link} size="large" />
      </ThemedView>
    );
  }

  if (!groupId) {
    return (
      <ThemedView style={styles.centered}>
        <View style={[styles.emptyIcon, { backgroundColor: theme.backgroundSecondary }]}>
          <Feather name="users" size={36} color={theme.textSecondary} />
        </View>
        <ThemedText type="h3" style={{ textAlign: "center", marginBottom: Spacing.sm }}>
          No Group Access
        </ThemedText>
        <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "center", maxWidth: 260 }}>
          You don't have facilitator permissions for any active cell group.
        </ThemedText>
      </ThemedView>
    );
  }

  const renderHeader = () => (
    <View>
      <View style={[styles.groupChip, { backgroundColor: theme.link + "08", borderColor: theme.link + "20" }]}>
        <Feather name="briefcase" size={14} color={theme.link} />
        <ThemedText type="body" style={{ color: theme.link, fontWeight: "800", marginLeft: Spacing.sm, fontSize: 13 }}>
          {groupName}
        </ThemedText>
      </View>

      <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
        VALIDATION CONTEXT (SESSIONS)
      </ThemedText>
      <Pressable
        onPress={() => setShowPicker(!showPicker)}
        style={[styles.sessionBtn, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}
      >
        <Feather name="calendar" size={16} color={theme.link} />
        <ThemedText type="body" style={{ flex: 1, marginLeft: Spacing.sm, fontWeight: "700" }}>
          {selectedSession
            ? `S${selectedSession.session_number}: ${selectedSession.title}`
            : "No sessions discovered"}
        </ThemedText>
        <Feather name={showPicker ? "chevron-up" : "chevron-down"} size={18} color={theme.textSecondary} />
      </Pressable>

      {showPicker && (
        <Card elevation={4} style={styles.dropdown}>
          {sessions.map((s) => (
            <Pressable
              key={s.id}
              onPress={() => handleSelectSession(s)}
              style={[
                styles.dropdownItem,
                { borderBottomColor: theme.border },
                s.id === selectedSession?.id && { backgroundColor: theme.link + "10" },
              ]}
            >
              <View style={{ flex: 1 }}>
                <ThemedText type="body" style={{ fontWeight: "700", color: s.id === selectedSession?.id ? theme.link : theme.text }}>
                    {s.title}
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Session {s.session_number} · {new Date(s.date).toLocaleDateString()}
                </ThemedText>
              </View>
              {s.id === selectedSession?.id && (
                <Feather name="check-circle" size={16} color={theme.link} />
              )}
            </Pressable>
          ))}
        </Card>
      )}

      <View style={styles.summaryBar}>
        <View style={[styles.statusChip, { backgroundColor: theme.success + "15" }]}>
          <Feather name="shield" size={12} color={theme.success} />
          <ThemedText type="small" style={{ color: theme.success, marginLeft: 6, fontWeight: "800" }}>
            {verifiedCount} Verified
          </ThemedText>
        </View>
        {pendingCount > 0 && (
          <Pressable 
            onPress={verifyCheckedIn}
            style={[styles.statusChip, { backgroundColor: "#F59E0B15" }]}
          >
            <Feather name="clock" size={12} color="#F59E0B" />
            <ThemedText type="small" style={{ color: "#F59E0B", marginLeft: 6, fontWeight: "800" }}>
                {pendingCount} Pending Verify
            </ThemedText>
          </Pressable>
        )}
      </View>

      <View style={[styles.listHeaderRow, { borderBottomColor: theme.border }]}>
        <ThemedText type="small" style={{ flex: 1, color: theme.textSecondary, fontWeight: "800", textTransform: "uppercase", fontSize: 10, letterSpacing: 1 }}>
          Participant
        </ThemedText>
        <ThemedText type="small" style={{ color: theme.textSecondary, fontWeight: "800", textTransform: "uppercase", fontSize: 10, letterSpacing: 1 }}>
          Terminal Status
        </ThemedText>
      </View>
    </View>
  );

  const renderMember = ({ item, index }: { item: Member; index: number }) => {
    const state = attendance[item.id];
    return (
      <Animated.View entering={FadeInUp.delay(index * 30).duration(350)}>
        <View style={[styles.memberRow, { borderBottomColor: theme.border }]}>
          <View style={[styles.avatarBox, { backgroundColor: state?.verified ? theme.success + "20" : (state?.checkedIn ? "#F59E0B20" : theme.backgroundSecondary) }]}>
            <ThemedText style={{ 
                fontWeight: "900", 
                fontSize: 12, 
                color: state?.verified ? theme.success : (state?.checkedIn ? "#F59E0B" : theme.textSecondary) 
            }}>
              {getInitials(item.first_name, item.surname)}
            </ThemedText>
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText type="body" style={{ fontWeight: "700" }}>
              {item.first_name} {item.surname}
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary, fontSize: 11 }}>{item.email}</ThemedText>
          </View>
          <AttendanceStatusToggle
            checkedIn={!!state?.checkedIn}
            verified={!!state?.verified}
            onToggle={() => toggleMember(item.id)}
          />
        </View>
      </Animated.View>
    );
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <FlatList
        data={members}
        keyExtractor={(item) => item.id}
        renderItem={renderMember}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={() => (
          <View style={styles.centered}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>No members in roster.</ThemedText>
          </View>
        )}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: tabBarHeight + 100,
          paddingHorizontal: Spacing.lg,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.link} />
        }
      />

      {hasChanges && (
        <Pressable
          onPress={handleSave}
          disabled={saving}
          style={[styles.floatingSave, { bottom: tabBarHeight + Spacing.lg, backgroundColor: theme.link }]}
        >
          {saving
            ? <ActivityIndicator color="#fff" size="small" />
            : <>
                <Feather name="cloud-lightning" size={18} color="#fff" />
                <ThemedText style={{ color: "#fff", fontWeight: "900", marginLeft: Spacing.sm, fontSize: 14, letterSpacing: 0.5 }}>
                  SYNC TO LEDGER
                </ThemedText>
              </>
          }
        </Pressable>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["4xl"],
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg
  },
  groupChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignSelf: "flex-start",
    marginBottom: Spacing.xl,
  },
  label: {
    fontWeight: "800",
    fontSize: 9,
    letterSpacing: 1.5,
    marginBottom: Spacing.xs,
  },
  sessionBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  dropdown: {
    position: "absolute",
    top: 130,
    left: 0,
    right: 0,
    zIndex: 100,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    borderWidth: 1,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  summaryBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
    flexWrap: "wrap",
  },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  listHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    marginBottom: Spacing.sm,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
  },
  avatarBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleContainer: {
    alignItems: "center",
    width: 70,
  },
  statusBadge: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  floatingSave: {
    position: "absolute",
    left: Spacing.lg,
    right: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl,
    borderRadius: BorderRadius.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
});
