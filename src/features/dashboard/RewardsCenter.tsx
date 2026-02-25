import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Trophy, Star, Shield, Zap, Plus, Search, Filter, MoreVertical, Award, Sparkles, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { rewardService } from '@/services/rewardService';
import { useOrganization } from '@/hooks/useOrganization';

export function RewardsCenter() {
    const navigate = useNavigate();
    const { organization, loading: orgLoading } = useOrganization();
    const [badges, setBadges] = useState<any[]>([]);
    const [stats, setStats] = useState({ activeEarners: 0, totalBadgesAwarded: 0, protocolAdherence: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isForgeModalOpen, setIsForgeModalOpen] = useState(false);
    const [isForging, setIsForging] = useState(false);
    const [newBadge, setNewBadge] = useState({
        name: '',
        description: '',
        badge_type: 'engagement',
        points_benefit: 10,
        icon_url: ''
    });

    useEffect(() => {
        if (orgLoading) return;

        if (organization?.id) {
            fetchBadges();
        } else {
            setLoading(false);
        }
    }, [organization?.id, orgLoading]);

    const fetchBadges = async () => {
        try {
            setLoading(true);
            const [badgeData, statsData] = await Promise.all([
                rewardService.getBadges(organization!.id),
                rewardService.getRewardsStats(organization!.id)
            ]);
            setBadges(badgeData);
            setStats(statsData);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleForgeBadge = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsForging(true);
            await rewardService.createBadge({
                ...newBadge,
                organization_id: organization!.id,
                sort_order: badges.length
            });
            setIsForgeModalOpen(false);
            setNewBadge({ name: '', description: '', badge_type: 'engagement', points_benefit: 10, icon_url: '' });
            fetchBadges();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsForging(false);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'attendance': return <Shield className="w-8 h-8 text-blue-500" />;
            case 'assignment': return <Zap className="w-8 h-8 text-purple-500" />;
            case 'engagement': return <Star className="w-8 h-8 text-amber-500" />;
            default: return <Award className="w-8 h-8 text-indigo-500" />;
        }
    };

    if (loading && badges.length === 0) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-12 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div>
                    <div className="flex items-center space-x-2 mb-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Milestone Engine</span>
                    </div>
                    <h1 className="text-4xl font-black text-foreground tracking-tight uppercase">Rewards & Gamification</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">Incentivizing spiritual & academic progression</p>
                </div>
                <div className="flex gap-4">
                    <Button variant="outline" className="h-14 px-8 bg-background border-surface-border text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-foreground" onClick={() => navigate('/dashboard/rewards/certificates')}>
                        <Award className="w-4 h-4 mr-3" /> Digital Certificates
                    </Button>
                    <Button variant="premium" className="h-14 px-8 font-black uppercase tracking-widest text-xs" onClick={() => setIsForgeModalOpen(true)}>
                        <Plus className="w-4 h-4 mr-3" /> Forge New Badge
                    </Button>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-10">

                <Card className="flex flex-col justify-center p-10 bg-surface border-surface-border">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Active Badge Earners</p>
                    <h3 className="text-4xl font-black text-foreground tracking-tighter leading-none">{stats.activeEarners}</h3>
                    <div className="flex -space-x-4 mt-8">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="w-12 h-12 rounded-2xl border-2 border-background bg-background flex items-center justify-center text-[10px] font-black text-slate-500 shadow-xl overflow-hidden">
                                <img src={`https://i.pravatar.cc/100?u=${i}`} alt="" className="w-full h-full object-cover opacity-60" />
                            </div>
                        ))}
                    </div>
                </Card>

                <Card className="flex flex-col justify-center p-10 bg-surface border-surface-border">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Protocol Adherence Rate</p>
                    <h3 className="text-4xl font-black text-foreground tracking-tighter leading-none">{stats.protocolAdherence}%</h3>
                    <div className="w-full h-2 bg-background rounded-full mt-10 overflow-hidden border border-surface-border">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${stats.protocolAdherence}%` }}
                            className="h-full bg-gradient-to-r from-primary to-pink-500"
                        ></motion.div>
                    </div>
                </Card>
            </div>

            <div className="flex flex-col lg:row gap-6 items-center justify-between">
                <div className="relative w-full lg:w-[450px] group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Filter badge library..."
                        className="w-full pl-14 pr-6 py-4 bg-background border border-surface-border rounded-2xl text-xs font-bold text-foreground placeholder:text-slate-400 focus:bg-surface focus:border-primary/30 outline-none transition-all"
                    />
                </div>
                <Button variant="outline" className="w-full lg:w-auto h-14 bg-background border-surface-border text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-foreground px-8">
                    <Filter className="w-4 h-4 mr-3" /> All Classifications
                </Button>
            </div>

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-bold uppercase tracking-widest font-black">
                    Error loading badges: {error}
                </div>
            )}

            {/* Badges Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
                {badges.map((badge, i) => (
                    <motion.div
                        key={badge.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                    >
                        <Card className="p-0 overflow-hidden flex flex-col group h-full bg-surface border-surface-border hover:border-primary/30 transition-all shadow-2xl">
                            <div className={`h-32 bg-background flex items-center justify-center p-6 border-b border-surface-border group-hover:bg-primary/5 transition-colors relative overflow-hidden`}>
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/20"></div>
                                <div className={`p-5 bg-background rounded-[30px] border border-surface-border shadow-2xl transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 relative z-10`}>
                                    {badge.icon_url ? <img src={badge.icon_url} className="w-10 h-10 object-contain" /> : getIcon(badge.badge_type)}
                                </div>
                            </div>

                            <div className="p-8 flex-1 flex flex-col">
                                <div className="flex items-start justify-between mb-6">
                                    <div>
                                        <h3 className="text-xl font-black text-foreground uppercase tracking-tight group-hover:text-primary transition-colors">{badge.name}</h3>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed mt-2 line-clamp-2">
                                            {badge.description}
                                        </p>
                                    </div>
                                    <button className="p-2 hover:bg-background rounded-xl text-slate-400 group-hover:text-foreground transition-colors">
                                        <MoreVertical className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="mt-auto grid grid-cols-2 gap-6 pt-8 border-t border-surface-border">
                                    <div>
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Protocol</p>
                                        <p className="text-[10px] font-black text-foreground mt-1 uppercase tracking-tighter truncate">
                                            {badge.badge_type} check
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Incentive</p>
                                        <div className="flex items-center justify-end text-primary mt-1">
                                            <Sparkles className="w-3 h-3 mr-1.5" />
                                            <p className="text-[10px] font-black uppercase tracking-tighter">+Points</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 flex items-center justify-between">
                                    <div className="flex items-center text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                        <Award className="w-3.5 h-3.5 mr-2 text-primary" /> -- Verification
                                    </div>
                                    <Button variant="ghost" size="sm" className="h-10 px-4 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-foreground bg-background border border-surface-border">
                                        Adjust Logic
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                ))}

                {badges.length === 0 && !loading && (
                    <div className="col-span-full h-80 rounded-[40px] border-2 border-dashed border-surface-border flex flex-col items-center justify-center p-12 text-center bg-surface/50">
                        <div className="w-20 h-20 bg-background rounded-[30px] flex items-center justify-center mb-6 border border-surface-border">
                            <Trophy className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-black text-slate-400 uppercase tracking-tight">Badge Depository Vacant</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-3 max-w-xs leading-relaxed">
                            No active reward protocols found. Initiate a new incentive structure for your participants.
                        </p>
                    </div>
                )}
            </div>

            {/* Forge Badge Modal */}
            <AnimatePresence>
                {isForgeModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/90 backdrop-blur-xl p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-surface border border-surface-border rounded-[40px] w-full max-w-lg p-10 shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-10">
                                <div>
                                    <h3 className="text-2xl font-black text-foreground uppercase tracking-tighter">Forge Milestone</h3>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Configure a new rewards protocol</p>
                                </div>
                                <Button variant="ghost" className="text-slate-500 hover:text-foreground" onClick={() => setIsForgeModalOpen(false)}>
                                    <Plus className="w-6 h-6 rotate-45" />
                                </Button>
                            </div>

                            <form onSubmit={handleForgeBadge} className="space-y-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Badge Designation</label>
                                    <input
                                        className="w-full bg-background border border-surface-border rounded-2xl px-6 py-4 text-foreground text-sm font-bold focus:border-primary/50 focus:bg-background outline-none transition-all"
                                        placeholder="e.g. Master Intercessor"
                                        value={newBadge.name}
                                        onChange={e => setNewBadge({ ...newBadge, name: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Protocol Description</label>
                                    <textarea
                                        className="w-full bg-background border border-surface-border rounded-2xl px-6 py-4 text-foreground text-sm font-bold focus:border-primary/50 focus:bg-background outline-none h-24 resize-none transition-all"
                                        placeholder="Define the criteria for attainment..."
                                        value={newBadge.description}
                                        onChange={e => setNewBadge({ ...newBadge, description: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Classification</label>
                                        <select
                                            className="w-full bg-background border border-surface-border rounded-2xl px-6 py-4 text-foreground text-sm font-bold focus:border-primary/50 focus:bg-background outline-none appearance-none cursor-pointer"
                                            value={newBadge.badge_type}
                                            onChange={e => setNewBadge({ ...newBadge, badge_type: e.target.value })}
                                        >
                                            <option value="engagement">Engagement</option>
                                            <option value="attendance">Attendance</option>
                                            <option value="assignment">Academic</option>
                                            <option value="service">Service</option>
                                        </select>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Incentive Yield</label>
                                        <input
                                            type="number"
                                            className="w-full bg-background border border-surface-border rounded-2xl px-6 py-4 text-foreground text-sm font-bold focus:border-primary/50 focus:bg-background outline-none transition-all"
                                            value={newBadge.points_benefit}
                                            onChange={e => setNewBadge({ ...newBadge, points_benefit: parseInt(e.target.value) })}
                                            required
                                        />
                                    </div>
                                </div>

                                <Button type="submit" variant="premium" className="w-full h-16 text-xs font-black uppercase tracking-[0.2em]" disabled={isForging}>
                                    {isForging ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Activate Protocol'}
                                </Button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
