import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet } from "react-native";

import FacilitatorHomeScreen from "@/screens/FacilitatorHomeScreen";
import SessionManagementScreen from "@/screens/SessionManagementScreen";
import AssignmentManagementScreen from "@/screens/AssignmentManagementScreen";
import ProfileScreen from "@/screens/ProfileScreen";
import { HeaderTitle } from "@/components/HeaderTitle";
import { useTheme } from "@/hooks/useTheme";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type FacilitatorTabParamList = {
  HomeTab: undefined;
  SessionsTab: undefined;
  AssignmentsTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<FacilitatorTabParamList>();

function HomeStack() {
  const screenOptions = useScreenOptions();
  const Stack = createNativeStackNavigator();
  
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Home"
        component={FacilitatorHomeScreen}
        options={{
          headerTitle: () => <HeaderTitle title="BTM" />,
        }}
      />
    </Stack.Navigator>
  );
}

function SessionsStack() {
  const screenOptions = useScreenOptions();
  const Stack = createNativeStackNavigator();
  
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Sessions"
        component={SessionManagementScreen}
        options={{ headerTitle: "Sessions" }}
      />
    </Stack.Navigator>
  );
}

function AssignmentsStack() {
  const screenOptions = useScreenOptions();
  const Stack = createNativeStackNavigator();
  
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Assignments"
        component={AssignmentManagementScreen}
        options={{ headerTitle: "Assignments" }}
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

export default function FacilitatorTabNavigator() {
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
        name="SessionsTab"
        component={SessionsStack}
        options={{
          title: "Sessions",
          tabBarIcon: ({ color, size }) => (
            <Feather name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="AssignmentsTab"
        component={AssignmentsStack}
        options={{
          title: "Tasks",
          tabBarIcon: ({ color, size }) => (
            <Feather name="file-text" size={size} color={color} />
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
