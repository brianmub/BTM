import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { StyleSheet, Platform, View } from "react-native";

import SysAdminDashboardScreen from "@/screens/SysAdminDashboardScreen";
import ProgramManagementScreen from "@/screens/ProgramManagementScreen";
import LeaderApprovalScreen from "@/screens/LeaderApprovalScreen";
import CellManagementScreen from "@/screens/CellManagementScreen";
import ReportsScreen from "@/screens/ReportsScreen";
import AuditLogScreen from "@/screens/AuditLogScreen";
import ProfileScreen from "@/screens/ProfileScreen";
import { HeaderTitle } from "@/components/HeaderTitle";
import { useTheme } from "@/hooks/useTheme";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type SysAdminTabParamList = {
  DashboardTab: undefined;
  Leaders: undefined;
  Cells: undefined;
  Reports: undefined;
  AuditLog: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<SysAdminTabParamList>();

function DashboardStack() {
  const screenOptions = useScreenOptions();
  const Stack = createNativeStackNavigator();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Dashboard"
        component={SysAdminDashboardScreen}
        options={{
          headerTitle: () => <HeaderTitle title="BTM" />,
        }}
      />
      <Stack.Screen
        name="ProgramManagement"
        component={ProgramManagementScreen}
        options={{
          headerTitle: "Program Management",
        }}
      />
    </Stack.Navigator>
  );
}

export default function SysAdminTabNavigator() {
  const { theme } = useTheme();
  const screenOptions = useScreenOptions();

  return (
    <Tab.Navigator
      screenOptions={{
        ...screenOptions,
        tabBarActiveTintColor: theme.link,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          position: "absolute",
          borderTopWidth: 0,
          elevation: 0,
          backgroundColor: Platform.OS === "ios" ? "transparent" : theme.backgroundDefault,
        },
        tabBarBackground: () =>
          Platform.OS === "ios" ? (
            <BlurView
              intensity={80}
              tint="light"
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.backgroundDefault }]} />
          ),
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
        },
      }}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardStack}
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ color, size }) => (
            <Feather name="grid" size={size} color={color} />
          ),
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Leaders"
        component={LeaderApprovalScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Feather name="user-check" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Cells"
        component={CellManagementScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Feather name="layers" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Reports"
        component={ReportsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Feather name="bar-chart-2" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="AuditLog"
        component={AuditLogScreen}
        options={{
          tabBarLabel: "Audit",
          tabBarIcon: ({ color, size }) => (
            <Feather name="file-text" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
