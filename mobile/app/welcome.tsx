import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    FlatList,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, BookOpen, Radio, Tv, ExternalLink, Sparkles, Calendar, ChevronRight } from 'lucide-react-native';
import { theme } from '../lib/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_WIDTH = SCREEN_WIDTH - 32;

type TabType = 'videos' | 'news' | 'promotions';

interface PromotionalBanner {
    id: string;
    title: string;
    description: string;
    imageUrl: string;
    ctaLink: string;
}

interface VideoItem {
    id: string;
    title: string;
    description: string;
    imageUrl: string;
    videoUrl: string;
    duration: string;
}

interface NewsItem {
    id: string;
    title: string;
    description: string;
    date: string;
    category: string;
    link: string;
}

interface PromotionItem {
    id: string;
    title: string;
    description: string;
    price: string;
    actionText: string;
    link: string;
    imageUrl: string;
}

const PROM_BANNERS: PromotionalBanner[] = [
    {
        id: 'b1',
        title: 'Welcome to KingdomConnect',
        description: 'Engage with discipleship cohorts, support your cell groups, and grow in your faith.',
        imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=600&auto=format&fit=crop',
        ctaLink: 'https://kingdomconnect.co.zw',
    },
    {
        id: 'b2',
        title: 'Be That Man Conference 2026',
        description: 'Join thousands of men gathering to study, connect, and lead. Register for our upcoming summit.',
        imageUrl: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?q=80&w=600&auto=format&fit=crop',
        ctaLink: 'https://kingdomconnect.co.zw/events',
    },
    {
        id: 'b3',
        title: 'Start a Discipleship Cohort',
        description: 'Connect with a mentor or facilitate a cell group today. Register within the app to join.',
        imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=600&auto=format&fit=crop',
        ctaLink: 'https://kingdomconnect.co.zw/programs',
    },
];

const VIDEOS: VideoItem[] = [
    {
        id: 'v1',
        title: 'Be That Man - Official Series Promo',
        description: 'Watch the introductory trailer for the Be That Man discipleship program.',
        imageUrl: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?q=80&w=600&auto=format&fit=crop',
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        duration: '2:45',
    },
    {
        id: 'v2',
        title: 'KingdomConnect Mobile App Walkthrough',
        description: 'A quick 5-minute tutorial showing how to scan QRs, view assignments, and check in.',
        imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=600&auto=format&fit=crop',
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        duration: '5:12',
    },
    {
        id: 'v3',
        title: 'The Power of Digital Faith Groups',
        description: 'Pastor Brian discusses how technology can strengthen localized discipleship teams.',
        imageUrl: 'https://images.unsplash.com/photo-1504052434569-70ad585e515d?q=80&w=600&auto=format&fit=crop',
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        duration: '12:30',
    },
];

const NEWS: NewsItem[] = [
    {
        id: 'n1',
        title: 'Weekly Church Announcement - June 17, 2026',
        description: 'Read the latest updates about mid-week services, outreach programs, and kids cell groups.',
        date: 'June 17, 2026',
        category: 'Bulletin',
        link: 'https://kingdomconnect.co.zw/news/bulletin-june-17',
    },
    {
        id: 'n2',
        title: 'Advanced Faith Facilitator Course Launching',
        description: 'Sign up to become a certified program facilitator. Training starts next Sunday evening.',
        date: 'June 15, 2026',
        category: 'Training',
        link: 'https://kingdomconnect.co.zw/programs/facilitator-training',
    },
    {
        id: 'n3',
        title: 'Community Outreach Summary: 500+ Families Assisted',
        description: 'Thanks to all your donations and hands-on help, our community feed drive reached its record milestone.',
        date: 'June 10, 2026',
        category: 'Outreach',
        link: 'https://kingdomconnect.co.zw/news/outreach-feed-drive',
    },
];

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

export default function WelcomeScreen() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabType>('videos');
    const [bannerIndex, setBannerIndex] = useState(0);
    const bannerRef = useRef<FlatList>(null);

    const handleOpenLink = async (url: string) => {
        try {
            await WebBrowser.openBrowserAsync(url);
        } catch (error) {
            console.error('Failed to open link in-app:', error);
        }
    };

    const handleBannerScroll = (e: any) => {
        const idx = Math.round(e.nativeEvent.contentOffset.x / BANNER_WIDTH);
        setBannerIndex(idx);
    };

    const renderBannerCard = ({ item }: { item: PromotionalBanner }) => (
        <TouchableOpacity
            style={styles.bannerCard}
            onPress={() => handleOpenLink(item.ctaLink)}
            activeOpacity={0.92}
        >
            <Image source={{ uri: item.imageUrl }} style={styles.bannerImage} resizeMode="cover" />
            <LinearGradient
                colors={['transparent', 'rgba(9, 9, 11, 0.95)']}
                style={styles.bannerGradient}
            />
            <View style={styles.bannerContent}>
                <View style={styles.bannerPill}>
                    <Sparkles color={theme.colors.primaryLight} size={10} style={{ marginRight: 4 }} />
                    <Text style={styles.bannerPillText}>PROMOTIONAL ADVERTISEMENT</Text>
                </View>
                <Text style={styles.bannerTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.bannerDescription} numberOfLines={2}>{item.description}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                {/* ── App Logo / Welcome Header ── */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.headerTitle}>KingdomConnect</Text>
                        <Text style={styles.headerSubtitle}>Discover faith, media & community</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.quickSignInBtn}
                        onPress={() => router.push('/login')}
                    >
                        <Text style={styles.quickSignInText}>Sign In</Text>
                    </TouchableOpacity>
                </View>

                {/* ── Banner Carousel ── */}
                <View style={styles.carouselContainer}>
                    <FlatList
                        ref={bannerRef}
                        data={PROM_BANNERS}
                        renderItem={renderBannerCard}
                        keyExtractor={item => item.id}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        snapToInterval={BANNER_WIDTH + 16}
                        snapToAlignment="start"
                        decelerationRate="fast"
                        contentContainerStyle={{ paddingHorizontal: 16, gap: 16 }}
                        onScroll={handleBannerScroll}
                        scrollEventThrottle={16}
                    />
                    <View style={styles.dotsRow}>
                        {PROM_BANNERS.map((_, i) => (
                            <View
                                key={i}
                                style={[
                                    styles.dot,
                                    i === bannerIndex ? styles.dotActive : styles.dotInactive,
                                ]}
                            />
                        ))}
                    </View>
                </View>

                {/* ── Category Tabs ── */}
                <View style={styles.tabsRow}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'videos' && styles.tabActive]}
                        onPress={() => setActiveTab('videos')}
                    >
                        <Tv color={activeTab === 'videos' ? '#09090b' : theme.colors.textMuted} size={16} style={{ marginRight: 6 }} />
                        <Text style={[styles.tabText, activeTab === 'videos' && styles.tabTextActive]}>Videos</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'news' && styles.tabActive]}
                        onPress={() => setActiveTab('news')}
                    >
                        <BookOpen color={activeTab === 'news' ? '#09090b' : theme.colors.textMuted} size={16} style={{ marginRight: 6 }} />
                        <Text style={[styles.tabText, activeTab === 'news' && styles.tabTextActive]}>News Feed</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'promotions' && styles.tabActive]}
                        onPress={() => setActiveTab('promotions')}
                    >
                        <Radio color={activeTab === 'promotions' ? '#09090b' : theme.colors.textMuted} size={16} style={{ marginRight: 6 }} />
                        <Text style={[styles.tabText, activeTab === 'promotions' && styles.tabTextActive]}>Promotions</Text>
                    </TouchableOpacity>
                </View>

                {/* ── Content Lists ── */}
                <View style={styles.contentSection}>
                    {activeTab === 'videos' && (
                        <View style={styles.listContainer}>
                            <Text style={styles.sectionHeading}>Featured Videos</Text>
                            {VIDEOS.map(video => (
                                <TouchableOpacity
                                    key={video.id}
                                    style={styles.videoCard}
                                    onPress={() => handleOpenLink(video.videoUrl)}
                                    activeOpacity={0.88}
                                >
                                    <View style={styles.videoThumbContainer}>
                                        <Image source={{ uri: video.imageUrl }} style={styles.videoThumb} />
                                        <View style={styles.playOverlay}>
                                            <Play color="#fff" size={20} fill="#fff" />
                                        </View>
                                        <View style={styles.durationTag}>
                                            <Text style={styles.durationText}>{video.duration}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.videoInfo}>
                                        <Text style={styles.videoTitle} numberOfLines={2}>{video.title}</Text>
                                        <Text style={styles.videoDesc} numberOfLines={2}>{video.description}</Text>
                                        <View style={styles.openInAppIndicator}>
                                            <Tv size={12} color={theme.colors.primaryLight} style={{ marginRight: 4 }} />
                                            <Text style={styles.openInAppText}>Watch within app</Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    {activeTab === 'news' && (
                        <View style={styles.listContainer}>
                            <Text style={styles.sectionHeading}>Community Feed</Text>
                            {NEWS.map(news => (
                                <TouchableOpacity
                                    key={news.id}
                                    style={styles.newsCard}
                                    onPress={() => handleOpenLink(news.link)}
                                    activeOpacity={0.85}
                                >
                                    <View style={styles.newsMeta}>
                                        <View style={styles.newsTag}>
                                            <Text style={styles.newsTagText}>{news.category}</Text>
                                        </View>
                                        <Text style={styles.newsDate}>{news.date}</Text>
                                    </View>
                                    <Text style={styles.newsTitle}>{news.title}</Text>
                                    <Text style={styles.newsDesc} numberOfLines={3}>{news.description}</Text>
                                    <View style={styles.readMoreRow}>
                                        <Text style={styles.readMoreText}>Read Announcement</Text>
                                        <ChevronRight size={14} color={theme.colors.primary} />
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    {activeTab === 'promotions' && (
                        <View style={styles.listContainer}>
                            <Text style={styles.sectionHeading}>Promotional Content</Text>
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
                    )}
                </View>

                {/* Padding to avoid clipping behind sticky footer */}
                <View style={{ height: 110 }} />
            </ScrollView>

            {/* ── Sticky CTA Footer Bar ── */}
            <View style={styles.stickyFooter}>
                <LinearGradient
                    colors={['transparent', 'rgba(9, 9, 11, 0.98)', '#09090b']}
                    style={styles.footerGradient}
                />
                <View style={styles.footerContent}>
                    <TouchableOpacity
                        style={styles.signupButton}
                        onPress={() => router.push('/signup')}
                    >
                        <Text style={styles.signupButtonText}>Create Account / Join Org</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.signinButton}
                        onPress={() => router.push('/login')}
                    >
                        <Text style={styles.signinButtonText}>Already have an account? <Text style={styles.signinButtonHighlight}>Sign In</Text></Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    scrollContainer: {
        flex: 1,
    },

    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: '900',
        color: theme.colors.text,
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: 12,
        color: theme.colors.textMuted,
        marginTop: 2,
    },
    quickSignInBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: theme.colors.card,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    quickSignInText: {
        fontSize: 13,
        fontWeight: '700',
        color: theme.colors.text,
    },

    // Banner Carousel
    carouselContainer: {
        marginTop: 12,
        marginBottom: 16,
    },
    bannerCard: {
        width: BANNER_WIDTH,
        height: 200,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: theme.colors.card,
        position: 'relative',
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    bannerImage: {
        width: '100%',
        height: '100%',
        position: 'absolute',
    },
    bannerGradient: {
        ...StyleSheet.absoluteFillObject,
    },
    bannerContent: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
    },
    bannerPill: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: theme.colors.primary + '25',
        borderWidth: 1,
        borderColor: theme.colors.primary + '60',
        borderRadius: 999,
        paddingHorizontal: 8,
        paddingVertical: 3,
        marginBottom: 6,
    },
    bannerPillText: {
        fontSize: 8,
        fontWeight: '900',
        color: theme.colors.primaryLight,
        letterSpacing: 1,
    },
    bannerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#ffffff',
        lineHeight: 22,
        marginBottom: 4,
    },
    bannerDescription: {
        fontSize: 12,
        color: 'rgba(250, 250, 250, 0.75)',
        lineHeight: 16,
    },

    // Dot indicators
    dotsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        gap: 6,
    },
    dot: {
        height: 4,
        borderRadius: 2,
    },
    dotActive: {
        width: 16,
        backgroundColor: theme.colors.primary,
    },
    dotInactive: {
        width: 4,
        backgroundColor: theme.colors.border,
    },

    // Category Tabs
    tabsRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        marginBottom: 8,
        gap: 8,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: theme.colors.card,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    tabActive: {
        backgroundColor: theme.colors.text,
        borderColor: theme.colors.text,
    },
    tabText: {
        fontSize: 13,
        fontWeight: '700',
        color: theme.colors.textMuted,
    },
    tabTextActive: {
        color: '#09090b',
    },

    // Content Lists
    contentSection: {
        paddingHorizontal: 16,
        marginTop: 12,
    },
    listContainer: {
        gap: 12,
    },
    sectionHeading: {
        fontSize: 18,
        fontWeight: '800',
        color: theme.colors.text,
        marginBottom: 4,
        letterSpacing: -0.2,
    },

    // Video Card
    videoCard: {
        backgroundColor: theme.colors.card,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    videoThumbContainer: {
        width: '100%',
        height: 160,
        position: 'relative',
        backgroundColor: '#000',
    },
    videoThumb: {
        width: '100%',
        height: '100%',
        opacity: 0.85,
    },
    playOverlay: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: [{ translateX: -22 }, { translateY: -22 }],
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(220, 38, 38, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 6,
    },
    durationTag: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        backgroundColor: 'rgba(0,0,0,0.8)',
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    durationText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#fff',
    },
    videoInfo: {
        padding: 12,
    },
    videoTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.colors.text,
        lineHeight: 20,
        marginBottom: 4,
    },
    videoDesc: {
        fontSize: 12,
        color: theme.colors.textMuted,
        lineHeight: 16,
        marginBottom: 8,
    },
    openInAppIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    openInAppText: {
        fontSize: 11,
        fontWeight: '600',
        color: theme.colors.primaryLight,
    },

    // News Card
    newsCard: {
        backgroundColor: theme.colors.card,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    newsMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    newsTag: {
        backgroundColor: theme.colors.primary + '20',
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    newsTagText: {
        fontSize: 10,
        fontWeight: '700',
        color: theme.colors.primaryLight,
        textTransform: 'uppercase',
    },
    newsDate: {
        fontSize: 11,
        color: theme.colors.textMuted,
    },
    newsTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.colors.text,
        lineHeight: 20,
        marginBottom: 6,
    },
    newsDesc: {
        fontSize: 12,
        color: theme.colors.textMuted,
        lineHeight: 17,
        marginBottom: 10,
    },
    readMoreRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    readMoreText: {
        fontSize: 12,
        fontWeight: '700',
        color: theme.colors.primary,
        marginRight: 2,
    },

    // Promo Card
    promoCard: {
        flexDirection: 'row',
        backgroundColor: theme.colors.card,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.colors.border,
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

    // Sticky Footer
    stickyFooter: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 110,
        justifyContent: 'flex-end',
    },
    footerGradient: {
        ...StyleSheet.absoluteFillObject,
    },
    footerContent: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        backgroundColor: '#09090b',
        gap: 8,
    },
    signupButton: {
        backgroundColor: theme.colors.primary,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 4,
    },
    signupButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: 0.1,
    },
    signinButton: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
    },
    signinButtonText: {
        color: theme.colors.textMuted,
        fontSize: 13,
    },
    signinButtonHighlight: {
        color: theme.colors.primaryLight,
        fontWeight: '700',
    },
});
