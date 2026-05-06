import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Image, Alert } from 'react-native';
import { theme } from '../../lib/theme';
import { useAuth } from '../../hooks/useAuth';
import { useTenant } from '../../hooks/useTenant';
import { supabase } from '../../lib/supabase';
import { Search, Calendar, CheckCircle2, Loader2, Award } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Program } from '../../lib/types';

export default function ProgramsScreen() {
    const { profile } = useAuth();
    const { organization } = useTenant();
    const router = useRouter();

    const [programs, setPrograms] = useState<Program[]>([]);
    const [enrolledProgramIds, setEnrolledProgramIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [enrollingId, setEnrollingId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (organization && profile) {
            fetchData();
        }
    }, [organization, profile]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const { data: progs, error: progError } = await supabase
                .from('programs')
                .select('*')
                .eq('organization_id', organization?.id)
                .eq('status', 'active')
                .eq('is_visible', true)
                .order('start_date', { ascending: true });

            if (progError) throw progError;
            setPrograms(progs || []);

            const { data: enrolls, error: enrollError } = await supabase
                .from('enrollments')
                .select('program_id')
                .eq('user_id', profile?.id)
                .in('status', ['enrolled', 'active', 'pending']);

            if (enrollError) throw enrollError;
            setEnrolledProgramIds(enrolls?.map(e => e.program_id) || []);
        } catch (err) {
            console.error('Error fetching programs:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleEnroll = async (programId: string) => {
        if (!organization || !profile) return;
        try {
            setEnrollingId(programId);

            const { data: newEnrollment, error } = await supabase
                .from('enrollments')
                .insert([{
                    organization_id: organization.id,
                    user_id: profile.id,
                    program_id: programId,
                    payment_status: 'paid',
                    amount_due: 0,
                    enrollment_source: 'mobile_app',
                }])
                .select()
                .single();

            if (error) {
                if (error.code === '23505') {
                    throw new Error('You are already enrolled in this program.');
                }
                throw error;
            }

            if (newEnrollment?.id) {
                await supabase
                    .from('enrollments')
                    .update({ status: 'active' })
                    .eq('id', newEnrollment.id);
            }

            Alert.alert('Success', 'You have successfully joined the program!');
            fetchData(); // Refresh enrollments

            // NOTE: In the future we can route to a Program Detail screen here.

        } catch (err: any) {
            Alert.alert('Enrollment Failed', err.message || 'An error occurred.');
        } finally {
            setEnrollingId(null);
        }
    };

    const filteredPrograms = programs.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Discover Programs</Text>
                <Text style={styles.headerSubtitle}>Find your next step in the journey.</Text>
            </View>

            <View style={styles.searchContainer}>
                <Search size={18} color={theme.colors.textMuted} style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search courses..."
                    placeholderTextColor={theme.colors.textMuted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.listContainer}>
                    {filteredPrograms.length > 0 ? (
                        filteredPrograms.map(program => {
                            const isEnrolled = enrolledProgramIds.includes(program.id);
                            return (
                                <View key={program.id} style={styles.programCard}>
                                    <View style={styles.imageContainer}>
                                        {program.image_url ? (
                                            <Image source={{ uri: program.image_url }} style={styles.programImage} />
                                        ) : (
                                            <View style={styles.imagePlaceholder}>
                                                <Award size={32} color={theme.colors.primary + '60'} />
                                            </View>
                                        )}
                                        <View style={styles.categoryBadge}>
                                            <Text style={styles.categoryText}>{program.category || 'General'}</Text>
                                        </View>
                                    </View>

                                    <View style={styles.programInfo}>
                                        <Text style={styles.programName}>{program.name}</Text>
                                        <Text style={styles.programDescription} numberOfLines={2}>
                                            {program.description || 'No description provided.'}
                                        </Text>

                                        <View style={styles.metaRow}>
                                            <Calendar size={12} color={theme.colors.primary} />
                                            <Text style={styles.metaText}>
                                                Starts {new Date(program.start_date).toLocaleDateString()}
                                            </Text>
                                        </View>

                                        {isEnrolled ? (
                                            <TouchableOpacity
                                                style={styles.enrolledBtn}
                                                onPress={() => router.push('/(tabs)')}
                                            >
                                                <CheckCircle2 size={16} color={theme.colors.success} />
                                                <Text style={styles.enrolledBtnText}>Enrolled</Text>
                                            </TouchableOpacity>
                                        ) : (
                                            <TouchableOpacity
                                                style={styles.enrollBtn}
                                                onPress={() => handleEnroll(program.id)}
                                                disabled={enrollingId === program.id}
                                            >
                                                {enrollingId === program.id ? (
                                                    <ActivityIndicator size="small" color="#fff" />
                                                ) : (
                                                    <Text style={styles.enrollBtnText}>Join the Program</Text>
                                                )}
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>
                            );
                        })
                    ) : (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>
                                {programs.length === 0 ? 'No active programs available.' : 'No programs match your search.'}
                            </Text>
                        </View>
                    )}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        padding: theme.spacing.lg,
        paddingTop: theme.spacing.xl,
        paddingBottom: theme.spacing.sm,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: theme.colors.text,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    headerSubtitle: {
        fontSize: 14,
        color: theme.colors.textMuted,
        marginTop: 4,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.card,
        marginHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        paddingHorizontal: theme.spacing.md,
    },
    searchIcon: {
        marginRight: theme.spacing.sm,
    },
    searchInput: {
        flex: 1,
        height: 48,
        color: theme.colors.text,
        fontSize: 14,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContainer: {
        padding: theme.spacing.lg,
        paddingTop: 0,
        gap: theme.spacing.md,
    },
    programCard: {
        backgroundColor: theme.colors.card,
        borderRadius: theme.borderRadius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        overflow: 'hidden',
    },
    imageContainer: {
        height: 140,
        backgroundColor: theme.colors.background,
        position: 'relative',
    },
    programImage: {
        width: '100%',
        height: '100%',
        opacity: 0.8,
    },
    imagePlaceholder: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(220, 38, 38, 0.05)',
    },
    categoryBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: 'rgba(24, 24, 27, 0.8)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: theme.borderRadius.sm,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    categoryText: {
        fontSize: 10,
        fontWeight: '900',
        color: theme.colors.text,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    programInfo: {
        padding: theme.spacing.md,
    },
    programName: {
        fontSize: 18,
        fontWeight: '900',
        color: theme.colors.text,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 6,
    },
    programDescription: {
        fontSize: 12,
        color: theme.colors.textMuted,
        lineHeight: 18,
        marginBottom: 12,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 16,
    },
    metaText: {
        fontSize: 11,
        fontWeight: '700',
        color: theme.colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    enrollBtn: {
        backgroundColor: theme.colors.primary,
        height: 48,
        borderRadius: theme.borderRadius.sm,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    enrollBtnText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    enrolledBtn: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.3)',
        height: 48,
        borderRadius: theme.borderRadius.sm,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    enrolledBtnText: {
        color: theme.colors.success,
        fontSize: 12,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    emptyState: {
        paddingVertical: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: theme.colors.textMuted,
        fontSize: 14,
    }
});
