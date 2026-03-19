import React, { useState } from 'react';
import { View, StyleSheet, TextInput, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Spacing, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { storage } from '@/lib/storage';

export default function AccountSettingsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { user, updateUser: updateAuthUser } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!fullName.trim() || !phone.trim() || !email.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setSaving(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      if (user) {
        const updates = {
          fullName: fullName.trim(),
          phone: phone.trim(),
          email: email.trim(),
        };
        await storage.updateUser(user.id, updates);
        await updateAuthUser(updates);
        Alert.alert('Success', 'Your profile has been updated');
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[
          styles.content,
          { paddingTop: headerHeight + Spacing.lg, paddingBottom: insets.bottom + 100 },
        ]}
      >
        <Animated.View entering={FadeInUp.duration(400)}>
          <Card elevation={1} style={styles.avatarCard}>
            <View style={[styles.avatar, { backgroundColor: theme.primary + '20' }]}>
              <ThemedText type="h1" style={{ color: theme.primary }}>
                {fullName.charAt(0).toUpperCase() || 'U'}
              </ThemedText>
            </View>
            <ThemedText type="h3" style={{ marginTop: Spacing.md }}>
              {fullName || 'Your Name'}
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.xs }}>
              {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'}
            </ThemedText>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(100).duration(400)}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Personal Information
          </ThemedText>
          <Card elevation={1} style={styles.formCard}>
            <View style={styles.inputGroup}>
              <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>
                Full Name
              </ThemedText>
              <View style={[styles.inputContainer, { borderColor: theme.textSecondary + '40' }]}>
                <Feather name="user" size={18} color={theme.textSecondary} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Enter your full name"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>
                Phone Number
              </ThemedText>
              <View style={[styles.inputContainer, { borderColor: theme.textSecondary + '40' }]}>
                <Feather name="phone" size={18} color={theme.textSecondary} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Enter your phone number"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>
                Email Address
              </ThemedText>
              <View style={[styles.inputContainer, { borderColor: theme.textSecondary + '40' }]}>
                <Feather name="mail" size={18} color={theme.textSecondary} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).duration(400)}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Account Details
          </ThemedText>
          <Card elevation={1} style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <ThemedText type="body" style={{ color: theme.textSecondary }}>Role</ThemedText>
              <ThemedText type="body" style={{ fontWeight: '600' }}>
                {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Unknown'}
              </ThemedText>
            </View>
            <View style={[styles.divider, { backgroundColor: theme.backgroundSecondary }]} />
            <View style={styles.detailRow}>
              <ThemedText type="body" style={{ color: theme.textSecondary }}>Gender</ThemedText>
              <ThemedText type="body" style={{ fontWeight: '600' }}>
                {user?.gender ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1) : 'Not set'}
              </ThemedText>
            </View>
            <View style={[styles.divider, { backgroundColor: theme.backgroundSecondary }]} />
            <View style={styles.detailRow}>
              <ThemedText type="body" style={{ color: theme.textSecondary }}>Marital Status</ThemedText>
              <ThemedText type="body" style={{ fontWeight: '600' }}>
                {user?.maritalStatus ? user.maritalStatus.charAt(0).toUpperCase() + user.maritalStatus.slice(1) : 'Not set'}
              </ThemedText>
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(300).duration(400)}>
          <Button onPress={handleSave} disabled={saving} style={{ marginTop: Spacing.xl }}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </Animated.View>
      </KeyboardAwareScrollViewCompat>
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
  avatarCard: {
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
    marginBottom: Spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  formCard: {
    marginBottom: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  input: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: 16,
    paddingVertical: Spacing.xs,
  },
  detailsCard: {
    marginBottom: Spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
  },
  divider: {
    height: 1,
  },
});
