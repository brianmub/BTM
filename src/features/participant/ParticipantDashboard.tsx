
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { supabase } from '@/services/supabase';
import { GlassBox } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
    Calendar, ChevronRight, Clock, Award, Star, Banknote, QrCode, UserCircle2,
    Trophy, Zap, Shield, Target, TrendingUp, Flame, MapPin
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';

const BADGE_DEFINITIONS = [
    { id: 'first_step', label: 'First Step', icon: Target, color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20', desc: 'Joined your first program' },
    { id: 'consistent', label: 'Consistent', icon: Flame, color: 'text-orange-500', bg: 'bg-orange-500/10 border-orange-500/20', desc: 'Attended 5 sessions' },
    { id: 'scholar', label: 'Scholar', icon: Shield, color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/20', desc: 'Verified session presence' },
    { id: 'rising', label: 'Rising Star', icon: Star, color: 'text-primary', bg: 'bg-primary/10 border-primary/20', desc: 'Earned 100 Faith Points' },
];

function XPProgressBar({ xp }: { xp: number }) {
    const level = Math.floor(xp / 100) + 1;
    const currentXP = xp % 100;
    const pct = currentXP;
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                        <Zap className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-white/60 uppercase tracking-[0.2em]">Faith Level</p>
                        <p className="text-lg font-black text-white leading-none">{level}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[9px] font-black text-white/60 uppercase tracking-widest">Faith Points</p>
                    <p className="text-lg font-black text-white leading-none">{xp} <span className="text-xs text-white/50">/ {level * 100}</span></p>
                </div>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                    className="h-full bg-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                />
            </div>
            <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest text-right">{100 - currentXP} XP to Level {level + 1}</p>
        </div>
    );
}

export function ParticipantDashboard() {
    const { user } = useAuth();
    const { organization, currentProfile } = useOrganization();
    const { orgSlug } = useParams();
    const navigate = useNavigate();

    const [enrollments, setEnrollments] = useState<any[]>([]);
    const [userGroups, setUserGroups] = useState<Record<string, any>>({}); // program_id -> group_name
    const [nextSessions, setNextSessions] = useState<Record<string, any>>({});
    const [badges, setBadges] = useState<string[]>([]);
    const [xp, setXp] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (currentProfile) fetchDashboardData();
    }, [currentProfile]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const { data: enrollmentData } = await supabase
                .from('enrollments')
                .select('*, program:programs(*)')
                .eq('user_id', currentProfile?.id)
                .in('status', ['enrolled', 'active', 'pending']);
            setEnrollments(enrollmentData || []);

            // Fetch next upcoming session per enrolled program
            if (enrollmentData && enrollmentData.length > 0) {
                const programIds = enrollmentData.map((e: any) => e.program_id);
                const today = new Date().toISOString().split('T')[0];
                const { data: upcoming } = await supabase
                    .from('sessions')
                    .select('id, name, session_date, start_time, location, program_id')
                    .in('program_id', programIds)
                    .gte('session_date', today)
                    .eq('is_active', true)
                    .order('session_date', { ascending: true });

                // Keep only the first upcoming session per program
                const map: Record<string, any> = {};
                (upcoming || []).forEach((s: any) => {
                    if (!map[s.program_id]) map[s.program_id] = s;
                });
                setNextSessions(map);
            }

            // Fetch user's assigned groups
            const { data: groupData } = await supabase
                .from('group_members')
                .select('group:program_groups(id, name, program_id)')
                .eq('user_id', currentProfile?.id);
            
            const groupMap: Record<string, any> = {};
            (groupData || []).forEach((g: any) => {
                if (g.group) groupMap[g.group.program_id] = g.group.name;
            });
            setUserGroups(groupMap);

            // Compute XP: 50 per enrollment + 25 per badge
            const enrollCount = (enrollmentData || []).length;

            const { data: badgeData } = await supabase
                .from('user_badges')
                .select('badge_id')
                .eq('user_id', currentProfile?.id);
            const earnedBadges = (badgeData || []).map((b: any) => b.badge_id);

            // Add 'first_step' automatically if enrolled in at least one program
            if (enrollCount >= 1 && !earnedBadges.includes('first_step')) {
                earnedBadges.push('first_step');
            }
            setBadges(earnedBadges);
            setXp(enrollCount * 50 + earnedBadges.length * 25);
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    const [programFilter, setProgramFilter] = useState<'all' | 'active' | 'pending'>('all');

    const filteredEnrollments = enrollments.filter(e => {
        if (programFilter === 'active') return e.payment_status === 'paid';
        if (programFilter === 'pending') return e.payment_status === 'pending';
        return true;
    });

    const getGreeting = () => {
        const h = new Date().getHours();
        if (h < 12) return 'Good Morning';
        if (h < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        <div className="min-h-screen">
            {/* ── HERO SECTION ── */}
            <div className="relative overflow-hidden bg-foreground px-6 pt-10 pb-10">
                {/* Diagonal red slash */}
                <div className="absolute -right-12 top-0 w-48 h-full bg-primary skew-x-[-10deg] opacity-90" />
                <div className="absolute -right-24 top-0 w-20 h-full bg-primary/30 skew-x-[-10deg]" />

                {/* ── ORG LOGO (top-right, over the red slash, like a club crest) ── */}
                <div className="absolute top-5 right-5 z-20">
                    {organization?.logo_url ? (
                        <img
                            src={organization.logo_url}
                            alt={organization.name}
                            className="w-14 h-14 rounded-2xl object-contain bg-white/10 border border-white/20 p-1 shadow-2xl"
                        />
                    ) : (
                        <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shadow-2xl backdrop-blur-sm">
                            <span className="text-2xl font-black text-white uppercase">
                                {organization?.name?.[0] ?? '⛪'}
                            </span>
                        </div>
                    )}
                </div>

                <div className="relative z-10 space-y-6">
                    <div>
                        <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.3em] mb-1">{getGreeting()}</p>
                        <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">
                            {currentProfile?.first_name
                                ? `${currentProfile.first_name} ${currentProfile.surname?.[0] ?? ''}`.trim()
                                : 'Welcome'}
                        </h1>
                        <p className="text-sm text-white/60 font-medium mt-1">{organization?.name ?? orgSlug}</p>
                    </div>

                    {/* XP Progress */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
                        <XPProgressBar xp={xp} />
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-2 gap-3 pb-2 border-b border-white/10">
                        <button
                            onClick={() => navigate(`/portal/${orgSlug}/dashboard/qr`)}
                            className="flex items-center gap-3 bg-white/10 hover:bg-white/20 active:scale-95 border border-white/10 rounded-xl px-4 py-3 transition-all"
                        >
                            <QrCode className="w-5 h-5 text-white" />
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">Scan In</span>
                        </button>
                        <button
                            onClick={() => navigate(`/portal/${orgSlug}/dashboard/qr`)}
                            className="flex items-center gap-3 bg-white/10 hover:bg-white/20 active:scale-95 border border-white/10 rounded-xl px-4 py-3 transition-all"
                        >
                            <UserCircle2 className="w-5 h-5 text-white" />
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">My ID</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-1">
                        <button
                            onClick={() => navigate(`/portal/${orgSlug}/dashboard/payments`)}
                            className="flex items-center justify-between gap-3 bg-primary/80 hover:bg-primary active:scale-95 border border-primary rounded-xl px-4 py-3 transition-all w-full"
                        >
                            <div className="flex items-center gap-3">
                                <Banknote className="w-5 h-5 text-white" />
                                <span className="text-[10px] font-black text-white uppercase tracking-widest">Financial History</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-white/50" />
                        </button>
                    </div>
                </div>
            </div>

            {/* ── CONTENT ── */}
            <div className="p-6 space-y-8 bg-background">

                {/* ── TROPHY ROOM ── */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xs font-black text-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-primary" /> Trophy Room
                        </h2>
                        <span className="text-[9px] font-black text-primary uppercase tracking-widest">{badges.length} / {BADGE_DEFINITIONS.length} Earned</span>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                        {BADGE_DEFINITIONS.map((badge) => {
                            const Icon = badge.icon;
                            const earned = badges.includes(badge.id);
                            return (
                                <motion.div
                                    key={badge.id}
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${earned
                                        ? badge.bg + ' shadow-lg'
                                        : 'bg-background border-surface-border opacity-40'
                                        }`}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${earned ? badge.bg : 'bg-surface'}`}>
                                        <Icon className={`w-5 h-5 ${earned ? badge.color : 'text-slate-500'}`} />
                                    </div>
                                    <p className={`text-[8px] font-black uppercase tracking-wider text-center leading-tight ${earned ? 'text-foreground' : 'text-slate-500'}`}>
                                        {badge.label}
                                    </p>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* ── MY PROGRAMS ── */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xs font-black text-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-primary" /> My Programs
                        </h2>
                        <span
                            className="text-[9px] font-bold text-primary uppercase tracking-widest cursor-pointer"
                            onClick={() => navigate(`/portal/${orgSlug}/dashboard/browse`)}
                        >
                            Browse More
                        </span>
                    </div>

                    {/* Segmented filter controls */}
                    {enrollments.length > 0 && (
                        <div className="flex gap-2">
                            {(['all', 'active', 'pending'] as const).map(f => (
                                <button
                                    key={f}
                                    onClick={() => setProgramFilter(f)}
                                    className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${programFilter === f
                                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                        : 'bg-surface border border-surface-border text-slate-500 hover:text-foreground'
                                        }`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    )}

                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2].map(i => (
                                <div key={i} className="h-24 bg-surface rounded-2xl animate-pulse border border-surface-border" />
                            ))}
                        </div>
                    ) : filteredEnrollments.length > 0 ? (
                        <div className="space-y-3">
                            {filteredEnrollments.map((enrollment, idx) => (
                                <motion.div
                                    key={enrollment.id}
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: idx * 0.08 }}
                                    onClick={() => navigate(`/portal/${orgSlug}/dashboard/program/${enrollment.program.id}`)}
                                    className="flex items-center gap-4 p-4 bg-surface border border-surface-border rounded-2xl active:scale-[0.98] transition-all cursor-pointer hover:border-primary/30 group shadow-sm"
                                >
                                    <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-primary/20 to-pink-500/20 flex items-center justify-center border border-surface-border">
                                        {enrollment.program.image_url
                                            ? <img src={enrollment.program.image_url} alt="" className="w-full h-full object-cover" />
                                            : <Calendar className="w-7 h-7 text-primary/40" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-black text-foreground text-sm uppercase tracking-tight truncate">{enrollment.program.name}</h3>
                                        <div className="flex flex-col gap-0.5 mt-1">
                                            {enrollment.payment_status === 'pending' ? (
                                                <span className="flex items-center gap-1 text-[9px] text-amber-500 font-black uppercase tracking-widest">
                                                    <Banknote className="w-3 h-3" /> Pay at Office
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-[9px] text-emerald-500 font-black uppercase tracking-widest">
                                                    <Clock className="w-3 h-3" /> Active
                                                </span>
                                            )}
                                            {userGroups[enrollment.program_id] && (
                                                <span className="flex items-center gap-1 text-[9px] text-primary font-black uppercase tracking-widest mt-0.5">
                                                    <Shield className="w-3 h-3" /> {userGroups[enrollment.program_id]}
                                                </span>
                                            )}
                                            {nextSessions[enrollment.program_id] && (
                                                <span className="flex items-center gap-1 text-[9px] text-slate-400 font-bold">
                                                    <Calendar className="w-3 h-3 text-primary" />
                                                    Next: {new Date(nextSessions[enrollment.program_id].session_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                    {' · '}{nextSessions[enrollment.program_id].start_time?.slice(0, 5)}
                                                    {nextSessions[enrollment.program_id].location && (
                                                        <> · <MapPin className="w-2.5 h-2.5 inline text-pink-500" /> {nextSessions[enrollment.program_id].location}</>
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-surface rounded-3xl border border-dashed border-surface-border">
                            <Award className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-500 text-sm font-medium mb-6">
                                {enrollments.length > 0 ? 'No programs match this filter.' : "Your journey hasn't started yet.\nJoin a program to begin."}
                            </p>
                            {enrollments.length === 0 && (
                                <Button
                                    variant="united"
                                    size="sm"
                                    className="text-xs"
                                    onClick={() => navigate(`/portal/${orgSlug}/dashboard/browse`)}
                                >
                                    Browse Programs
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                {/* ── ANNOUNCEMENTS ── */}
                <div className="space-y-3">
                    <h2 className="text-xs font-black text-foreground uppercase tracking-[0.2em]">Announcements</h2>
                    <div className="p-4 bg-surface border border-surface-border rounded-2xl">
                        <p className="text-xs text-slate-500 font-medium">No new announcements from your community.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
