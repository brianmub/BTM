import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet } from "react-native";

import ParticipantHomeScreen from "@/screens/ParticipantHomeScreen";
import SessionsScreen from "@/screens/SessionsScreen";
import ProgramCatalogScreen from "@/screens/ProgramCatalogScreen";
import MyCellScreen from "@/screens/MyCellScreen";
import ProfileScreen from "@/screens/ProfileScreen";
import { HeaderTitle } from "@/components/HeaderTitle";
import { useTheme } from "@/hooks/useTheme";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type ParticipantTabParamList = {
  HomeTab: undefined;
  ProgramsTab: undefined;
  SessionsTab: undefined;
  MyCellTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<ParticipantTabParamList>();

function HomeStack() {
  const screenOptions = useScreenOptions();
  const Stack = createNativeStackNavigator();
  
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Home"
        component={ParticipantHomeScreen}
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
        component={SessionsScreen}
        options={{ headerTitle: "Sessions" }}
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
        component={ProgramCatalogScreen}
        options={{ headerTitle: "Programs" }}
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

export default function ParticipantTabNavigator() {
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
        name="ProgramsTab"
        component={ProgramsStack}
        options={{
          title: "Programs",
          tabBarIcon: ({ color, size }) => (
            <Feather name="book" size={size} color={color} />
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
