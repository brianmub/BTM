// expo-notifications is not fully supported in Expo Go.
// Listeners and permission checks are stubbed to no-ops.
// Re-enable when building a standalone/production app.

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
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
    enabled: false,
    sessionReminders: false,
    assignmentReminders: false,
    attendanceAlerts: false,
    cellUpdates: false,
  });

  useEffect(() => {
    loadInitialState();
    // Notification listeners skipped – expo-notifications not supported in Expo Go
  }, []);

  const loadInitialState = async () => {
    const savedSettings = await notificationService.getSettings();
    setSettings(savedSettings);
    // Permission check skipped – expo-notifications not supported in Expo Go
    setHasPermission(false);
  };

  const requestPermission = useCallback(async () => {
    // Stubbed – expo-notifications not supported in Expo Go
    return false;
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
