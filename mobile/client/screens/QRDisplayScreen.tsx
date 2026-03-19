import React, { useMemo } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import QRCode from "react-native-qrcode-svg";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

type QRType = "enrollment" | "checkin" | "checkout";

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any>;
};

export default function QRDisplayScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();

  const qrType = (route.params as any)?.type as QRType || "checkin";
  const programId = (route.params as any)?.programId as string;
  const programName = (route.params as any)?.programName as string;
  const sessionId = (route.params as any)?.sessionId as string;
  const sessionTitle = (route.params as any)?.sessionTitle as string;

  const qrData = useMemo(() => {
    return JSON.stringify({
      type: qrType,
      programId,
      programName,
      sessionId,
      sessionTitle,
    });
  }, [qrType, programId, programName, sessionId, sessionTitle]);

  const getTitle = () => {
    switch (qrType) {
      case "enrollment":
        return "Enrollment QR Code";
      case "checkin":
        return "Check-In QR Code";
      case "checkout":
        return "Check-Out QR Code";
      default:
        return "QR Code";
    }
  };

  const getDescription = () => {
    switch (qrType) {
      case "enrollment":
        return "Participants with confirmed payment can scan this code to enroll.";
      case "checkin":
        return "Participants can scan this code to check in and record their entry time.";
      case "checkout":
        return "Participants can scan this code to check out and record their exit time. Available after 11:00 AM.";
      default:
        return "Scan this QR code to continue.";
    }
  };

  const getIcon = (): "user-plus" | "log-in" | "log-out" => {
    switch (qrType) {
      case "enrollment":
        return "user-plus";
      case "checkin":
        return "log-in";
      case "checkout":
        return "log-out";
      default:
        return "log-in";
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: headerHeight + Spacing.xl,
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
      >
        <View style={styles.headerSection}>
          <View style={[styles.iconContainer, { backgroundColor: theme.primary + "20" }]}>
            <Feather name={getIcon()} size={32} color={theme.primary} />
          </View>
          <ThemedText type="h2" style={styles.title}>
            {getTitle()}
          </ThemedText>
          <ThemedText style={[styles.description, { color: theme.textSecondary }]}>
            {getDescription()}
          </ThemedText>
        </View>

        <Card style={styles.qrCard}>
          <View style={styles.qrContainer}>
            <QRCode
              value={qrData}
              size={250}
              backgroundColor="white"
              color={theme.text}
            />
          </View>
          
          <View style={styles.infoSection}>
            {programName ? (
              <View style={styles.infoRow}>
                <ThemedText style={[styles.infoLabel, { color: theme.textSecondary }]}>
                  Program:
                </ThemedText>
                <ThemedText style={styles.infoValue}>{programName}</ThemedText>
              </View>
            ) : null}
            
            {sessionTitle ? (
              <View style={styles.infoRow}>
                <ThemedText style={[styles.infoLabel, { color: theme.textSecondary }]}>
                  Session:
                </ThemedText>
                <ThemedText style={styles.infoValue}>{sessionTitle}</ThemedText>
              </View>
            ) : null}
          </View>
        </Card>

        <View style={[styles.instructionsCard, { backgroundColor: theme.card }]}>
          <Feather name="info" size={20} color={theme.primary} />
          <ThemedText style={[styles.instructionsText, { color: theme.textSecondary }]}>
            Display this QR code on screen for participants to scan with their devices.
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  description: {
    textAlign: "center",
    paddingHorizontal: Spacing.lg,
  },
  qrCard: {
    padding: Spacing.xl,
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  qrContainer: {
    padding: Spacing.lg,
    backgroundColor: "white",
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  infoSection: {
    width: "100%",
    gap: Spacing.sm,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  instructionsCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  instructionsText: {
    flex: 1,
    fontSize: 14,
  },
});
