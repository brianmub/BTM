import React, { useState } from "react";
import { View, StyleSheet, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { OnboardingStackParamList } from "@/navigation/OnboardingStackNavigator";
import { UserRole } from "@/lib/storage";

type Props = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, "RoleSelection">;
  route: RouteProp<OnboardingStackParamList, "RoleSelection">;
};

interface RoleOption {
// ... existing code ...
  id: UserRole;
  title: string;
  description: string;
  icon: keyof typeof Feather.glyphMap;
}

const roles: RoleOption[] = [
  {
    id: "participant",
    title: "Participant",
    description: "Join a cell group, attend sessions, and complete assignments",
    icon: "user",
  },
  {
    id: "facilitator",
    title: "Facilitator",
    description: "Manage session content, create assignments, and prepare materials",
    icon: "book-open",
  },
];

function RoleCard({
  role,
  isSelected,
  onSelect,
  index,
}: {
  role: RoleOption;
  isSelected: boolean;
  onSelect: () => void;
  index: number;
}) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  return (
    <Animated.View 
      entering={FadeInUp.delay(100 + index * 80).duration(500)}
      style={animatedStyle}
    >
      <Pressable
        onPress={onSelect}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.roleCard,
          {
            borderColor: isSelected ? theme.primary : theme.border,
            borderWidth: isSelected ? 2 : 1,
          },
        ]}
      >
        {isSelected ? (
          <LinearGradient
            colors={["rgba(218, 41, 28, 0.15)", "rgba(218, 41, 28, 0.05)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        ) : null}
        
        <View
          style={[
            styles.iconContainer,
            { 
              backgroundColor: isSelected ? theme.primary : theme.backgroundSecondary,
            },
          ]}
        >
          <Feather
            name={role.icon}
            size={22}
            color={isSelected ? "#FFFFFF" : "#A0A0A0"}
          />
        </View>
        
        <View style={styles.roleTextContainer}>
          <ThemedText type="h4" style={{ color: "#FFFFFF" }}>
            {role.title}
          </ThemedText>
          <ThemedText
            type="small"
            style={{ color: theme.textSecondary, marginTop: Spacing.xs }}
          >
            {role.description}
          </ThemedText>
        </View>
        
        <View 
          style={[
            styles.radioOuter, 
            { borderColor: isSelected ? theme.primary : theme.border }
          ]}
        >
          {isSelected ? (
            <View style={[styles.radioInner, { backgroundColor: theme.primary }]} />
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function RoleSelectionScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const handleSelectRole = (roleId: UserRole) => {
    Haptics.selectionAsync();
    setSelectedRole(roleId);
  };

  const handleContinue = () => {
    if (selectedRole) {
      navigation.navigate("Registration", { 
        role: selectedRole,
        organizationId: route.params.organizationId
      });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: '#0D0D0D' }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.xl, paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInUp.delay(50).duration(500)}>
          <View style={styles.header}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Feather name="arrow-left" size={24} color="#DA291C" />
            </Pressable>
          </View>
          
          <View style={styles.titleSection}>
            <ThemedText type="h1" style={[styles.title, { color: '#DA291C' }]}>
              Choose Your Path
            </ThemedText>
            <ThemedText
              type="body"
              style={[styles.subtitle, { color: theme.textSecondary }]}
            >
              Select your role to join the mission
            </ThemedText>
          </View>
        </Animated.View>

        <View style={styles.rolesContainer}>
          {roles.map((role, index) => (
            <RoleCard
              key={role.id}
              role={role}
              isSelected={selectedRole === role.id}
              onSelect={() => handleSelectRole(role.id)}
              index={index}
            />
          ))}
        </View>
      </ScrollView>

      <View 
        style={[
          styles.buttonContainer, 
          { 
            paddingBottom: insets.bottom + Spacing.lg,
          }
        ]}
      >
        <Button
          onPress={handleContinue}
          disabled={!selectedRole}
          style={styles.button}
        >
          Continue
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D0D0D",
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  patternOverlay: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  patternLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "#FFFFFF",
    transform: [{ rotate: "-45deg" }, { scaleX: 2 }],
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.xl,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  titleSection: {
    marginBottom: Spacing["2xl"],
  },
  title: {
    color: "#FFFFFF",
    marginBottom: Spacing.sm,
  },
  subtitle: {
    marginBottom: Spacing.md,
  },
  rolesContainer: {
    gap: Spacing.md,
  },
  roleCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    backgroundColor: "#1A1A1A",
    overflow: "hidden",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.lg,
  },
  roleTextContainer: {
    flex: 1,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: Spacing.sm,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  buttonContainer: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "#2A2A2A",
  },
  button: {
    width: "100%",
  },
});
