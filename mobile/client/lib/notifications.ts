// expo-notifications is not fully supported in Expo Go.
// All notification calls are stubbed to no-ops here.
// When building a standalone/production app re-enable the real implementation.

import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATION_SETTINGS_KEY = '@btm_notification_settings';

export interface NotificationSettings {
  enabled: boolean;
  sessionReminders: boolean;
  assignmentReminders: boolean;
  attendanceAlerts: boolean;
  cellUpdates: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: false, // disabled by default in Expo Go
  sessionReminders: false,
  assignmentReminders: false,
  attendanceAlerts: false,
  cellUpdates: false,
};

// No-op: expo-notifications handler skipped in Expo Go
// Notifications.setNotificationHandler({ ... });

export const notificationService = {
  async requestPermissions(): Promise<boolean> {
    // Stubbed – expo-notifications not supported in Expo Go
    return false;
  },

  async getSettings(): Promise<NotificationSettings> {
    try {
      const stored = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
      return DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  async saveSettings(settings: NotificationSettings): Promise<void> {
    await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
  },

  async scheduleSessionReminder(
    _sessionId: string,
    _sessionTitle: string,
    _sessionDate: Date,
    _programName: string
  ): Promise<string | null> {
    // Stubbed – expo-notifications not supported in Expo Go
    return null;
  },

  async scheduleAssignmentReminder(
    _assignmentId: string,
    _assignmentTitle: string,
    _dueDate: Date,
    _programName: string
  ): Promise<string | null> {
    // Stubbed – expo-notifications not supported in Expo Go
    return null;
  },

  async sendLocalNotification(
    _title: string,
    _body: string,
    _data?: Record<string, unknown>
  ): Promise<string | null> {
    // Stubbed – expo-notifications not supported in Expo Go
    return null;
  },

  async notifyCellAssignment(_cellName: string, _leaderName: string, _programName: string): Promise<void> {
    // Stubbed
  },

  async notifyAttendanceConfirmed(_sessionTitle: string): Promise<void> {
    // Stubbed
  },

  async notifyAssignmentConfirmed(_assignmentTitle: string): Promise<void> {
    // Stubbed
  },

  async notifyLeaderApproved(): Promise<void> {
    // Stubbed
  },

  async notifyPaymentRecorded(_amount: number, _programName: string): Promise<void> {
    // Stubbed
  },

  async notifyGraduationEligible(_programName: string): Promise<void> {
    // Stubbed
  },

  async cancelNotification(_notificationId: string): Promise<void> {
    // Stubbed
  },

  async cancelAllNotifications(): Promise<void> {
    // Stubbed
  },

  async getBadgeCount(): Promise<number> {
    return 0;
  },

  async setBadgeCount(_count: number): Promise<void> {
    // Stubbed
  },

  async clearBadge(): Promise<void> {
    // Stubbed
  },
};
