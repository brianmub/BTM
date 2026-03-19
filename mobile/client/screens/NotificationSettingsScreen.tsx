import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Switch, Pressable, Platform, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Spacing, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useNotifications } from '@/contexts/NotificationContext';

interface SettingRowProps {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

function SettingRow({ icon, title, description, value, onValueChange, disabled }: SettingRowProps) {
  const { theme } = useTheme();

  const handleChange = (newValue: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onValueChange(newValue);
  };

  return (
    <View style={[styles.settingRow, disabled && styles.disabled]}>
      <View style={[styles.iconContainer, { backgroundColor: theme.primary + '20' }]}>
        <Feather name={icon} size={20} color={theme.primary} />
      </View>
      <View style={styles.settingContent}>
        <ThemedText type="body" style={{ fontWeight: '600' }}>{title}</ThemedText>
        <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: 2 }}>
          {description}
        </ThemedText>
      </View>
      <Switch
        value={value}
        onValueChange={handleChange}
        disabled={disabled}
        trackColor={{ false: theme.textSecondary + '40', true: theme.primary + '80' }}
        thumbColor={value ? theme.primary : theme.backgroundSecondary}
      />
    </View>
  );
}

export default function NotificationSettingsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const { hasPermission, settings, requestPermission, updateSettings } = useNotifications();
  const [requesting, setRequesting] = useState(false);

  const handleRequestPermission = useCallback(async () => {
    setRequesting(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await requestPermission();
    setRequesting(false);
  }, [requestPermission]);

  const handleOpenSettings = async () => {
    if (Platform.OS !== 'web') {
      try {
        await Linking.openSettings();
      } catch (error) {
        console.log('Could not open settings');
      }
    }
  };

  const handleToggle = async (key: keyof typeof settings, value: boolean) => {
    await updateSettings({ [key]: value });
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: headerHeight + Spacing.lg, paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {!hasPermission ? (
          <Animated.View entering={FadeInUp.duration(400)}>
            <Card elevation={1} style={styles.permissionCard}>
              <View style={[styles.permissionIcon, { backgroundColor: theme.warning + '20' }]}>
                <Feather name="bell-off" size={32} color={theme.warning} />
              </View>
              <ThemedText type="h3" style={{ textAlign: 'center', marginTop: Spacing.lg }}>
                Enable Notifications
              </ThemedText>
              <ThemedText
                type="body"
                style={{ color: theme.textSecondary, textAlign: 'center', marginTop: Spacing.sm }}
              >
                Get reminders for upcoming sessions, assignment deadlines, and important updates.
              </ThemedText>
              <Button
                onPress={handleRequestPermission}
                disabled={requesting}
                style={{ marginTop: Spacing.xl }}
              >
                {requesting ? 'Requesting...' : 'Enable Notifications'}
              </Button>
              {Platform.OS !== 'web' ? (
                <Pressable onPress={handleOpenSettings} style={styles.settingsLink}>
                  <ThemedText type="small" style={{ color: theme.link }}>
                    Open System Settings
                  </ThemedText>
                </Pressable>
              ) : null}
            </Card>
          </Animated.View>
        ) : (
          <>
            <Animated.View entering={FadeInUp.duration(400)}>
              <Card elevation={1} style={styles.statusCard}>
                <View style={[styles.statusIcon, { backgroundColor: theme.success + '20' }]}>
                  <Feather name="bell" size={24} color={theme.success} />
                </View>
                <View style={styles.statusText}>
                  <ThemedText type="body" style={{ fontWeight: '600' }}>
                    Notifications Enabled
                  </ThemedText>
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>
                    You'll receive alerts for important updates
                  </ThemedText>
                </View>
              </Card>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(100).duration(400)}>
              <ThemedText type="h4" style={styles.sectionTitle}>
                Master Control
              </ThemedText>
              <Card elevation={1} style={styles.settingsCard}>
                <SettingRow
                  icon="power"
                  title="All Notifications"
                  description="Turn off all notifications at once"
                  value={settings.enabled}
                  onValueChange={(value) => handleToggle('enabled', value)}
                />
              </Card>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(200).duration(400)}>
              <ThemedText type="h4" style={styles.sectionTitle}>
                Notification Types
              </ThemedText>
              <Card elevation={1} style={styles.settingsCard}>
                <SettingRow
                  icon="calendar"
                  title="Session Reminders"
                  description="Get reminded 24 hours before each session"
                  value={settings.sessionReminders}
                  onValueChange={(value) => handleToggle('sessionReminders', value)}
                  disabled={!settings.enabled}
                />
                <View style={[styles.divider, { backgroundColor: theme.backgroundSecondary }]} />
                <SettingRow
                  icon="file-text"
                  title="Assignment Reminders"
                  description="Get reminded 2 days before assignment deadlines"
                  value={settings.assignmentReminders}
                  onValueChange={(value) => handleToggle('assignmentReminders', value)}
                  disabled={!settings.enabled}
                />
                <View style={[styles.divider, { backgroundColor: theme.backgroundSecondary }]} />
                <SettingRow
                  icon="check-circle"
                  title="Attendance Alerts"
                  description="Know when your attendance is confirmed"
                  value={settings.attendanceAlerts}
                  onValueChange={(value) => handleToggle('attendanceAlerts', value)}
                  disabled={!settings.enabled}
                />
                <View style={[styles.divider, { backgroundColor: theme.backgroundSecondary }]} />
                <SettingRow
                  icon="users"
                  title="Cell Updates"
                  description="Cell assignment and group updates"
                  value={settings.cellUpdates}
                  onValueChange={(value) => handleToggle('cellUpdates', value)}
                  disabled={!settings.enabled}
                />
              </Card>
            </Animated.View>
          </>
        )}
      </ScrollView>
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
  permissionCard: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
    paddingHorizontal: Spacing.xl,
  },
  permissionIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsLink: {
    marginTop: Spacing.lg,
    padding: Spacing.sm,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  statusText: {
    flex: 1,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  settingsCard: {
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  disabled: {
    opacity: 0.5,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  settingContent: {
    flex: 1,
    marginRight: Spacing.md,
  },
  divider: {
    height: 1,
    marginHorizontal: Spacing.md,
  },
});
