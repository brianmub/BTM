import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { theme } from '../../lib/theme';
import { supabase } from '../../lib/supabase';
import { UserCircle2, Phone, Mail, Save, LogOut, Camera } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { decode } from 'base64-arraybuffer';

export default function ProfileScreen() {
    const { profile, user, signOut } = useAuth(); // Assume signOut exists in useAuth per previous file
    const router = useRouter();

    const [firstName, setFirstName] = useState(profile?.first_name || '');
    const [lastName, setLastName] = useState(profile?.surname || '');
    const [phone, setPhone] = useState(profile?.phone_number || '');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url || null);
    const [saving, setSaving] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    const handleSave = async () => {
        if (!profile) return;
        setSaving(true);
        try {
            const { error } = await supabase
                .from('users')
                .update({
                    first_name: firstName,
                    surname: lastName,
                    phone_number: phone,
                    avatar_url: avatarUrl
                })
                .eq('id', profile.id);

            if (error) throw error;
            Alert.alert('Success', 'Profile updated successfully');
            // If you have a refreshProfile in useAuth, call it here. Otherwise, state might be slightly stale until reload.
        } catch (err: any) {
            Alert.alert('Error', err.message);
        } finally {
            setSaving(false);
        }
    };

    const handlePickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: 'images',
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
                base64: true,
            });

            if (!result.canceled && result.assets[0].base64) {
                await uploadAvatar(result.assets[0].base64);
            }
        } catch (error) {
            Alert.alert('Error picking image', 'Please try again.');
        }
    };

    const uploadAvatar = async (base64Image: string) => {
        if (!profile) return;
        setUploadingAvatar(true);
        try {
            const fileName = `avatar_${profile.id}_${Date.now()}.png`;
            const filePath = `${profile.organization_id}/${fileName}`;

            // Upload the base64 string
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, decode(base64Image), {
                    contentType: 'image/png',
                    upsert: true
                });

            if (uploadError) throw uploadError;

            // Get Public URL
            const { data: publicUrlData } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            const publicUrl = publicUrlData.publicUrl;

            // Update local state immediately
            setAvatarUrl(publicUrl);

            // Also save to database
            const { error: updateError } = await supabase
                .from('users')
                .update({ avatar_url: publicUrl })
                .eq('id', profile.id);

            if (updateError) throw updateError;

        } catch (err: any) {
            Alert.alert('Upload Failed', err.message || 'Could not upload profile picture.');
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleSignOut = async () => {
        try {
            if (signOut) {
                await signOut();
            } else {
                await supabase.auth.signOut();
            }
            router.replace('/');
        } catch (err: any) {
            Alert.alert('Error', err.message);
        }
    };

    if (!profile) return null;

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.avatarContainer} onPress={handlePickImage} disabled={uploadingAvatar}>
                    {uploadingAvatar ? (
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                    ) : avatarUrl ? (
                        <Image source={avatarUrl} style={styles.avatarImage} contentFit="cover" />
                    ) : (
                        <UserCircle2 size={80} color={theme.colors.primary} />
                    )}
                    <View style={styles.cameraIconBadge}>
                        <Camera size={14} color="#fff" />
                    </View>
                </TouchableOpacity>
                <Text style={styles.name}>{profile.first_name} {profile.surname}</Text>
                <Text style={styles.role}>{profile.role}</Text>
            </View>

            <View style={styles.formContainer}>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>First Name</Text>
                    <View style={styles.inputWrapper}>
                        <UserCircle2 size={20} color={theme.colors.textMuted} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            value={firstName}
                            onChangeText={setFirstName}
                            placeholder="First Name"
                            placeholderTextColor={theme.colors.textMuted}
                        />
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Last Name</Text>
                    <View style={styles.inputWrapper}>
                        <UserCircle2 size={20} color={theme.colors.textMuted} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            value={lastName}
                            onChangeText={setLastName}
                            placeholder="Last Name"
                            placeholderTextColor={theme.colors.textMuted}
                        />
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Phone Number</Text>
                    <View style={styles.inputWrapper}>
                        <Phone size={20} color={theme.colors.textMuted} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            value={phone}
                            onChangeText={setPhone}
                            placeholder="Phone Number"
                            placeholderTextColor={theme.colors.textMuted}
                            keyboardType="phone-pad"
                        />
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Email Address</Text>
                    <View style={[styles.inputWrapper, styles.disabledInput]}>
                        <Mail size={20} color={theme.colors.textMuted} style={styles.inputIcon} />
                        <TextInput
                            style={[styles.input, { color: theme.colors.textMuted }]}
                            value={user?.email || profile.email || ''}
                            editable={false}
                        />
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.saveBtn}
                    onPress={handleSave}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <>
                            <Save size={20} color="#fff" />
                            <Text style={styles.saveBtnText}>Save Changes</Text>
                        </>
                    )}
                </TouchableOpacity>

                <View style={styles.divider} />

                <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
                    <LogOut size={20} color={theme.colors.error} />
                    <Text style={styles.signOutBtnText}>Sign Out</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    content: {
        padding: 20,
        paddingTop: 60,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    avatarContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: theme.colors.border,
        marginBottom: 16,
        position: 'relative',
    },
    avatarImage: {
        width: 96,
        height: 96,
        borderRadius: 48,
    },
    cameraIconBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: theme.colors.primary,
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: theme.colors.background,
    },
    name: {
        color: theme.colors.text,
        fontSize: 24,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    role: {
        color: theme.colors.primary,
        fontSize: 12,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginTop: 4,
    },
    formContainer: {
        backgroundColor: theme.colors.card,
        borderRadius: theme.borderRadius.xl,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        color: theme.colors.textMuted,
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.md,
        height: 50,
        paddingHorizontal: 16,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        color: theme.colors.text,
        fontSize: 14,
        fontWeight: '600',
    },
    disabledInput: {
        backgroundColor: 'transparent',
        opacity: 0.7,
    },
    saveBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: theme.colors.primary,
        height: 52,
        borderRadius: theme.borderRadius.md,
        marginTop: 10,
    },
    saveBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    divider: {
        height: 1,
        backgroundColor: theme.colors.border,
        marginVertical: 24,
    },
    signOutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        height: 52,
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
        backgroundColor: 'rgba(239, 68, 68, 0.05)',
    },
    signOutBtnText: {
        color: theme.colors.error,
        fontSize: 12,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
    }
});
