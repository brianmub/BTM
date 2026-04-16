import React, { useState } from "react";
import { View, StyleSheet, Image, Pressable, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

interface SettingsItem {
  id: string;
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle?: string;
  onPress: () => void;
  destructive?: boolean;
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme } = useTheme();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const getRoleLabel = () => {
    const role = user?.role?.toLowerCase();
    switch (role) {
      case "participant":
        return "Participant";
      case "leader":
        return "Cell Leader";
      case "facilitator":
        return "Facilitator";
      case "admin":
        return "Administrator";
      case "sysadmin":
        return "SysAdmin";
      default:
        return user?.role || "User";
    }
  };

  const settingsItems: SettingsItem[] = [
    {
      id: "account",
      icon: "user",
      title: "Account Settings",
      subtitle: "Manage your profile information",
      onPress: () => navigation.navigate("AccountSettings"),
    },
    {
      id: "notifications",
      icon: "bell",
      title: "Notifications",
      subtitle: "Configure notification preferences",
      onPress: () => navigation.navigate("NotificationSettings"),
    },
    {
      id: "payments",
      icon: "credit-card",
      title: "Payment History",
      subtitle: "View your session payments",
      onPress: () => navigation.navigate("PaymentHistory"),
    },
    {
      id: "help",
      icon: "help-circle",
      title: "Help & Support",
      subtitle: "Get help with using the app",
      onPress: () => navigation.navigate("HelpSupport"),
    },
    {
      id: "about",
      icon: "info",
      title: "About",
      subtitle: "App version and information",
      onPress: () => navigation.navigate("About"),
    },
    {
      id: "logout",
      icon: "log-out",
      title: "Sign Out",
      onPress: handleLogout,
      destructive: true,
    },
  ];

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.xl,
        paddingBottom: tabBarHeight + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
    >
      <View style={styles.profileHeader}>
        <ThemedText type="h2" style={styles.name}>
          {user?.fullName || "User"}
        </ThemedText>
        <View style={[styles.roleBadge, { backgroundColor: theme.link + "20" }]}>
          <ThemedText type="small" style={{ color: theme.link, fontWeight: "600" }}>
            {getRoleLabel()}
          </ThemedText>
        </View>
        {user?.role === "leader" && !user.isApproved ? (
          <View style={[styles.pendingBadge, { backgroundColor: theme.warning + "20" }]}>
            <Feather name="clock" size={14} color={theme.warning} />
            <ThemedText type="small" style={{ color: theme.warning, marginLeft: Spacing.xs }}>
              Pending Approval
            </ThemedText>
          </View>
        ) : null}
      </View>

      <Card elevation={1} style={styles.infoCard}>
        <View style={styles.infoRow}>
          <View style={[styles.infoIcon, { backgroundColor: theme.backgroundSecondary }]}>
            <Feather name="mail" size={16} color={theme.textSecondary} />
          </View>
          <View style={styles.infoContent}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Email
            </ThemedText>
            <ThemedText type="body">{user?.email || "-"}</ThemedText>
          </View>
        </View>
        <View style={[styles.infoRow, { borderTopColor: theme.border, borderTopWidth: 1 }]}>
          <View style={[styles.infoIcon, { backgroundColor: theme.backgroundSecondary }]}>
            <Feather name="phone" size={16} color={theme.textSecondary} />
          </View>
          <View style={styles.infoContent}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Phone
            </ThemedText>
            <ThemedText type="body">{user?.phone || "-"}</ThemedText>
          </View>
        </View>
        <View style={[styles.infoRow, { borderTopColor: theme.border, borderTopWidth: 1 }]}>
          <View style={[styles.infoIcon, { backgroundColor: theme.backgroundSecondary }]}>
            <Feather name="home" size={16} color={theme.textSecondary} />
          </View>
          <View style={styles.infoContent}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Church
            </ThemedText>
            <ThemedText type="body">{user?.churchName || "-"}</ThemedText>
          </View>
        </View>
        <View style={[styles.infoRow, { borderTopColor: theme.border, borderTopWidth: 1 }]}>
          <View style={[styles.infoIcon, { backgroundColor: theme.backgroundSecondary }]}>
            <Feather name="map" size={16} color={theme.textSecondary} />
          </View>
          <View style={styles.infoContent}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Address
            </ThemedText>
            <ThemedText type="body">{user?.residentialAddress || "-"}</ThemedText>
          </View>
        </View>
        <View style={[styles.infoRow, { borderTopColor: theme.border, borderTopWidth: 1 }]}>
          <View style={[styles.infoIcon, { backgroundColor: theme.backgroundSecondary }]}>
            <Feather name="globe" size={16} color={theme.textSecondary} />
          </View>
          <View style={styles.infoContent}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Country
            </ThemedText>
            <ThemedText type="body">{user?.country || "-"}</ThemedText>
          </View>
        </View>
        <View style={[styles.infoRow, { borderTopColor: theme.border, borderTopWidth: 1 }]}>
          <View style={[styles.infoIcon, { backgroundColor: theme.backgroundSecondary }]}>
            <Feather name="map-pin" size={16} color={theme.textSecondary} />
          </View>
          <View style={styles.infoContent}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              City / Town
            </ThemedText>
            <ThemedText type="body">{user?.cityTown || "-"}</ThemedText>
          </View>
        </View>
      </Card>

      <ThemedText type="h4" style={styles.sectionTitle}>
        Settings
      </ThemedText>

      <Card elevation={1} style={styles.settingsCard}>
        {settingsItems.map((item, index) => (
          <Pressable
            key={item.id}
            onPress={() => {
              Haptics.selectionAsync();
              item.onPress();
            }}
            style={({ pressed }) => [
              styles.settingsItem,
              index > 0 && { borderTopColor: theme.border, borderTopWidth: 1 },
              pressed && { opacity: 0.7 },
            ]}
          >
            <View
              style={[
                styles.settingsIcon,
                {
                  backgroundColor: item.destructive
                    ? theme.error + "20"
                    : theme.backgroundSecondary,
                },
              ]}
            >
              <Feather
                name={item.icon}
                size={18}
                color={item.destructive ? theme.error : theme.textSecondary}
              />
            </View>
            <View style={styles.settingsContent}>
              <ThemedText
                type="body"
                style={[
                  { fontWeight: "500" },
                  item.destructive && { color: theme.error },
                ]}
              >
                {item.title}
              </ThemedText>
              {item.subtitle ? (
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  {item.subtitle}
                </ThemedText>
              ) : null}
            </View>
            {!item.destructive ? (
              <Feather name="chevron-right" size={20} color={theme.textSecondary} />
            ) : null}
          </Pressable>
        ))}
      </Card>

      <ThemedText
        type="small"
        style={{ color: theme.textSecondary, textAlign: "center", marginTop: Spacing.xl }}
      >
        BTM v1.0.0
      </ThemedText>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: Spacing.lg,
  },
  name: {
    marginBottom: Spacing.sm,
  },
  roleBadge: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
  },
  pendingBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.sm,
  },
  infoCard: {
    padding: 0,
    overflow: "hidden",
    marginBottom: Spacing["2xl"],
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  sectionTitle: {
    marginBottom: Spacing.lg,
  },
  settingsCard: {
    padding: 0,
    overflow: "hidden",
  },
  settingsItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
  },
  settingsIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  settingsContent: {
    flex: 1,
  },
});
