import React, { useState } from 'react';
import { View, StyleSheet, TextInput, Alert, Pressable, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
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
  const { user, updateUser: updateAuthUser, deleteAccount } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [churchName, setChurchName] = useState(user?.churchName || '');
  const [suburb, setSuburb] = useState(user?.suburb || '');
  const [cityTown, setCityTown] = useState(user?.cityTown || '');
  const [province, setProvince] = useState(user?.province || '');
  const [country, setCountry] = useState(user?.country || 'Zimbabwe');
  const [residentialAddress, setResidentialAddress] = useState(user?.residentialAddress || '');
  const [dob, setDob] = useState(user?.dob || '');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!fullName.trim() || !phone.trim() || !email.trim()) {
      Alert.alert('Error', 'Please fill in all basic fields');
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
          churchName: churchName.trim(),
          residentialAddress: residentialAddress.trim(),
          dob: dob.trim(),
          suburb: suburb.trim(),
          cityTown: cityTown.trim(),
          province: province.trim(),
          country: country.trim(),
        };
        await storage.updateUser(user.id, updates);
        await updateAuthUser(updates);
        Alert.alert('Success', 'Your profile has been updated');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Update error:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action is irreversible and all your data will be permanently removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              setSaving(true);
              await deleteAccount();
              // AuthContext should handle redirection as user becomes null
            } catch (error) {
              Alert.alert('Error', 'Failed to delete account. Please try again.');
            } finally {
              setSaving(false);
            }
          }
        },
      ]
    );
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

            <View style={styles.inputGroup}>
              <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>
                Church / Ministry
              </ThemedText>
              <View style={[styles.inputContainer, { borderColor: theme.textSecondary + '40' }]}>
                <Feather name="home" size={18} color={theme.textSecondary} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  value={churchName}
                  onChangeText={setChurchName}
                  placeholder="Enter your church"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>
                Date of Birth
              </ThemedText>
              <Pressable
                onPress={() => setShowDatePicker(true)}
                style={[styles.inputContainer, { borderColor: theme.textSecondary + '40', minHeight: 48, justifyContent: 'center' }]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Feather name="calendar" size={18} color={theme.textSecondary} />
                  <ThemedText style={{ marginLeft: Spacing.sm, color: dob ? theme.text : theme.textSecondary }}>
                    {dob || "Select Date of Birth"}
                  </ThemedText>
                </View>
              </Pressable>
              {showDatePicker && (
                <DateTimePicker
                  value={dob ? new Date(dob) : new Date(2000, 0, 1)}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(Platform.OS === 'ios');
                    if (selectedDate) {
                      const year = selectedDate.getFullYear();
                      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                      const day = String(selectedDate.getDate()).padStart(2, '0');
                      setDob(`${year}-${month}-${day}`);
                    }
                  }}
                  maximumDate={new Date()}
                />
              )}
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(150).duration(400)}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Location
          </ThemedText>
          <Card elevation={1} style={styles.formCard}>
            <View style={styles.inputGroup}>
              <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>
                Country
              </ThemedText>
              <View style={[styles.inputContainer, { borderColor: theme.textSecondary + '40' }]}>
                <Feather name="globe" size={18} color={theme.textSecondary} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  value={country}
                  onChangeText={setCountry}
                  placeholder="e.g. Zimbabwe"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>
                Residential Address
              </ThemedText>
              <View style={[styles.inputContainer, { borderColor: theme.textSecondary + '40' }]}>
                <Feather name="map-pin" size={18} color={theme.textSecondary} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  value={residentialAddress}
                  onChangeText={setResidentialAddress}
                  placeholder="House number, street name"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>
                Province
              </ThemedText>
              <View style={[styles.inputContainer, { borderColor: theme.textSecondary + '40' }]}>
                <Feather name="map" size={18} color={theme.textSecondary} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  value={province}
                  onChangeText={setProvince}
                  placeholder="e.g. Harare"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>
                City / Town
              </ThemedText>
              <View style={[styles.inputContainer, { borderColor: theme.textSecondary + '40' }]}>
                <Feather name="map-pin" size={18} color={theme.textSecondary} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  value={cityTown}
                  onChangeText={setCityTown}
                  placeholder="e.g. Chitungwiza"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>
                Suburb
              </ThemedText>
              <View style={[styles.inputContainer, { borderColor: theme.textSecondary + '40' }]}>
                <Feather name="grid" size={18} color={theme.textSecondary} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  value={suburb}
                  onChangeText={setSuburb}
                  placeholder="e.g. Epworth"
                  placeholderTextColor={theme.textSecondary}
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

          <Button 
            onPress={handleDeleteAccount} 
            disabled={saving} 
            variant="outline"
            style={{ 
              marginTop: Spacing.lg, 
              borderColor: '#ef4444', 
              borderWidth: 1 
            }}
          >
            <ThemedText style={{ color: '#ef4444', fontWeight: 'bold' }}>
              Delete Account
            </ThemedText>
          </Button>
          
          <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: 'center', marginTop: Spacing.md }}>
            Permanently remove your account and all associated data
          </ThemedText>
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
