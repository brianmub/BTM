import React, { useEffect, useState, useCallback } from "react";
import { View, StyleSheet, FlatList, Image, Pressable, Modal, TextInput, Alert, RefreshControl, Platform, ActionSheetIOS, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInUp } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { File } from "expo-file-system/next";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { storage, Assignment, AssignmentSubmission, FileAttachment } from "@/lib/storage";
import { getApiUrl } from "@/lib/query-client";

interface LocalFile {
  uri: string;
  name: string;
  type: string;
  size: number;
}

type SubmissionStatus = "pending" | "submitted" | "confirmed" | "late";

interface AssignmentWithStatus extends Assignment {
  status: SubmissionStatus;
  submission?: AssignmentSubmission;
}

function StatusBadge({ status }: { status: SubmissionStatus }) {
  const { theme } = useTheme();

  const getStatusStyle = () => {
    switch (status) {
      case "confirmed":
        return { bg: theme.link, text: "#FFFFFF", label: "Confirmed" };
      case "submitted":
        return { bg: theme.success, text: "#FFFFFF", label: "Submitted" };
      case "late":
        return { bg: theme.error, text: "#FFFFFF", label: "Late" };
      default:
        return { bg: theme.warning, text: "#FFFFFF", label: "Pending" };
    }
  };

  const style = getStatusStyle();

  return (
    <View style={[styles.statusBadge, { backgroundColor: style.bg }]}>
      <ThemedText type="small" style={{ color: style.text, fontWeight: "600" }}>
        {style.label}
      </ThemedText>
    </View>
  );
}

export default function AssignmentsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<AssignmentWithStatus[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentWithStatus | null>(null);
  const [submissionText, setSubmissionText] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<LocalFile[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<FileAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const loadAssignments = useCallback(async () => {
    if (!user) return;
    const [loaded, submissions] = await Promise.all([
      storage.getAssignments(),
      storage.getSubmissions(),
    ]);
    
    const userSubmissions = submissions.filter(s => s.userId === user.id);
    
    const withStatus: AssignmentWithStatus[] = loaded.map((a) => {
      const submission = userSubmissions.find(s => s.assignmentId === a.id);
      let status: SubmissionStatus = "pending";
      
      if (submission) {
        if (submission.isConfirmed) {
          status = "confirmed";
        } else if (submission.isLate) {
          status = "late";
        } else {
          status = "submitted";
        }
      }
      
      return { ...a, status, submission };
    });
    setAssignments(withStatus);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadAssignments();
    }, [loadAssignments])
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadAssignments();
    setIsRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const handleOpenAssignment = async (assignment: AssignmentWithStatus) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedAssignment(assignment);
    setSubmissionText(assignment.submission?.content || "");
    setAttachedFiles([]);
    
    if (assignment.submission?.id) {
      try {
        const attachments = await storage.getAttachments(assignment.submission.id);
        setExistingAttachments(attachments);
      } catch {
        setExistingAttachments([]);
      }
    } else {
      setExistingAttachments([]);
    }
    
    setIsModalVisible(true);
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets.length > 0) {
        const doc = result.assets[0];
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setAttachedFiles(prev => [...prev, {
          uri: doc.uri,
          name: doc.name,
          type: doc.mimeType || "application/octet-stream",
          size: doc.size || 0,
        }]);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick document");
    }
  };

  const handlePickMedia = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images", "videos"],
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const newFiles = result.assets.map(asset => ({
          uri: asset.uri,
          name: asset.fileName || `media_${Date.now()}`,
          type: asset.mimeType || (asset.type === "video" ? "video/mp4" : "image/jpeg"),
          size: asset.fileSize || 0,
        }));
        setAttachedFiles(prev => [...prev, ...newFiles]);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick media");
    }
  };

  const handleShowAttachOptions = () => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", "Photo or Video", "Document"],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) handlePickMedia();
          if (buttonIndex === 2) handlePickDocument();
        }
      );
    } else {
      Alert.alert(
        "Add Attachment",
        "Choose what to attach",
        [
          { text: "Photo or Video", onPress: handlePickMedia },
          { text: "Document", onPress: handlePickDocument },
          { text: "Cancel", style: "cancel" },
        ]
      );
    }
  };

  const handleRemoveFile = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (type: string): keyof typeof Feather.glyphMap => {
    if (type.startsWith("image/")) return "image";
    if (type.startsWith("video/")) return "video";
    if (type.includes("pdf")) return "file-text";
    if (type.includes("word") || type.includes("document")) return "file-text";
    return "file";
  };

  const handleSubmit = async () => {
    if (!submissionText.trim() && attachedFiles.length === 0) {
      Alert.alert("Empty Submission", "Please write something or attach a file before submitting.");
      return;
    }
    if (!user || !selectedAssignment) return;

    setIsSubmitting(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      const now = new Date();
      const dueDate = new Date(selectedAssignment.dueDate);
      const isLate = now > dueDate;

      const submission = await storage.submitAssignment({
        assignmentId: selectedAssignment.id,
        userId: user.id,
        content: submissionText,
        submittedAt: now.toISOString(),
        isLate,
        isConfirmed: false,
      });

      if (attachedFiles.length > 0) {
        setIsUploading(true);
        for (const file of attachedFiles) {
          try {
            await storage.uploadAttachment(submission.id, {
              uri: file.uri,
              name: file.name,
              type: file.type,
            });
          } catch (error) {
            console.error("Failed to upload file:", file.name, error);
          }
        }
        setIsUploading(false);
      }

      await loadAssignments();

      setIsModalVisible(false);
      setSelectedAssignment(null);
      setSubmissionText("");
      setAttachedFiles([]);
      setExistingAttachments([]);

      Alert.alert("Success", "Your assignment has been submitted! Your facilitator will confirm it.");
    } catch (error) {
      Alert.alert("Error", "Failed to submit assignment. Please try again.");
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  const renderAssignment = ({ item, index }: { item: AssignmentWithStatus; index: number }) => (
    <Animated.View entering={FadeInUp.delay(100 + index * 50).duration(400)}>
      <Card
        elevation={1}
        style={styles.assignmentCard}
        onPress={() => handleOpenAssignment(item)}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: theme.backgroundSecondary }]}>
            <Feather name="file-text" size={20} color={theme.link} />
          </View>
          <StatusBadge status={item.status} />
        </View>
        <ThemedText type="h4" style={styles.assignmentTitle}>
          {item.title}
        </ThemedText>
        <ThemedText
          type="small"
          style={{ color: theme.textSecondary }}
          numberOfLines={2}
        >
          {item.description}
        </ThemedText>
        <View style={styles.dueDate}>
          <Feather name="clock" size={14} color={theme.textSecondary} />
          <ThemedText
            type="small"
            style={{ color: theme.textSecondary, marginLeft: Spacing.xs }}
          >
            Due {formatDate(item.dueDate)}
          </ThemedText>
        </View>
      </Card>
    </Animated.View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Image
        source={require("../../assets/images/empty-assignments.png")}
        style={styles.emptyImage}
        resizeMode="contain"
      />
      <ThemedText type="h3" style={styles.emptyTitle}>
        No Assignments Yet
      </ThemedText>
      <ThemedText
        type="body"
        style={{ color: theme.textSecondary, textAlign: "center" }}
      >
        Assignments will appear here when your facilitator creates them
      </ThemedText>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={assignments}
        renderItem={renderAssignment}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: tabBarHeight + Spacing.xl,
          paddingHorizontal: Spacing.lg,
          flexGrow: 1,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.link}
            progressViewOffset={headerHeight}
          />
        }
      />

      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.backgroundRoot }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Pressable onPress={() => setIsModalVisible(false)} style={styles.closeButton}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
            <ThemedText type="h4" style={styles.modalTitle}>
              {selectedAssignment?.title}
            </ThemedText>
            <View style={styles.placeholder} />
          </View>

          <KeyboardAwareScrollViewCompat
            style={styles.modalContent}
            contentContainerStyle={styles.modalScrollContent}
          >
            <ThemedText type="body" style={{ marginBottom: Spacing.xl }}>
              {selectedAssignment?.description}
            </ThemedText>

            <View style={styles.dueInfo}>
              <Feather name="calendar" size={16} color={theme.warning} />
              <ThemedText type="small" style={{ color: theme.warning, marginLeft: Spacing.sm }}>
                Due {selectedAssignment ? formatDate(selectedAssignment.dueDate) : ""}
              </ThemedText>
            </View>

            <ThemedText type="h4" style={styles.submissionLabel}>
              Your Response
            </ThemedText>
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: theme.backgroundDefault,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
              placeholder="Write your response here..."
              placeholderTextColor={theme.textSecondary}
              value={submissionText}
              onChangeText={setSubmissionText}
              multiline
              textAlignVertical="top"
            />

            <View style={styles.attachmentSection}>
              <View style={styles.attachmentHeader}>
                <ThemedText type="h4">Attachments</ThemedText>
                <Pressable
                  onPress={handleShowAttachOptions}
                  style={[styles.attachButton, { backgroundColor: theme.backgroundSecondary }]}
                >
                  <Feather name="paperclip" size={18} color={theme.link} />
                  <ThemedText type="small" style={{ color: theme.link, marginLeft: Spacing.xs }}>
                    Add File
                  </ThemedText>
                </Pressable>
              </View>

              {existingAttachments.length > 0 ? (
                <View style={styles.fileList}>
                  <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.sm }}>
                    Previously uploaded:
                  </ThemedText>
                  {existingAttachments.map((attachment) => (
                    <View
                      key={attachment.id}
                      style={[styles.fileItem, { backgroundColor: theme.backgroundSecondary }]}
                    >
                      <Feather name={getFileIcon(attachment.fileType)} size={20} color={theme.link} />
                      <View style={styles.fileInfo}>
                        <ThemedText type="small" numberOfLines={1} style={{ flex: 1 }}>
                          {attachment.fileName}
                        </ThemedText>
                        <ThemedText type="small" style={{ color: theme.textSecondary }}>
                          {formatFileSize(attachment.fileSize)}
                        </ThemedText>
                      </View>
                    </View>
                  ))}
                </View>
              ) : null}

              {attachedFiles.length > 0 ? (
                <View style={styles.fileList}>
                  <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.sm }}>
                    New attachments:
                  </ThemedText>
                  {attachedFiles.map((file, index) => (
                    <View
                      key={`${file.name}-${index}`}
                      style={[styles.fileItem, { backgroundColor: theme.backgroundSecondary }]}
                    >
                      <Feather name={getFileIcon(file.type)} size={20} color={theme.link} />
                      <View style={styles.fileInfo}>
                        <ThemedText type="small" numberOfLines={1} style={{ flex: 1 }}>
                          {file.name}
                        </ThemedText>
                        <ThemedText type="small" style={{ color: theme.textSecondary }}>
                          {formatFileSize(file.size)}
                        </ThemedText>
                      </View>
                      <Pressable
                        onPress={() => handleRemoveFile(index)}
                        hitSlop={8}
                      >
                        <Feather name="x-circle" size={20} color={theme.error} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              ) : existingAttachments.length === 0 ? (
                <View style={[styles.noFiles, { borderColor: theme.border }]}>
                  <Feather name="upload-cloud" size={32} color={theme.textSecondary} />
                  <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.sm }}>
                    No files attached
                  </ThemedText>
                  <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: "center" }}>
                    Tap "Add File" to attach documents, photos, or videos
                  </ThemedText>
                </View>
              ) : null}
            </View>

            <Button
              onPress={handleSubmit}
              style={styles.submitButton}
              disabled={isSubmitting || isUploading}
            >
              {isUploading ? "Uploading files..." : isSubmitting ? "Submitting..." : "Submit Assignment"}
            </Button>
          </KeyboardAwareScrollViewCompat>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  assignmentCard: {
    marginBottom: Spacing.lg,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  statusBadge: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  assignmentTitle: {
    marginBottom: Spacing.sm,
  },
  dueDate: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.md,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing["2xl"],
  },
  emptyImage: {
    width: 160,
    height: 160,
    marginBottom: Spacing.xl,
    opacity: 0.8,
  },
  emptyTitle: {
    marginBottom: Spacing.sm,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    flex: 1,
    textAlign: "center",
  },
  placeholder: {
    width: 40,
  },
  modalContent: {
    flex: 1,
  },
  modalScrollContent: {
    padding: Spacing.xl,
    paddingBottom: Spacing["4xl"],
  },
  dueInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  submissionLabel: {
    marginBottom: Spacing.md,
  },
  textArea: {
    minHeight: 150,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  submitButton: {
    width: "100%",
  },
  attachmentSection: {
    marginBottom: Spacing.xl,
  },
  attachmentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  attachButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  fileList: {
    marginTop: Spacing.sm,
  },
  fileItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  fileInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  noFiles: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: BorderRadius.md,
  },
});
