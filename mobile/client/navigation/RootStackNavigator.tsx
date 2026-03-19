import React from "react";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import OnboardingStackNavigator from "@/navigation/OnboardingStackNavigator";
import AuthStackNavigator from "@/navigation/AuthStackNavigator";
import ParticipantTabNavigator from "@/navigation/ParticipantTabNavigator";
import LeaderTabNavigator from "@/navigation/LeaderTabNavigator";
import FacilitatorTabNavigator from "@/navigation/FacilitatorTabNavigator";
import AdminTabNavigator from "@/navigation/AdminTabNavigator";
import SysAdminTabNavigator from "@/navigation/SysAdminTabNavigator";
import QRScannerScreen from "@/screens/QRScannerScreen";
import QRDisplayScreen from "@/screens/QRDisplayScreen";
import NotificationSettingsScreen from "@/screens/NotificationSettingsScreen";
import AccountSettingsScreen from "@/screens/AccountSettingsScreen";
import PaymentHistoryScreen from "@/screens/PaymentHistoryScreen";
import HelpSupportScreen from "@/screens/HelpSupportScreen";
import AboutScreen from "@/screens/AboutScreen";
import ProgramManagementScreen from "@/screens/ProgramManagementScreen";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type RootStackParamList = {
  Auth: undefined;
  Onboarding: undefined;
  ParticipantMain: undefined;
  LeaderMain: undefined;
  FacilitatorMain: undefined;
  AdminMain: undefined;
  SysAdminMain: undefined;
  QRScanner: { mode: "enrollment" | "checkin" | "checkout"; sessionId?: string; programId?: string; sessionDate?: string };
  QRDisplay: { type: "enrollment" | "checkin" | "checkout"; programId?: string; programName?: string; sessionId?: string; sessionTitle?: string };
  NotificationSettings: undefined;
  AccountSettings: undefined;
  PaymentHistory: undefined;
  HelpSupport: undefined;
  About: undefined;
  ProgramManagement: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const { user, isLoading, isOnboardingComplete } = useAuth();
  const { theme } = useTheme();
  const screenOptions = useScreenOptions();

  if (isLoading) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.backgroundRoot }]}>
        <ActivityIndicator size="large" color={theme.link} />
      </View>
    );
  }

  const getMainNavigator = () => {
    // No user logged in → Show auth screens
    if (!user) {
      return (
        <Stack.Screen
          name="Auth"
          component={AuthStackNavigator}
          options={{ headerShown: false }}
        />
      );
    }

    // User logged in but not onboarded → Show onboarding
    if (!isOnboardingComplete) {
      return (
        <Stack.Screen
          name="Onboarding"
          component={OnboardingStackNavigator}
          options={{ headerShown: false }}
        />
      );
    }

    // User logged in and onboarded → Show main app based on role

    switch (user.role) {
      case "participant":
        return (
          <Stack.Screen
            name="ParticipantMain"
            component={ParticipantTabNavigator}
            options={{ headerShown: false }}
          />
        );
      case "leader":
        return (
          <Stack.Screen
            name="LeaderMain"
            component={LeaderTabNavigator}
            options={{ headerShown: false }}
          />
        );
      case "facilitator":
        return (
          <Stack.Screen
            name="FacilitatorMain"
            component={FacilitatorTabNavigator}
            options={{ headerShown: false }}
          />
        );
      case "admin":
        return (
          <Stack.Screen
            name="AdminMain"
            component={AdminTabNavigator}
            options={{ headerShown: false }}
          />
        );
      case "sysadmin":
        return (
          <Stack.Screen
            name="SysAdminMain"
            component={SysAdminTabNavigator}
            options={{ headerShown: false }}
          />
        );
      default:
        return (
          <Stack.Screen
            name="Onboarding"
            component={OnboardingStackNavigator}
            options={{ headerShown: false }}
          />
        );
    }
  };

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {getMainNavigator()}
      <Stack.Screen
        name="QRScanner"
        component={QRScannerScreen}
        options={{
          ...screenOptions,
          headerShown: true,
          headerTitle: "Scan QR Code",
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="QRDisplay"
        component={QRDisplayScreen}
        options={{
          ...screenOptions,
          headerShown: true,
          headerTitle: "QR Code",
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
        options={{
          ...screenOptions,
          headerShown: true,
          headerTitle: "Notifications",
        }}
      />
      <Stack.Screen
        name="AccountSettings"
        component={AccountSettingsScreen}
        options={{
          ...screenOptions,
          headerShown: true,
          headerTitle: "Account Settings",
        }}
      />
      <Stack.Screen
        name="PaymentHistory"
        component={PaymentHistoryScreen}
        options={{
          ...screenOptions,
          headerShown: true,
          headerTitle: "Payment History",
        }}
      />
      <Stack.Screen
        name="HelpSupport"
        component={HelpSupportScreen}
        options={{
          ...screenOptions,
          headerShown: true,
          headerTitle: "Help & Support",
        }}
      />
      <Stack.Screen
        name="About"
        component={AboutScreen}
        options={{
          ...screenOptions,
          headerShown: true,
          headerTitle: "About",
        }}
      />
      <Stack.Screen
        name="ProgramManagement"
        component={ProgramManagementScreen}
        options={{
          ...screenOptions,
          headerShown: true,
          headerTitle: "Program Management",
        }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
