import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet } from "react-native";

import LeaderHomeScreen from "@/screens/LeaderHomeScreen";
import MyCellScreen from "@/screens/MyCellScreen";
import AttendanceScreen from "@/screens/AttendanceScreen";
import PaymentRecordingScreen from "@/screens/PaymentRecordingScreen";
import ProfileScreen from "@/screens/ProfileScreen";
import { HeaderTitle } from "@/components/HeaderTitle";
import { useTheme } from "@/hooks/useTheme";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type LeaderTabParamList = {
  HomeTab: undefined;
  MyCellTab: undefined;
  AttendanceTab: undefined;
  PaymentsTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<LeaderTabParamList>();

function HomeStack() {
  const screenOptions = useScreenOptions();
  const Stack = createNativeStackNavigator();
  
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Home"
        component={LeaderHomeScreen}
        options={{
          headerTitle: () => <HeaderTitle title="BTM" />,
        }}
      />
    </Stack.Navigator>
  );
}

function MyCellStack() {
  const screenOptions = useScreenOptions();
  const Stack = createNativeStackNavigator();
  
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="MyCell"
        component={MyCellScreen}
        options={{ headerTitle: "My Cell" }}
      />
    </Stack.Navigator>
  );
}

function AttendanceStack() {
  const screenOptions = useScreenOptions();
  const Stack = createNativeStackNavigator();
  
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Attendance"
        component={AttendanceScreen}
        options={{ headerTitle: "Attendance" }}
      />
    </Stack.Navigator>
  );
}

function PaymentsStack() {
  const screenOptions = useScreenOptions();
  const Stack = createNativeStackNavigator();
  
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Payments"
        component={PaymentRecordingScreen}
        options={{ headerTitle: "Payments" }}
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

export default function LeaderTabNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
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
        name="HomeTab"
        component={HomeStack}
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="MyCellTab"
        component={MyCellStack}
        options={{
          title: "My Cell",
          tabBarIcon: ({ color, size }) => (
            <Feather name="users" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="AttendanceTab"
        component={AttendanceStack}
        options={{
          title: "Attendance",
          tabBarIcon: ({ color, size }) => (
            <Feather name="check-circle" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="PaymentsTab"
        component={PaymentsStack}
        options={{
          title: "Payments",
          tabBarIcon: ({ color, size }) => (
            <Feather name="dollar-sign" size={size} color={color} />
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
