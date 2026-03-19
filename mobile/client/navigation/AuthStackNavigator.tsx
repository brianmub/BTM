import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import WelcomeScreen from "@/screens/WelcomeScreen";
import JoinCodeScreen from "@/screens/JoinCodeScreen";
import RoleSelectionScreen from "@/screens/RoleSelectionScreen";
import RegistrationScreen from "@/screens/RegistrationScreen";
import LoginScreen from "@/screens/LoginScreen";
import SignupScreen from "@/screens/SignupScreen";
import { UserRole } from "@/lib/storage";

export type AuthStackParamList = {
    Login: undefined;
    Signup: undefined;
    Welcome: undefined;
    JoinCode: undefined;
    RoleSelection: { organizationId: string; organizationName: string };
    Registration: { role: UserRole; organizationId: string };
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthStackNavigator() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                animation: "slide_from_right",
            }}
            initialRouteName="Login"
        >
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="JoinCode" component={JoinCodeScreen} />
            <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
            <Stack.Screen name="Registration" component={RegistrationScreen} />
        </Stack.Navigator>
    );
}
