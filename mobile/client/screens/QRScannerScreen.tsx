import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Alert,
  Platform,
  Pressable,
} from "react-native";
import { CameraView, useCameraPermissions, Camera } from "expo-camera";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { storage } from "@/lib/storage";
import { Spacing, BorderRadius } from "@/constants/theme";

type ScanMode = "enrollment" | "checkin" | "checkout";

type QRData = {
  type: ScanMode;
  programId?: string;
  sessionId?: string;
  programName?: string;
  sessionTitle?: string;
};

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any>;
};

export default function QRScannerScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const { user } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const mode = (route.params as any)?.mode as ScanMode || "checkin";
  const sessionId = (route.params as any)?.sessionId as string | undefined;
  const programId = (route.params as any)?.programId as string | undefined;
  const sessionDate = (route.params as any)?.sessionDate as string | undefined;

  const getModeTitle = () => {
    switch (mode) {
      case "enrollment":
        return "Scan to Enroll";
      case "checkin":
        return "Scan to Check In";
      case "checkout":
        return "Scan to Check Out";
      default:
        return "Scan QR Code";
    }
  };

  const getModeDescription = () => {
    switch (mode) {
      case "enrollment":
        return "Scan the program QR code to enroll after your payment has been confirmed.";
      case "checkin":
        return "Scan the session QR code to record your entry time.";
      case "checkout":
        return "Scan the session QR code to record your exit time.";
      default:
        return "Scan the QR code to continue.";
    }
  };

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || processing || !user) return;
    
    setScanned(true);
    setProcessing(true);

    try {
      const qrData: QRData = JSON.parse(data);
      
      if (qrData.type !== mode) {
        setResult({
          success: false,
          message: `Invalid QR code. Expected ${mode} QR code.`,
        });
        setProcessing(false);
        return;
      }

      let response: { success: boolean; message: string };

      switch (mode) {
        case "enrollment":
          if (!qrData.programId) {
            response = { success: false, message: "Invalid enrollment QR code" };
          } else {
            response = await storage.enrollViaQR(user.id, qrData.programId);
          }
          break;

        case "checkin":
          if (!qrData.sessionId || !qrData.programId) {
            response = { success: false, message: "Invalid check-in QR code" };
          } else {
            await storage.checkInToSession(user.id, qrData.sessionId, qrData.programId);
            response = { success: true, message: "Successfully checked in! Entry time recorded." };
          }
          break;

        case "checkout":
          if (!qrData.sessionId) {
            response = { success: false, message: "Invalid check-out QR code" };
          } else {
            if (sessionDate) {
              const isAvailable = await storage.isCheckoutAvailable(sessionDate);
              if (!isAvailable) {
                response = { success: false, message: "Check-out is only available after 11:00 AM on the session date." };
                setResult(response);
                setProcessing(false);
                return;
              }
            }
            response = await storage.checkOutOfSession(user.id, qrData.sessionId);
          }
          break;

        default:
          response = { success: false, message: "Unknown scan mode" };
      }

      setResult(response);
    } catch (error) {
      setResult({
        success: false,
        message: "Invalid QR code format. Please try again.",
      });
    }

    setProcessing(false);
  };

  const handleScanAgain = () => {
    setScanned(false);
    setResult(null);
  };

  const handleSimulateScan = async () => {
    if (!user) return;
    
    setProcessing(true);

    let response: { success: boolean; message: string };

    try {
      switch (mode) {
        case "enrollment":
          if (programId) {
            response = await storage.enrollViaQR(user.id, programId);
          } else {
            response = { success: false, message: "No program specified" };
          }
          break;

        case "checkin":
          if (sessionId && programId) {
            await storage.checkInToSession(user.id, sessionId, programId);
            response = { success: true, message: "Successfully checked in! Entry time recorded." };
          } else {
            response = { success: false, message: "No session specified" };
          }
          break;

        case "checkout":
          if (sessionId) {
            if (sessionDate) {
              const isAvailable = await storage.isCheckoutAvailable(sessionDate);
              if (!isAvailable) {
                response = { success: false, message: "Check-out is only available after 11:00 AM on the session date." };
                setResult(response);
                setProcessing(false);
                return;
              }
            }
            response = await storage.checkOutOfSession(user.id, sessionId);
          } else {
            response = { success: false, message: "No session specified" };
          }
          break;

        default:
          response = { success: false, message: "Unknown scan mode" };
      }

      setResult(response);
      setScanned(true);
    } catch (error) {
      setResult({
        success: false,
        message: "An error occurred. Please try again.",
      });
    }

    setProcessing(false);
  };

  if (!permission) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.content, { paddingTop: headerHeight + Spacing.xl }]}>
          <ThemedText>Requesting camera permission...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (!permission.granted) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.content, { paddingTop: headerHeight + Spacing.xl, paddingBottom: insets.bottom + Spacing.xl }]}>
          <Card style={styles.permissionCard}>
            <Feather name="camera-off" size={48} color={theme.textSecondary} style={styles.icon} />
            <ThemedText type="h3" style={styles.permissionTitle}>
              Camera Permission Required
            </ThemedText>
            <ThemedText style={[styles.permissionText, { color: theme.textSecondary }]}>
              We need camera access to scan QR codes for {mode === "enrollment" ? "enrollment" : "attendance"}.
            </ThemedText>
            <Button onPress={requestPermission} style={styles.permissionButton}>
              Grant Permission
            </Button>
            
            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
              <ThemedText style={[styles.dividerText, { color: theme.textSecondary }]}>or</ThemedText>
              <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
            </View>
            
            <Button
              variant="secondary"
              onPress={handleSimulateScan}
              loading={processing}
            >
              Simulate QR Scan (Demo)
            </Button>
          </Card>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.content, { paddingTop: headerHeight + Spacing.lg }]}>
        <View style={styles.headerSection}>
          <ThemedText type="h2" style={styles.title}>
            {getModeTitle()}
          </ThemedText>
          <ThemedText style={[styles.description, { color: theme.textSecondary }]}>
            {getModeDescription()}
          </ThemedText>
        </View>

        {result ? (
          <Card style={styles.resultCard}>
            <View style={[styles.resultIconContainer, { backgroundColor: result.success ? theme.success + "20" : theme.error + "20" }]}>
              <Feather
                name={result.success ? "check-circle" : "x-circle"}
                size={48}
                color={result.success ? theme.success : theme.error}
              />
            </View>
            <ThemedText type="h3" style={styles.resultTitle}>
              {result.success ? "Success!" : "Error"}
            </ThemedText>
            <ThemedText style={[styles.resultMessage, { color: theme.textSecondary }]}>
              {result.message}
            </ThemedText>
            <View style={styles.resultButtons}>
              {!result.success && (
                <Button onPress={handleScanAgain} style={styles.resultButton}>
                  Try Again
                </Button>
              )}
              <Button
                variant={result.success ? "primary" : "secondary"}
                onPress={() => navigation.goBack()}
                style={styles.resultButton}
              >
                {result.success ? "Done" : "Go Back"}
              </Button>
            </View>
          </Card>
        ) : (
          <>
            <View style={styles.cameraContainer}>
              {Platform.OS !== "web" ? (
                <CameraView
                  style={styles.camera}
                  facing="back"
                  barcodeScannerSettings={{
                    barcodeTypes: ["qr"],
                  }}
                  onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                />
              ) : (
                <View style={[styles.webPlaceholder, { backgroundColor: theme.card }]}>
                  <Feather name="camera" size={64} color={theme.textSecondary} />
                  <ThemedText style={[styles.webPlaceholderText, { color: theme.textSecondary }]}>
                    Camera not available on web
                  </ThemedText>
                </View>
              )}
              <View style={styles.scanOverlay}>
                <View style={[styles.scanFrame, { borderColor: theme.primary }]} />
              </View>
            </View>

            <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.xl }]}>
              <Button
                variant="secondary"
                onPress={handleSimulateScan}
                loading={processing}
              >
                Simulate QR Scan (Demo)
              </Button>
              <Pressable onPress={() => navigation.goBack()} style={styles.cancelButton}>
                <ThemedText style={{ color: theme.textSecondary }}>Cancel</ThemedText>
              </Pressable>
            </View>
          </>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  headerSection: {
    marginBottom: Spacing.xl,
  },
  title: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  description: {
    textAlign: "center",
  },
  cameraContainer: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    marginBottom: Spacing.xl,
    position: "relative",
  },
  camera: {
    flex: 1,
  },
  webPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: BorderRadius.lg,
  },
  webPlaceholderText: {
    marginTop: Spacing.md,
    textAlign: "center",
  },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 3,
    borderRadius: BorderRadius.lg,
  },
  footer: {
    gap: Spacing.md,
  },
  cancelButton: {
    alignItems: "center",
    padding: Spacing.md,
  },
  permissionCard: {
    padding: Spacing.xl,
    alignItems: "center",
  },
  icon: {
    marginBottom: Spacing.lg,
  },
  permissionTitle: {
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  permissionText: {
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  permissionButton: {
    width: "100%",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginVertical: Spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: Spacing.md,
  },
  resultCard: {
    padding: Spacing.xl,
    alignItems: "center",
    marginTop: Spacing.xl,
  },
  resultIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  resultTitle: {
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  resultMessage: {
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  resultButtons: {
    width: "100%",
    gap: Spacing.md,
  },
  resultButton: {
    width: "100%",
  },
});
