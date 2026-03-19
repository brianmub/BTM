import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import WelcomeScreen from "@/screens/WelcomeScreen";
import JoinCodeScreen from "@/screens/JoinCodeScreen";
import RoleSelectionScreen from "@/screens/RoleSelectionScreen";
import RegistrationScreen from "@/screens/RegistrationScreen";
import { UserRole } from "@/lib/storage";

export type OnboardingStackParamList = {
  Welcome: undefined;
  JoinCode: undefined;
  RoleSelection: { organizationId: string; organizationName: string };
  Registration: { role: UserRole; organizationId: string };
};

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export default function OnboardingStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
      initialRouteName="Welcome"
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="JoinCode" component={JoinCodeScreen} />
      <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
      <Stack.Screen name="Registration" component={RegistrationScreen} />
    </Stack.Navigator>
  );
}
