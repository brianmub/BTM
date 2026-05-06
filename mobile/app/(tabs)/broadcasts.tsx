import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../lib/theme';
import { useAuth } from '../../hooks/useAuth';
import { broadcastService, Broadcast } from '../../services/broadcastService';
import { PlayCircle, Newspaper, Image as ImageIcon, ExternalLink } from 'lucide-react-native';

type TabType = 'podcast' | 'news' | 'story';

export default function BroadcastsScreen() {
    const { profile } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>('podcast');
    const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadBroadcasts = async () => {
        if (!profile?.organization_id) return;
        try {
            const data = await broadcastService.getPublishedBroadcasts(profile.organization_id);
            setBroadcasts(data);
        } catch (error) {
            console.error('Failed to load broadcasts', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadBroadcasts();
        setRefreshing(false);
    }, [profile?.organization_id]);

    useEffect(() => {
        loadBroadcasts();
    }, [profile?.organization_id]);

    const filteredBroadcasts = broadcasts.filter(b => b.type === activeTab);

    const renderTab = (type: TabType, label: string, Icon: any) => {
        const isActive = activeTab === type;
        return (
            <TouchableOpacity
                style={[styles.tab, isActive && styles.tabActive]}
                onPress={() => setActiveTab(type)}
            >
                <Icon color={isActive ? theme.colors.primary : theme.colors.textMuted} size={18} style={styles.tabIcon} />
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{label}</Text>
            </TouchableOpacity>
        );
    };

    const renderBroadcastCard = (broadcast: Broadcast) => {
        return (
            <TouchableOpacity
                key={broadcast.id}
                style={styles.card}
                onPress={() => broadcast.media_url ? Linking.openURL(broadcast.media_url) : null}
                activeOpacity={broadcast.media_url ? 0.7 : 1}
            >
                <View style={[styles.cardMediaPlaceholder, !broadcast.media_url && { height: 'auto', padding: 16, backgroundColor: theme.colors.primary + '10' }]}>
                    {broadcast.media_url ? (
                        <>
                            {broadcast.type === 'podcast' && <PlayCircle color="#fff" size={48} />}
                            {broadcast.type === 'news' && <Newspaper color="#fff" size={48} />}
                            {broadcast.type === 'story' && <ImageIcon color="#fff" size={48} />}
                        </>
                    ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Newspaper color={theme.colors.primary} size={24} style={{ marginRight: 8 }} />
                            <Text style={{ color: theme.colors.primary, fontWeight: 'bold' }}>News Update</Text>
                        </View>
                    )}
                    <View style={broadcast.media_url ? styles.cardBadge : { position: 'absolute', top: 16, right: 16, backgroundColor: theme.colors.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                        <Text style={styles.cardBadgeText}>{broadcast.type.toUpperCase()}</Text>
                    </View>
                </View>
                <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>{broadcast.title}</Text>
                    {broadcast.description ? (
                        <Text style={{ fontSize: 14, color: theme.colors.textMuted, marginBottom: 16, lineHeight: 20 }}>
                            {broadcast.description}
                        </Text>
                    ) : null}
                    <View style={styles.cardFooter}>
                        <Text style={styles.cardDate}>
                            {new Date(broadcast.published_at || broadcast.created_at).toLocaleString()}
                        </Text>
                        {broadcast.media_url && <ExternalLink color={theme.colors.primary} size={16} />}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.centerContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>MUTV Media</Text>
                <Text style={styles.headerSubtitle}>Catch up on the latest from your organization</Text>
            </View>

            <View style={styles.tabsContainer}>
                {renderTab('podcast', 'Podcasts', PlayCircle)}
                {renderTab('news', 'News', Newspaper)}
                {renderTab('story', 'Stories', ImageIcon)}
            </View>

            <ScrollView
                style={styles.scrollContainer}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
            >
                {filteredBroadcasts.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No {activeTab}s available right now.</Text>
                    </View>
                ) : (
                    filteredBroadcasts.map(renderBroadcastCard)
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
    },
    header: {
        padding: 20,
        backgroundColor: theme.colors.card,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: theme.colors.textMuted,
    },
    tabsContainer: {
        flexDirection: 'row',
        padding: 16,
        gap: 8,
        backgroundColor: theme.colors.background,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderRadius: 12,
        backgroundColor: theme.colors.card,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    tabActive: {
        backgroundColor: theme.colors.primary + '15',
        borderColor: theme.colors.primary + '50',
    },
    tabIcon: {
        marginRight: 6,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.textMuted,
    },
    tabTextActive: {
        color: theme.colors.primary,
    },
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        gap: 16,
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: theme.colors.textMuted,
        fontSize: 16,
    },
    card: {
        backgroundColor: theme.colors.card,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    cardMediaPlaceholder: {
        height: 180,
        backgroundColor: theme.colors.primary + '80', // semi-transparent primary
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    cardBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    cardBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    cardContent: {
        padding: 16,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 12,
        lineHeight: 22,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardDate: {
        fontSize: 12,
        color: theme.colors.textMuted,
    }
});
