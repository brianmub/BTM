import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Linking, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Card } from '@/components/Card';
import { Spacing, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

interface FAQItem {
  question: string;
  answer: string;
}

const faqItems: FAQItem[] = [
  {
    question: 'How do I check in to a session?',
    answer: 'Go to the Sessions tab, find your session, and tap "Check In". You can also scan a QR code displayed by your cell leader to check in quickly.',
  },
  {
    question: 'What are the graduation requirements?',
    answer: 'To graduate, you need to attend at least 5 sessions with leader confirmation and complete all required assignments for the program.',
  },
  {
    question: 'How do I submit an assignment?',
    answer: 'Go to the Tasks tab, find the assignment you want to submit, and tap on it to enter your response. Your cell leader will confirm your submission.',
  },
  {
    question: 'How do I know which cell group I belong to?',
    answer: 'After enrollment closes, the system admin will assign you to a cell group. You can see your cell assignment on the Home screen once assigned.',
  },
  {
    question: 'How do payments work?',
    answer: 'Session payments are recorded by your cell leader. You can view your payment history in your Profile under Payment History.',
  },
  {
    question: 'Can I enroll in multiple programs?',
    answer: 'Yes! You can enroll in multiple programs from the Programs tab. Each program has its own sessions, assignments, and graduation requirements.',
  },
];

function FAQAccordion({ item, index }: { item: FAQItem; index: number }) {
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(false);

  const toggleExpanded = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpanded(!expanded);
  };

  return (
    <Animated.View entering={FadeInUp.delay(100 + index * 50).duration(400)}>
      <Card elevation={1} style={styles.faqCard}>
        <Pressable onPress={toggleExpanded} style={styles.faqHeader}>
          <ThemedText type="body" style={{ flex: 1, fontWeight: '600' }}>
            {item.question}
          </ThemedText>
          <Feather
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={theme.textSecondary}
          />
        </Pressable>
        {expanded ? (
          <View style={[styles.faqAnswer, { borderTopColor: theme.backgroundSecondary }]}>
            <ThemedText type="body" style={{ color: theme.textSecondary, lineHeight: 22 }}>
              {item.answer}
            </ThemedText>
          </View>
        ) : null}
      </Card>
    </Animated.View>
  );
}

export default function HelpSupportScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();

  const handleEmailSupport = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const email = 'support@btmapp.com';
    const subject = 'BTM App Support Request';
    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
    
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.log('Could not open email client');
    }
  };

  const handleCallSupport = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const phone = '+1234567890';
    const url = Platform.OS === 'ios' ? `telprompt:${phone}` : `tel:${phone}`;
    
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.log('Could not open phone app');
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
          <Card elevation={1} style={styles.contactCard}>
            <View style={[styles.contactIcon, { backgroundColor: theme.primary + '20' }]}>
              <Feather name="headphones" size={28} color={theme.primary} />
            </View>
            <ThemedText type="h3" style={{ marginTop: Spacing.lg }}>
              Need Help?
            </ThemedText>
            <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: 'center', marginTop: Spacing.sm }}>
              We're here to help you with any questions or issues
            </ThemedText>
            
            <View style={styles.contactButtons}>
              <Pressable
                onPress={handleEmailSupport}
                style={[styles.contactButton, { backgroundColor: theme.primary + '10' }]}
              >
                <Feather name="mail" size={20} color={theme.primary} />
                <ThemedText type="body" style={{ color: theme.primary, marginLeft: Spacing.sm, fontWeight: '600' }}>
                  Email Us
                </ThemedText>
              </Pressable>
              
              <Pressable
                onPress={handleCallSupport}
                style={[styles.contactButton, { backgroundColor: theme.success + '10' }]}
              >
                <Feather name="phone" size={20} color={theme.success} />
                <ThemedText type="body" style={{ color: theme.success, marginLeft: Spacing.sm, fontWeight: '600' }}>
                  Call Us
                </ThemedText>
              </Pressable>
            </View>
          </Card>
        </Animated.View>

        <ThemedText type="h4" style={styles.sectionTitle}>
          Frequently Asked Questions
        </ThemedText>

        {faqItems.map((item, index) => (
          <FAQAccordion key={index} item={item} index={index} />
        ))}

        <Animated.View entering={FadeInUp.delay(400).duration(400)}>
          <Card elevation={1} style={styles.tipsCard}>
            <View style={styles.tipsHeader}>
              <Feather name="zap" size={20} color={theme.warning} />
              <ThemedText type="h4" style={{ marginLeft: Spacing.sm }}>
                Quick Tips
              </ThemedText>
            </View>
            <View style={styles.tipsList}>
              <View style={styles.tipItem}>
                <Feather name="check" size={16} color={theme.success} />
                <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.sm, flex: 1 }}>
                  Check in early to ensure your attendance is recorded
                </ThemedText>
              </View>
              <View style={styles.tipItem}>
                <Feather name="check" size={16} color={theme.success} />
                <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.sm, flex: 1 }}>
                  Submit assignments before the deadline to avoid late marks
                </ThemedText>
              </View>
              <View style={styles.tipItem}>
                <Feather name="check" size={16} color={theme.success} />
                <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.sm, flex: 1 }}>
                  Enable notifications to get session and assignment reminders
                </ThemedText>
              </View>
            </View>
          </Card>
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
  contactCard: {
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
    marginBottom: Spacing.xl,
  },
  contactIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  faqCard: {
    marginBottom: Spacing.md,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  faqAnswer: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  tipsCard: {
    marginTop: Spacing.lg,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  tipsList: {
    gap: Spacing.sm,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
});
