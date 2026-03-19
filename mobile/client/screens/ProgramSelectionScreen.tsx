import React, { useEffect, useState } from "react";
import { View, StyleSheet, Pressable, FlatList, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInUp } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { OnboardingStackParamList } from "@/navigation/OnboardingStackNavigator";
import { storage, Program, UserRole } from "@/lib/storage";

type Props = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, "ProgramSelection">;
  route: RouteProp<OnboardingStackParamList, "ProgramSelection">;
};

export default function ProgramSelectionScreen({ navigation, route }: Props) {
  const { role } = route.params;
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPrograms();
  }, []);

  const loadPrograms = async () => {
    setIsLoading(true);
    await storage.initializeSampleData();
    const loadedPrograms = await storage.getPrograms();
    setPrograms(loadedPrograms.filter(p => p.isActive));
    setIsLoading(false);
  };

  const handleContinue = () => {
    if (!selectedProgramId) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    navigation.navigate("Registration", { role, programId: selectedProgramId });
  };

  const isEnrollmentOpen = (program: Program): boolean => {
    const now = new Date();
    const start = new Date(program.enrollmentStartDate);
    const end = new Date(program.enrollmentEndDate);
    return now >= start && now <= end;
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  };

  const handleSelectProgram = (program: Program) => {
    if (isEnrollmentOpen(program)) {
      Haptics.selectionAsync();
      setSelectedProgramId(program.id);
    }
  };

  const renderProgram = ({ item: program, index }: { item: Program; index: number }) => {
    const isSelected = selectedProgramId === program.id;
    const enrollmentOpen = isEnrollmentOpen(program);

    return (
      <Animated.View entering={FadeInUp.delay(200 + index * 100).duration(400)}>
        <Card
          elevation={isSelected ? 2 : 1}
          onPress={() => handleSelectProgram(program)}
          style={[
            styles.programCard,
            isSelected && { borderWidth: 2, borderColor: theme.link },
            !enrollmentOpen && { opacity: 0.6 },
          ]}
        >
            <View style={styles.programHeader}>
              <View style={[styles.programIcon, { backgroundColor: theme.link + "20" }]}>
                <Feather name="book-open" size={24} color={theme.link} />
              </View>
              {isSelected ? (
                <View style={[styles.selectedBadge, { backgroundColor: theme.link }]}>
                  <Feather name="check" size={16} color="#FFFFFF" />
                </View>
              ) : null}
            </View>

            <ThemedText type="h3" style={styles.programName}>
              {program.name}
            </ThemedText>

            <ThemedText type="body" style={{ color: theme.textSecondary, marginBottom: Spacing.lg }}>
              {program.description}
            </ThemedText>

            <View style={styles.programDetails}>
              <View style={styles.detailRow}>
                <Feather name="calendar" size={14} color={theme.textSecondary} />
                <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.sm }}>
                  Enrollment: {formatDateRange(program.enrollmentStartDate, program.enrollmentEndDate)}
                </ThemedText>
              </View>
              <View style={styles.detailRow}>
                <Feather name="play-circle" size={14} color={theme.textSecondary} />
                <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.sm }}>
                  Starts: {new Date(program.programStartDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </ThemedText>
              </View>
            </View>

            <View
              style={[
                styles.enrollmentStatus,
                { backgroundColor: enrollmentOpen ? theme.success + "20" : theme.textSecondary + "20" },
              ]}
            >
              <Feather
                name={enrollmentOpen ? "check-circle" : "clock"}
                size={14}
                color={enrollmentOpen ? theme.success : theme.textSecondary}
              />
              <ThemedText
                type="small"
                style={{
                  color: enrollmentOpen ? theme.success : theme.textSecondary,
                  marginLeft: Spacing.xs,
                  fontWeight: "600",
                }}
              >
                {enrollmentOpen ? "Enrollment Open" : "Coming Soon"}
              </ThemedText>
            </View>
        </Card>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        data={programs}
        keyExtractor={(item) => item.id}
        renderItem={renderProgram}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing["4xl"], paddingBottom: insets.bottom + Spacing["3xl"] },
        ]}
        ListHeaderComponent={
          <View style={styles.header}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Feather name="arrow-left" size={24} color={theme.text} />
            </Pressable>
            <Animated.View entering={FadeInUp.delay(100).duration(500)}>
              <ThemedText type="h2" style={styles.title}>
                Select a Program
              </ThemedText>
              <ThemedText type="body" style={{ color: theme.textSecondary, marginBottom: Spacing["2xl"] }}>
                Choose a program to enroll in. You can register for multiple programs.
              </ThemedText>
            </Animated.View>
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.link} />
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Feather name="inbox" size={48} color={theme.textSecondary} />
              <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.lg }}>
                No programs available at this time
              </ThemedText>
            </View>
          )
        }
      />

      <View
        style={[
          styles.footer,
          { paddingBottom: insets.bottom + Spacing.lg, backgroundColor: theme.backgroundRoot },
        ]}
      >
        <Button
          onPress={handleContinue}
          disabled={!selectedProgramId}
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
  },
  content: {
    paddingHorizontal: Spacing.xl,
  },
  header: {},
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    marginBottom: Spacing.md,
  },
  loadingContainer: {
    paddingVertical: Spacing["4xl"],
    alignItems: "center",
  },
  emptyContainer: {
    paddingVertical: Spacing["4xl"],
    alignItems: "center",
  },
  programCard: {
    marginBottom: Spacing.lg,
  },
  programHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.lg,
  },
  programIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  programName: {
    marginBottom: Spacing.sm,
  },
  programDetails: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  enrollmentStatus: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  button: {
    width: "100%",
  },
});
