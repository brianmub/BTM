import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Linking,
    Dimensions,
    FlatList,
    Image,
    NativeSyntheticEvent,
    NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../lib/theme';
import { useAuth } from '../../hooks/useAuth';
import { broadcastService, Broadcast } from '../../services/broadcastService';
import { Play, BookOpen, Radio, ExternalLink } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_CARD_WIDTH = SCREEN_WIDTH - 32;

// Map broadcast types to display tabs
// podcast + story both appear under "Video" tab
type TabType = 'all' | 'news' | 'video' | 'promotions';

interface PromotionItem {
    id: string;
    title: string;
    description: string;
    price: string;
    actionText: string;
    link: string;
    imageUrl: string;
}

const PROMOTIONS: PromotionItem[] = [
    {
        id: 'p1',
        title: 'Be That Man Study Guide Vol. 1',
        description: 'Get the official study guide and workbook companion for the cohort series.',
        price: '$12.99',
        actionText: 'Buy Guide',
        link: 'https://kingdomconnect.co.zw/store/btm-guide-1',
        imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=600&auto=format&fit=crop',
    },
    {
        id: 'p2',
        title: 'Interactive Cell Group Facilitator Pass',
        description: 'Register as an official facilitator to unlock cell program metrics, resources, and badges.',
        price: 'Free',
        actionText: 'Apply Now',
        link: 'https://kingdomconnect.co.zw/apply-facilitator',
        imageUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=600&auto=format&fit=crop',
    },
];

function timeAgo(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hrs ago`;
    return `${Math.floor(diff / 86400)} days ago`;
}

function isVideo(b: Broadcast): boolean {
    return b.type === 'story' || b.type === 'podcast';
}

export default function MediaScreen() {
    const { profile } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>('all');
    const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [heroIndex, setHeroIndex] = useState(0);
    const heroRef = useRef<FlatList>(null);

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

    // Filter logic
    const filtered = broadcasts.filter(b => {
        if (activeTab === 'all') return true;
        if (activeTab === 'news') return b.type === 'news';
        if (activeTab === 'video') return isVideo(b);
        return true;
    });

    // Hero items = top 5 published items regardless of tab
    const heroItems = broadcasts.slice(0, 5);
    // List items = everything after hero, filtered by tab
    const listItems = filtered.slice(heroItems.length);
    // All filtered for list (when not all tab, show all filtered)
    const displayList = activeTab === 'all' ? listItems : filtered;

    const onHeroScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const idx = Math.round(e.nativeEvent.contentOffset.x / HERO_CARD_WIDTH);
        setHeroIndex(idx);
    };

    const handlePress = async (broadcast: Broadcast) => {
        if (broadcast.media_url) {
            try {
                await WebBrowser.openBrowserAsync(broadcast.media_url);
            } catch (error) {
                console.error('Failed to open link in-app:', error);
                Linking.openURL(broadcast.media_url).catch(err => console.error('Failed to open link via Linking:', err));
            }
        }
    };

    const handleOpenLink = async (url: string) => {
        try {
            await WebBrowser.openBrowserAsync(url);
        } catch (error) {
            console.error('Failed to open link in-app:', error);
            Linking.openURL(url).catch(err => console.error('Failed to open link via Linking:', err));
        }
    };

    const getCategoryLabel = (b: Broadcast): string => {
        if (b.type === 'news') return 'News';
        if (b.type === 'story') return 'Video';
        if (b.type === 'podcast') return 'Video';
        return 'Media';
    };

    // ── Hero Card ────────────────────────────────────────────────────────────
    const renderHeroCard = ({ item }: { item: Broadcast }) => {
        const hasVideo = isVideo(item) && item.media_url;
        const hasRead = item.type === 'news';
        const dateStr = item.published_at || item.created_at;

        return (
            <TouchableOpacity
                style={styles.heroCard}
                onPress={() => handlePress(item)}
                activeOpacity={0.92}
            >
                {/* Background */}
                {item.thumbnail_url ? (
                    <Image
                        source={{ uri: item.thumbnail_url }}
                        style={styles.heroImage}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={styles.heroImageFallback} />
                )}

                {/* Gradient overlay */}
                <View style={styles.heroOverlay} />

                {/* Content */}
                <View style={styles.heroContent}>
                    <Text style={styles.heroCategoryLabel}>
                        {getCategoryLabel(item)}
                        {'  ·  '}
                        {timeAgo(dateStr)}
                    </Text>
                    <Text style={styles.heroTitle} numberOfLines={3}>
                        {item.title}
                    </Text>
                    {item.description ? (
                        <Text style={styles.heroDescription} numberOfLines={2}>
                            {item.description}
                        </Text>
                    ) : null}

                    {/* CTA Buttons */}
                    <View style={styles.heroButtons}>
                        {hasVideo ? (
                            <TouchableOpacity
                                style={styles.btnPrimary}
                                onPress={() => handlePress(item)}
                            >
                                <Play color="#fff" size={14} fill="#fff" style={{ marginRight: 6 }} />
                                <Text style={styles.btnPrimaryText}>Watch Now</Text>
                            </TouchableOpacity>
                        ) : hasRead ? (
                            <TouchableOpacity
                                style={styles.btnPrimary}
                                onPress={() => handlePress(item)}
                            >
                                <BookOpen color="#fff" size={14} style={{ marginRight: 6 }} />
                                <Text style={styles.btnPrimaryText}>Read</Text>
                            </TouchableOpacity>
                        ) : null}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    // ── List Card (smaller, below hero) ──────────────────────────────────────
    const renderListCard = (broadcast: Broadcast) => {
        const hasMedia = !!broadcast.media_url;
        const dateStr = broadcast.published_at || broadcast.created_at;
        const isFirst = displayList.indexOf(broadcast) === 0;

        // First item in list = large featured card
        if (isFirst) {
            return (
                <TouchableOpacity
                    key={broadcast.id}
                    style={styles.featuredCard}
                    onPress={() => handlePress(broadcast)}
                    activeOpacity={0.9}
                >
                    {broadcast.thumbnail_url ? (
                        <Image
                            source={{ uri: broadcast.thumbnail_url }}
                            style={styles.featuredImage}
                            resizeMode="cover"
                        />
                    ) : (
                        <View style={styles.featuredImageFallback}>
                            <Radio color={theme.colors.primary} size={32} />
                        </View>
                    )}
                    <View style={styles.featuredContent}>
                        <Text style={styles.featuredTitle} numberOfLines={2}>
                            {broadcast.title}
                        </Text>
                        <View style={styles.featuredMeta}>
                            <Text style={styles.featuredCategory}>{getCategoryLabel(broadcast)}</Text>
                            <Text style={styles.featuredDot}> · </Text>
                            <Text style={styles.featuredTime}>{timeAgo(dateStr)}</Text>
                        </View>
                    </View>
                </TouchableOpacity>
            );
        }

        // Remaining items = compact row card
        return (
            <TouchableOpacity
                key={broadcast.id}
                style={styles.rowCard}
                onPress={() => handlePress(broadcast)}
                activeOpacity={0.85}
            >
                {/* Thumbnail */}
                <View style={styles.rowThumb}>
                    {broadcast.thumbnail_url ? (
                        <Image
                            source={{ uri: broadcast.thumbnail_url }}
                            style={styles.rowThumbImage}
                            resizeMode="cover"
                        />
                    ) : (
                        <View style={styles.rowThumbFallback}>
                            {isVideo(broadcast)
                                ? <Play color={theme.colors.primary} size={20} />
                                : <BookOpen color={theme.colors.primary} size={20} />
                            }
                        </View>
                    )}
                    {/* Video play overlay */}
                    {isVideo(broadcast) && broadcast.thumbnail_url && (
                        <View style={styles.playOverlay}>
                            <Play color="#fff" size={12} fill="#fff" />
                        </View>
                    )}
                </View>

                {/* Text */}
                <View style={styles.rowContent}>
                    <View style={styles.rowMeta}>
                        <Text style={styles.rowCategory}>{getCategoryLabel(broadcast)}</Text>
                        <Text style={styles.rowTime}> · {timeAgo(dateStr)}</Text>
                    </View>
                    <Text style={styles.rowTitle} numberOfLines={2}>
                        {broadcast.title}
                    </Text>
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
            <ScrollView
                style={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={theme.colors.primary}
                    />
                }
            >
                {/* ── Header ── */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Media</Text>
                </View>

                {/* ── Filter Tabs ── */}
                <View style={styles.tabsRow}>
                    {(['all', 'news', 'video', 'promotions'] as TabType[]).map(tab => (
                        <TouchableOpacity
                            key={tab}
                            style={[styles.tab, activeTab === tab && styles.tabActive]}
                            onPress={() => setActiveTab(tab)}
                        >
                            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                                {tab === 'all' ? 'For You' : tab === 'news' ? 'News' : tab === 'video' ? 'Videos' : 'Promotions'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {broadcasts.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Radio color={theme.colors.textMuted} size={40} />
                        <Text style={styles.emptyText}>No content available yet.</Text>
                        <Text style={styles.emptySubText}>Check back soon for updates from your organization.</Text>
                    </View>
                ) : (
                    <>
                        {/* ── Hero Carousel (always shows top 5) ── */}
                        {activeTab !== 'promotions' && heroItems.length > 0 && (
                            <View style={styles.heroSection}>
                                <FlatList
                                    ref={heroRef}
                                    data={heroItems}
                                    renderItem={renderHeroCard}
                                    keyExtractor={item => item.id}
                                    horizontal
                                    pagingEnabled
                                    showsHorizontalScrollIndicator={false}
                                    snapToInterval={HERO_CARD_WIDTH + 16}
                                    snapToAlignment="start"
                                    decelerationRate="fast"
                                    contentContainerStyle={{ paddingHorizontal: 16, gap: 16 }}
                                    onScroll={onHeroScroll}
                                    scrollEventThrottle={16}
                                />
                                {/* Dot indicators */}
                                <View style={styles.dotsRow}>
                                    {heroItems.map((_, i) => (
                                        <View
                                            key={i}
                                            style={[
                                                styles.dot,
                                                i === heroIndex ? styles.dotActive : styles.dotInactive,
                                            ]}
                                        />
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* ── List Section ── */}
                        {activeTab === 'promotions' ? (
                            <View style={styles.listSection}>
                                <View style={styles.listHeader}>
                                    <Text style={styles.listTitle}>Promotions & Offers</Text>
                                </View>
                                <View style={{ gap: 12 }}>
                                    {PROMOTIONS.map(promo => (
                                        <TouchableOpacity
                                            key={promo.id}
                                            style={styles.promoCard}
                                            onPress={() => handleOpenLink(promo.link)}
                                            activeOpacity={0.88}
                                        >
                                            <Image source={{ uri: promo.imageUrl }} style={styles.promoImage} resizeMode="cover" />
                                            <View style={styles.promoContent}>
                                                <View style={styles.promoHeaderRow}>
                                                    <Text style={styles.promoTitle} numberOfLines={1}>{promo.title}</Text>
                                                    <Text style={styles.promoPrice}>{promo.price}</Text>
                                                </View>
                                                <Text style={styles.promoDesc} numberOfLines={2}>{promo.description}</Text>
                                                <View style={styles.promoCTA}>
                                                    <Text style={styles.promoCTAText}>{promo.actionText}</Text>
                                                    <ExternalLink size={12} color={theme.colors.primaryLight} style={{ marginLeft: 4 }} />
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        ) : (
                            displayList.length > 0 && (
                                <View style={styles.listSection}>
                                    <View style={styles.listHeader}>
                                        <Text style={styles.listTitle}>
                                            {activeTab === 'all' ? 'Popular articles' : activeTab === 'news' ? 'News' : 'Videos'}
                                        </Text>
                                        <TouchableOpacity>
                                            <Text style={styles.viewAll}>View all</Text>
                                        </TouchableOpacity>
                                    </View>
                                    {displayList.map(renderListCard)}
                                </View>
                            )
                        )}

                        {activeTab !== 'promotions' && filtered.length === 0 && (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>
                                    No {activeTab === 'video' ? 'videos' : activeTab} available right now.
                                </Text>
                            </View>
                        )}
                    </>
                )}

                <View style={{ height: 32 }} />
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
    scrollContainer: {
        flex: 1,
    },

    // Header
    header: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 4,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: theme.colors.text,
        letterSpacing: -0.5,
    },

    // Tabs
    tabsRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 8,
    },
    tab: {
        paddingHorizontal: 18,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: theme.colors.card,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    tabActive: {
        backgroundColor: theme.colors.text,
        borderColor: theme.colors.text,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.textMuted,
    },
    tabTextActive: {
        color: theme.colors.background,
    },

    // Hero section
    heroSection: {
        marginBottom: 8,
    },
    heroCard: {
        width: HERO_CARD_WIDTH,
        height: 400,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: theme.colors.card,
        position: 'relative',
    },
    heroImage: {
        width: '100%',
        height: '100%',
        position: 'absolute',
    },
    heroImageFallback: {
        width: '100%',
        height: '100%',
        position: 'absolute',
        backgroundColor: theme.colors.primary + '30',
    },
    heroOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'transparent',
        // React Native gradient workaround
        borderRadius: 16,
    },
    heroContent: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        // Dark gradient at bottom
        backgroundColor: 'rgba(0,0,0,0.65)',
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
    },
    heroCategoryLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.primary,
        marginBottom: 6,
        textTransform: 'capitalize',
    },
    heroTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#ffffff',
        lineHeight: 28,
        marginBottom: 6,
        letterSpacing: -0.3,
    },
    heroDescription: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.75)',
        lineHeight: 20,
        marginBottom: 14,
    },
    heroButtons: {
        flexDirection: 'row',
        gap: 10,
    },
    btnPrimary: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 20,
        paddingVertical: 11,
        borderRadius: 999,
    },
    btnPrimaryText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },

    // Dot indicators
    dotsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 12,
        gap: 6,
    },
    dot: {
        height: 6,
        borderRadius: 3,
    },
    dotActive: {
        width: 24,
        backgroundColor: theme.colors.primary,
    },
    dotInactive: {
        width: 6,
        backgroundColor: theme.colors.border,
    },

    // List section
    listSection: {
        paddingHorizontal: 16,
        marginTop: 16,
    },
    listHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    listTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: theme.colors.text,
        letterSpacing: -0.3,
    },
    viewAll: {
        fontSize: 14,
        color: theme.colors.textMuted,
        fontWeight: '500',
        textDecorationLine: 'underline',
    },

    // Featured card (first list item - large)
    featuredCard: {
        backgroundColor: theme.colors.card,
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    featuredImage: {
        width: '100%',
        height: 200,
    },
    featuredImageFallback: {
        width: '100%',
        height: 200,
        backgroundColor: theme.colors.primary + '20',
        justifyContent: 'center',
        alignItems: 'center',
    },
    featuredContent: {
        padding: 14,
    },
    featuredTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.text,
        lineHeight: 24,
        marginBottom: 8,
    },
    featuredMeta: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    featuredCategory: {
        fontSize: 13,
        fontWeight: '700',
        color: theme.colors.primary,
    },
    featuredDot: {
        color: theme.colors.textMuted,
        fontSize: 13,
    },
    featuredTime: {
        fontSize: 13,
        color: theme.colors.textMuted,
    },

    // Row card (compact list items)
    rowCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.card,
        borderRadius: 12,
        marginBottom: 10,
        padding: 10,
        borderWidth: 1,
        borderColor: theme.colors.border,
        gap: 12,
    },
    rowThumb: {
        width: 80,
        height: 72,
        borderRadius: 8,
        overflow: 'hidden',
        position: 'relative',
    },
    rowThumbImage: {
        width: '100%',
        height: '100%',
    },
    rowThumbFallback: {
        width: '100%',
        height: '100%',
        backgroundColor: theme.colors.primary + '20',
        justifyContent: 'center',
        alignItems: 'center',
    },
    playOverlay: {
        position: 'absolute',
        bottom: 6,
        right: 6,
        backgroundColor: 'rgba(0,0,0,0.7)',
        borderRadius: 999,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    rowContent: {
        flex: 1,
    },
    rowMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    rowCategory: {
        fontSize: 12,
        fontWeight: '700',
        color: theme.colors.primary,
    },
    rowTime: {
        fontSize: 12,
        color: theme.colors.textMuted,
    },
    rowTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text,
        lineHeight: 20,
    },

    // Promo Card
    promoCard: {
        flexDirection: 'row',
        backgroundColor: theme.colors.card,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.colors.border,
        marginBottom: 12,
    },
    promoImage: {
        width: 100,
        height: '100%',
        minHeight: 110,
    },
    promoContent: {
        flex: 1,
        padding: 12,
        justifyContent: 'space-between',
    },
    promoHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    promoTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.text,
        flex: 1,
        marginRight: 6,
    },
    promoPrice: {
        fontSize: 12,
        fontWeight: '800',
        color: theme.colors.success,
    },
    promoDesc: {
        fontSize: 11,
        color: theme.colors.textMuted,
        lineHeight: 15,
        marginVertical: 4,
    },
    promoCTA: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        marginTop: 2,
    },
    promoCTAText: {
        fontSize: 11,
        fontWeight: '700',
        color: theme.colors.primaryLight,
    },

    // Empty state
    emptyContainer: {
        padding: 48,
        alignItems: 'center',
        gap: 10,
    },
    emptyText: {
        color: theme.colors.text,
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    emptySubText: {
        color: theme.colors.textMuted,
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
});
