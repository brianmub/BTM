import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet } from "react-native";

import AdminDashboardScreen from "@/screens/AdminDashboardScreen";
import AdminProgramsScreen from "@/screens/AdminProgramsScreen";
import AdminParticipantsScreen from "@/screens/AdminParticipantsScreen";
import ReportsScreen from "@/screens/ReportsScreen";
import ProfileScreen from "@/screens/ProfileScreen";
import { HeaderTitle } from "@/components/HeaderTitle";
import { useTheme } from "@/hooks/useTheme";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type AdminTabParamList = {
  DashboardTab: undefined;
  ProgramsTab: undefined;
  ParticipantsTab: undefined;
  ReportsTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<AdminTabParamList>();

function DashboardStack() {
  const screenOptions = useScreenOptions();
  const Stack = createNativeStackNavigator();
  
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Dashboard"
        component={AdminDashboardScreen}
        options={{
          headerTitle: () => <HeaderTitle title="BTM" />,
        }}
      />
    </Stack.Navigator>
  );
}

function ProgramsStack() {
  const screenOptions = useScreenOptions();
  const Stack = createNativeStackNavigator();
  
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Programs"
        component={AdminProgramsScreen}
        options={{ headerTitle: "Programs" }}
      />
    </Stack.Navigator>
  );
}

function ParticipantsStack() {
  const screenOptions = useScreenOptions();
  const Stack = createNativeStackNavigator();
  
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Participants"
        component={AdminParticipantsScreen}
        options={{ headerTitle: "Participants" }}
      />
    </Stack.Navigator>
  );
}

function ReportsStack() {
  const screenOptions = useScreenOptions();
  const Stack = createNativeStackNavigator();
  
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Reports"
        component={ReportsScreen}
        options={{ headerTitle: "Reports" }}
      />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  const screenOptions = useScreenOptions();
  const Stack = createNativeStackNavigator();
  
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ headerTitle: "Profile" }}
      />
    </Stack.Navigator>
  );
}

export default function AdminTabNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Tab.Navigator
      initialRouteName="DashboardTab"
      screenOptions={{
        tabBarActiveTintColor: theme.tabIconSelected,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: Platform.select({
            ios: "transparent",
            android: theme.backgroundRoot,
          }),
          borderTopWidth: 0,
          elevation: 0,
        },
        tabBarBackground: () =>
          Platform.OS === "ios" ? (
            <BlurView
              intensity={100}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : null,
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardStack}
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ProgramsTab"
        component={ProgramsStack}
        options={{
          title: "Programs",
          tabBarIcon: ({ color, size }) => (
            <Feather name="book-open" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ParticipantsTab"
        component={ParticipantsStack}
        options={{
          title: "People",
          tabBarIcon: ({ color, size }) => (
            <Feather name="users" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ReportsTab"
        component={ReportsStack}
        options={{
          title: "Reports",
          tabBarIcon: ({ color, size }) => (
            <Feather name="bar-chart-2" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStack}
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
