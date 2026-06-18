import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { broadcastService } from '@/services/broadcastService';
import { Broadcast } from '@/types';
import { GlassBox } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
    Video, Newspaper, PlayCircle, Calendar, ExternalLink, 
    Play, BookOpen, Volume2, Compass, Radio 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type TabType = 'all' | 'news' | 'story' | 'podcast';

export function ParticipantMedia() {
    const { profile } = useAuth();
    const { organization } = useOrganization();
    
    const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('all');

    useEffect(() => {
        if (organization?.id) {
            fetchBroadcasts();
        }
    }, [organization?.id]);

    const fetchBroadcasts = async () => {
        try {
            setLoading(true);
            const data = await broadcastService.getPublishedBroadcasts(organization!.id);
            setBroadcasts(data || []);
        } catch (err) {
            console.error('Error fetching broadcasts:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleMediaOpen = (broadcast: Broadcast) => {
        if (broadcast.media_url) {
            window.open(broadcast.media_url, '_blank');
        }
    };

    const timeAgo = (dateStr: string): string => {
        const now = new Date();
        const date = new Date(dateStr);
        const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
        if (diff < 60) return `${diff}s ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    };

    // Filtered Broadcasts
    const filteredBroadcasts = broadcasts.filter(b => {
        if (activeTab === 'all') return true;
        return b.type === activeTab;
    });

    // Hero item is the very first published item
    const heroItem = broadcasts[0];
    const listItems = activeTab === 'all' ? filteredBroadcasts.slice(1) : filteredBroadcasts;

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="bg-foreground px-6 pt-12 pb-8 relative overflow-hidden">
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
                <h1 className="text-3xl font-black text-white uppercase tracking-tighter relative z-10">MUTV Media</h1>
                <p className="text-white/60 text-xs font-medium uppercase tracking-widest mt-1 relative z-10">Reels, Podcasts & Community News</p>
            </div>

            <div className="p-6 -mt-6 relative z-20 space-y-6">
                
                {/* Filter Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                    {(['all', 'news', 'story', 'podcast'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-1.5 ${activeTab === tab
                                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                : 'bg-surface border border-surface-border text-slate-500 hover:text-foreground'
                                }`}
                        >
                            {tab === 'all' && <Compass className="w-3.5 h-3.5" />}
                            {tab === 'news' && <Newspaper className="w-3.5 h-3.5" />}
                            {tab === 'story' && <Video className="w-3.5 h-3.5" />}
                            {tab === 'podcast' && <PlayCircle className="w-3.5 h-3.5" />}
                            {tab === 'all' ? 'For You' : tab === 'news' ? 'News' : tab === 'story' ? 'Reels' : 'Podcasts'}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="space-y-4">
                        <div className="h-48 bg-surface rounded-3xl animate-pulse border border-surface-border" />
                        <div className="grid grid-cols-2 gap-4">
                            <div className="h-40 bg-surface rounded-2xl animate-pulse border border-surface-border" />
                            <div className="h-40 bg-surface rounded-2xl animate-pulse border border-surface-border" />
                        </div>
                    </div>
                ) : broadcasts.length === 0 ? (
                    <div className="text-center py-20 bg-surface rounded-3xl border border-dashed border-surface-border">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Radio className="w-8 h-8 text-slate-300 animate-pulse" />
                        </div>
                        <h3 className="text-sm font-black text-foreground uppercase tracking-tight">No Media Yet</h3>
                        <p className="text-slate-500 text-[10px] font-medium px-12 mt-2 leading-relaxed">
                            Stay tuned! Your community hasn't published any reels, podcasts, or news yet.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        
                        {/* Featured Hero Banner (Only on "For You" / all tab) */}
                        {activeTab === 'all' && heroItem && (
                            <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="group relative overflow-hidden rounded-3xl border border-surface-border bg-surface shadow-xl"
                            >
                                <div className="aspect-[16/10] relative w-full bg-slate-900 overflow-hidden">
                                    {heroItem.thumbnail_url ? (
                                        <img 
                                            src={heroItem.thumbnail_url} 
                                            alt={heroItem.title} 
                                            className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" 
                                        />
                                    ) : (
                                        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-pink-500/20 flex items-center justify-center">
                                            {heroItem.type === 'news' && <Newspaper className="w-14 h-14 text-white/40" />}
                                            {heroItem.type === 'story' && <Video className="w-14 h-14 text-white/40" />}
                                            {heroItem.type === 'podcast' && <PlayCircle className="w-14 h-14 text-white/40" />}
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                                    
                                    {/* Type Tag */}
                                    <div className="absolute top-4 left-4">
                                        <span className="px-3 py-1 bg-black/50 backdrop-blur-md rounded-lg text-[9px] font-black uppercase tracking-widest text-primary border border-primary/30">
                                            Featured {heroItem.type === 'story' ? 'Reel' : heroItem.type}
                                        </span>
                                    </div>

                                    {/* Hero Info */}
                                    <div className="absolute bottom-0 left-0 right-0 p-6 space-y-3">
                                        <div className="flex items-center gap-2 text-[10px] text-white/60 font-bold">
                                            <Calendar className="w-3.5 h-3.5 text-primary" />
                                            <span>{timeAgo(heroItem.published_at || heroItem.created_at)}</span>
                                        </div>
                                        <h2 className="text-xl font-black text-white uppercase tracking-tight leading-tight line-clamp-2">
                                            {heroItem.title}
                                        </h2>
                                        {heroItem.description && (
                                            <p className="text-xs text-white/70 line-clamp-2 leading-relaxed font-medium">
                                                {heroItem.description}
                                            </p>
                                        )}
                                        
                                        <div className="pt-2">
                                            {heroItem.media_url ? (
                                                <Button 
                                                    onClick={() => handleMediaOpen(heroItem)}
                                                    className="w-full sm:w-auto text-xs font-black uppercase tracking-widest h-11 px-6 shadow-lg bg-primary hover:bg-primary-dark"
                                                >
                                                    {heroItem.type === 'news' ? (
                                                        <><BookOpen className="w-4 h-4 mr-2" /> Read Article</>
                                                    ) : (
                                                        <><Play className="w-4 h-4 mr-2" fill="white" /> Watch Now</>
                                                    )}
                                                </Button>
                                            ) : (
                                                <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Text Only Update</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* List Section */}
                        <div className="space-y-4">
                            {activeTab === 'all' && listItems.length > 0 && (
                                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">Recent Feed</h3>
                            )}
                            
                            <div className="grid grid-cols-1 gap-4">
                                <AnimatePresence mode="popLayout">
                                    {listItems.map((item, idx) => {
                                        const isReel = item.type === 'story';
                                        const isPodcast = item.type === 'podcast';
                                        const isArticle = item.type === 'news';

                                        return (
                                            <motion.div
                                                key={item.id}
                                                initial={{ opacity: 0, y: 15 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className="group"
                                            >
                                                <GlassBox 
                                                    onClick={() => handleMediaOpen(item)}
                                                    className="p-4 bg-surface border-surface-border hover:border-primary/30 transition-all active:scale-[0.99] cursor-pointer flex gap-4"
                                                >
                                                    {/* Media Preview Box */}
                                                    <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 bg-slate-900 border border-surface-border relative flex items-center justify-center">
                                                        {item.thumbnail_url ? (
                                                            <img src={item.thumbnail_url} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="absolute inset-0 bg-primary/5 flex items-center justify-center">
                                                                {isArticle && <Newspaper className="w-6 h-6 text-primary/35" />}
                                                                {isReel && <Video className="w-6 h-6 text-primary/35" />}
                                                                {isPodcast && <PlayCircle className="w-6 h-6 text-primary/35" />}
                                                            </div>
                                                        )}
                                                        
                                                        {/* Icon Overlay for Video / Podcast */}
                                                        {!isArticle && (
                                                            <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                                                                <div className="w-8 h-8 rounded-full bg-white/25 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
                                                                    {isPodcast ? <Volume2 className="w-4 h-4" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Text & Meta details */}
                                                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                                                                    isArticle ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                                                                    isReel ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20' :
                                                                    'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                                                                }`}>
                                                                    {isReel ? 'Reel' : item.type}
                                                                </span>
                                                                <span className="text-[9px] font-bold text-slate-400">
                                                                    {timeAgo(item.published_at || item.created_at)}
                                                                </span>
                                                            </div>
                                                            <h4 className="font-black text-foreground text-sm uppercase tracking-tight line-clamp-2 group-hover:text-primary transition-colors">
                                                                {item.title}
                                                            </h4>
                                                            {item.description && (
                                                                <p className="text-[11px] text-slate-500 line-clamp-1 font-medium leading-normal">
                                                                    {item.description}
                                                                </p>
                                                            )}
                                                        </div>

                                                        <div className="flex items-center justify-between pt-1">
                                                            {item.media_url ? (
                                                                <span className="text-[9px] font-black uppercase tracking-widest text-primary flex items-center gap-1">
                                                                    {isArticle ? 'Read Article' : 'Play Media'} 
                                                                    <ExternalLink className="w-3 h-3" />
                                                                </span>
                                                            ) : (
                                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Text Only</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </GlassBox>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                        </div>

                        {listItems.length === 0 && (
                            <div className="text-center py-12 bg-surface rounded-3xl border border-surface-border">
                                <Compass className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">No {activeTab}s available yet.</p>
                            </div>
                        )}

                    </div>
                )}
                
                <div className="py-10 text-center">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">End of Feed</p>
                </div>
            </div>
        </div>
    );
}
