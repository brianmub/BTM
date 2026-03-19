import React from 'react';
import { View, StyleSheet, ScrollView, Pressable, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Constants from 'expo-constants';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Card } from '@/components/Card';
import { Spacing, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();

  const appVersion = Constants.expoConfig?.version || '1.0.0';
  const buildNumber = Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode || '1';

  const handlePrivacyPolicy = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Linking.openURL('https://example.com/privacy');
    } catch (error) {
      console.log('Could not open URL');
    }
  };

  const handleTermsOfService = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Linking.openURL('https://example.com/terms');
    } catch (error) {
      console.log('Could not open URL');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: headerHeight + Spacing.lg, paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInUp.duration(400)}>
          <Card elevation={1} style={styles.logoCard}>
            <View style={[styles.logoContainer, { backgroundColor: theme.primary }]}>
              <ThemedText type="h1" style={{ color: '#FFFFFF', fontWeight: '700' }}>
                BTM
              </ThemedText>
            </View>
            <ThemedText type="h2" style={{ marginTop: Spacing.lg }}>
              Basic Training for Ministry
            </ThemedText>
            <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.sm }}>
              Version {appVersion} (Build {buildNumber})
            </ThemedText>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(100).duration(400)}>
          <Card elevation={1} style={styles.descriptionCard}>
            <ThemedText type="body" style={{ color: theme.textSecondary, lineHeight: 24, textAlign: 'center' }}>
              BTM is a comprehensive mobile application designed to help manage program enrollment, 
              cell group assignments, attendance tracking, and graduation progress for ministry training programs.
            </ThemedText>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).duration(400)}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Features
          </ThemedText>
          <Card elevation={1} style={styles.featuresCard}>
            <View style={styles.featureRow}>
              <Feather name="users" size={20} color={theme.primary} />
              <ThemedText type="body" style={{ marginLeft: Spacing.md, flex: 1 }}>
                Multiple program enrollment
              </ThemedText>
            </View>
            <View style={styles.featureRow}>
              <Feather name="calendar" size={20} color={theme.primary} />
              <ThemedText type="body" style={{ marginLeft: Spacing.md, flex: 1 }}>
                Session scheduling and attendance
              </ThemedText>
            </View>
            <View style={styles.featureRow}>
              <Feather name="check-square" size={20} color={theme.primary} />
              <ThemedText type="body" style={{ marginLeft: Spacing.md, flex: 1 }}>
                QR code check-in and check-out
              </ThemedText>
            </View>
            <View style={styles.featureRow}>
              <Feather name="file-text" size={20} color={theme.primary} />
              <ThemedText type="body" style={{ marginLeft: Spacing.md, flex: 1 }}>
                Assignment submission and tracking
              </ThemedText>
            </View>
            <View style={styles.featureRow}>
              <Feather name="award" size={20} color={theme.primary} />
              <ThemedText type="body" style={{ marginLeft: Spacing.md, flex: 1 }}>
                Graduation eligibility tracking
              </ThemedText>
            </View>
            <View style={styles.featureRow}>
              <Feather name="bell" size={20} color={theme.primary} />
              <ThemedText type="body" style={{ marginLeft: Spacing.md, flex: 1 }}>
                Push notifications and reminders
              </ThemedText>
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(300).duration(400)}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Legal
          </ThemedText>
          <Card elevation={1} style={styles.legalCard}>
            <Pressable style={styles.legalRow} onPress={handlePrivacyPolicy}>
              <Feather name="shield" size={20} color={theme.textSecondary} />
              <ThemedText type="body" style={{ marginLeft: Spacing.md, flex: 1 }}>
                Privacy Policy
              </ThemedText>
              <Feather name="external-link" size={16} color={theme.link} />
            </Pressable>
            <View style={[styles.divider, { backgroundColor: theme.backgroundSecondary }]} />
            <Pressable style={styles.legalRow} onPress={handleTermsOfService}>
              <Feather name="file" size={20} color={theme.textSecondary} />
              <ThemedText type="body" style={{ marginLeft: Spacing.md, flex: 1 }}>
                Terms of Service
              </ThemedText>
              <Feather name="external-link" size={16} color={theme.link} />
            </Pressable>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400).duration(400)}>
          <View style={styles.footer}>
            <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: 'center' }}>
              Made with love for ministry training
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: 'center', marginTop: Spacing.xs }}>
              2024 BTM App. All rights reserved.
            </ThemedText>
          </View>
        </Animated.View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.xl,
  },
  logoCard: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
    marginBottom: Spacing.lg,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  descriptionCard: {
    marginBottom: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  featuresCard: {
    marginBottom: Spacing.xl,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  legalCard: {
    marginBottom: Spacing.xl,
  },
  legalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  divider: {
    height: 1,
  },
  footer: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
});
