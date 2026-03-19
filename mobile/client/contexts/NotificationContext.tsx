import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { notificationService, NotificationSettings } from '@/lib/notifications';

interface NotificationContextType {
  hasPermission: boolean;
  settings: NotificationSettings;
  requestPermission: () => Promise<boolean>;
  updateSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  scheduleSessionReminder: (sessionId: string, title: string, date: Date, programName: string) => Promise<void>;
  scheduleAssignmentReminder: (assignmentId: string, title: string, dueDate: Date, programName: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [hasPermission, setHasPermission] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: true,
    sessionReminders: true,
    assignmentReminders: true,
    attendanceAlerts: true,
    cellUpdates: true,
  });

  useEffect(() => {
    loadInitialState();
    setupNotificationListeners();
  }, []);

  const loadInitialState = async () => {
    const savedSettings = await notificationService.getSettings();
    setSettings(savedSettings);

    if (Platform.OS !== 'web') {
      const { status } = await Notifications.getPermissionsAsync();
      setHasPermission(status === 'granted');
    }
  };

  const setupNotificationListeners = () => {
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
    });

    return () => {
      subscription.remove();
      responseSubscription.remove();
    };
  };

  const requestPermission = useCallback(async () => {
    const granted = await notificationService.requestPermissions();
    setHasPermission(granted);
    return granted;
  }, []);

  const updateSettings = useCallback(async (newSettings: Partial<NotificationSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    await notificationService.saveSettings(updated);
  }, [settings]);

  const scheduleSessionReminder = useCallback(async (
    sessionId: string,
    title: string,
    date: Date,
    programName: string
  ) => {
    await notificationService.scheduleSessionReminder(sessionId, title, date, programName);
  }, []);

  const scheduleAssignmentReminder = useCallback(async (
    assignmentId: string,
    title: string,
    dueDate: Date,
    programName: string
  ) => {
    await notificationService.scheduleAssignmentReminder(assignmentId, title, dueDate, programName);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        hasPermission,
        settings,
        requestPermission,
        updateSettings,
        scheduleSessionReminder,
        scheduleAssignmentReminder,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
