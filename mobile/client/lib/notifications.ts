import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
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
  enabled: true,
  sessionReminders: true,
  assignmentReminders: true,
  attendanceAlerts: true,
  cellUpdates: true,
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const notificationService = {
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') {
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
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
    sessionId: string,
    sessionTitle: string,
    sessionDate: Date,
    programName: string
  ): Promise<string | null> {
    const settings = await this.getSettings();
    if (!settings.enabled || !settings.sessionReminders) return null;

    const reminderDate = new Date(sessionDate);
    reminderDate.setHours(reminderDate.getHours() - 24);

    if (reminderDate <= new Date()) return null;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Session Tomorrow',
        body: `${sessionTitle} for ${programName} is tomorrow. Don't forget to attend!`,
        data: { type: 'session_reminder', sessionId },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: reminderDate },
    });

    return id;
  },

  async scheduleAssignmentReminder(
    assignmentId: string,
    assignmentTitle: string,
    dueDate: Date,
    programName: string
  ): Promise<string | null> {
    const settings = await this.getSettings();
    if (!settings.enabled || !settings.assignmentReminders) return null;

    const reminderDate = new Date(dueDate);
    reminderDate.setHours(reminderDate.getHours() - 48);

    if (reminderDate <= new Date()) return null;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Assignment Due Soon',
        body: `"${assignmentTitle}" for ${programName} is due in 2 days. Make sure to submit!`,
        data: { type: 'assignment_reminder', assignmentId },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: reminderDate },
    });

    return id;
  },

  async sendLocalNotification(
    title: string,
    body: string,
    data?: Record<string, unknown>
  ): Promise<string | null> {
    const settings = await this.getSettings();
    if (!settings.enabled) return null;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
      },
      trigger: null,
    });

    return id;
  },

  async notifyCellAssignment(cellName: string, leaderName: string, programName: string): Promise<void> {
    const settings = await this.getSettings();
    if (!settings.enabled || !settings.cellUpdates) return;

    await this.sendLocalNotification(
      'Cell Assignment',
      `You have been assigned to ${cellName} in ${programName}. Your cell leader is ${leaderName}.`,
      { type: 'cell_assignment' }
    );
  },

  async notifyAttendanceConfirmed(sessionTitle: string): Promise<void> {
    const settings = await this.getSettings();
    if (!settings.enabled || !settings.attendanceAlerts) return;

    await this.sendLocalNotification(
      'Attendance Confirmed',
      `Your attendance for "${sessionTitle}" has been confirmed by your cell leader.`,
      { type: 'attendance_confirmed' }
    );
  },

  async notifyAssignmentConfirmed(assignmentTitle: string): Promise<void> {
    const settings = await this.getSettings();
    if (!settings.enabled || !settings.assignmentReminders) return;

    await this.sendLocalNotification(
      'Assignment Confirmed',
      `Your submission for "${assignmentTitle}" has been confirmed!`,
      { type: 'assignment_confirmed' }
    );
  },

  async notifyLeaderApproved(): Promise<void> {
    const settings = await this.getSettings();
    if (!settings.enabled) return;

    await this.sendLocalNotification(
      'Leader Approved',
      'Your cell leader application has been approved! You can now manage your cell group.',
      { type: 'leader_approved' }
    );
  },

  async notifyPaymentRecorded(amount: number, programName: string): Promise<void> {
    const settings = await this.getSettings();
    if (!settings.enabled) return;

    await this.sendLocalNotification(
      'Payment Recorded',
      `Your payment of $${amount.toFixed(2)} for ${programName} has been recorded.`,
      { type: 'payment_recorded' }
    );
  },

  async notifyGraduationEligible(programName: string): Promise<void> {
    const settings = await this.getSettings();
    if (!settings.enabled) return;

    await this.sendLocalNotification(
      'Graduation Eligible!',
      `Congratulations! You are now eligible for graduation from ${programName}.`,
      { type: 'graduation_eligible' }
    );
  },

  async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  },

  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  },

  async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
  },

  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  },

  async clearBadge(): Promise<void> {
    await Notifications.setBadgeCountAsync(0);
  },
};
