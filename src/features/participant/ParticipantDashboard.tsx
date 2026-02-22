
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { supabase } from '@/services/supabase';
import { Card, GlassBox } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Calendar, ChevronRight, Clock, Award, Star, Banknote, QrCode, UserCircle2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

export function ParticipantDashboard() {
    const { user } = useAuth();
    const { organization, currentProfile } = useOrganization();
    const { orgSlug } = useParams();
    const navigate = useNavigate();

    const [enrollments, setEnrollments] = useState<any[]>([]);
    const [badges, setBadges] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (currentProfile) fetchDashboardData();
    }, [currentProfile]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            // Fetch Enrollments with Program details
            const { data: enrollmentData, error } = await supabase
                .from('enrollments')
                .select(`
                    *,
                    program:programs(*)
                `)
                .eq('user_id', currentProfile?.id)
                .in('status', ['active', 'pending']);

            if (error) throw error;
            setEnrollments(enrollmentData || []);

            // Fetch User Badges
            const { data: badgeData } = await supabase
                .from('user_badges')
                .select('*', { count: 'exact' })
                .eq('user_id', currentProfile?.id);
            setBadges(badgeData || []);
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        <div className="p-6 space-y-8">
            {/* Header Greeting */}
            <div className="space-y-1 pt-6">
                <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">{getGreeting()}</p>
                <h1 className="text-3xl font-black text-white tracking-tight">
                    {currentProfile?.first_name || 'Friend'}
                </h1>
                <p className="text-slate-400 text-sm">Ready to grow today?</p>
            </div>

            {/* Quick Stats / Gamification */}
            <div className="grid grid-cols-2 gap-4">
                <GlassBox className="p-4 bg-indigo-500/10 border-indigo-500/20">
                    <Award className="w-6 h-6 text-indigo-400 mb-2" />
                    <div className="text-2xl font-black text-white">{badges.length}</div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Badges Earned</div>
                </GlassBox>
                <GlassBox className="p-4 bg-pink-500/10 border-pink-500/20">
                    <Star className="w-6 h-6 text-pink-400 mb-2" />
                    <div className="text-2xl font-black text-white">{enrollments.length}</div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Programs Total</div>
                </GlassBox>
            </div>

            {/* Attendance Quick Access */}
            <div className="grid grid-cols-2 gap-4">
                <Button
                    variant="outline"
                    className="h-20 bg-emerald-500/5 border-emerald-500/10 flex flex-col items-center justify-center gap-2 group hover:bg-emerald-500/10 active:scale-95 transition-all"
                    onClick={() => navigate(`/portal/${orgSlug}/dashboard/qr`)}
                >
                    <QrCode className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Scan Session</span>
                </Button>
                <Button
                    variant="outline"
                    className="h-20 bg-indigo-500/5 border-indigo-500/10 flex flex-col items-center justify-center gap-2 group hover:bg-indigo-500/10 active:scale-95 transition-all"
                    onClick={() => navigate(`/portal/${orgSlug}/dashboard/qr`)}
                >
                    <UserCircle2 className="w-6 h-6 text-indigo-400 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">My Digital ID</span>
                </Button>
            </div>

            {/* Active Enrollments */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-black text-white uppercase tracking-tight">My Programs</h2>
                    {enrollments.length > 0 && (
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest cursor-pointer">View All</span>
                    )}
                </div>

                {loading ? (
                    <div className="space-y-3">
                        {[1, 2].map(i => (
                            <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                ) : enrollments.length > 0 ? (
                    <div className="space-y-3">
                        {enrollments.map((enrollment) => (
                            <GlassBox
                                key={enrollment.id}
                                className="p-0 overflow-hidden active:scale-[0.98] transition-transform"
                                onClick={() => navigate(`/portal/${orgSlug}/dashboard/program/${enrollment.program.id}`)}
                            >
                                <div className="flex h-24">
                                    <div className="w-24 bg-slate-800 relative">
                                        {enrollment.program.image_url ? (
                                            <img src={enrollment.program.image_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
                                                <Calendar className="w-8 h-8 text-white/20" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 p-4 flex flex-col justify-center">
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className="font-bold text-white text-sm line-clamp-1">{enrollment.program.name}</h3>
                                            {enrollment.payment_status === 'pending' && (
                                                <span className="bg-rose-500/20 text-rose-400 text-[8px] font-black uppercase px-2 py-0.5 rounded border border-rose-500/20">
                                                    Action Required
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                            {enrollment.payment_status === 'pending' ? (
                                                <div className="text-amber-400 flex items-center gap-1">
                                                    <Banknote className="w-3 h-3" />
                                                    <span>Pay at Office</span>
                                                </div>
                                            ) : (
                                                <>
                                                    <Clock className="w-3 h-3" />
                                                    <span>In Progress</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="w-10 flex items-center justify-center text-slate-500">
                                        <ChevronRight className="w-5 h-5" />
                                    </div>
                                </div>
                            </GlassBox>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 bg-white/5 rounded-3xl border border-white/5 border-dashed">
                        <p className="text-slate-400 text-sm mb-4">You haven't joined any programs yet.</p>
                        <Button
                            variant="premium"
                            size="sm"
                            className="text-xs uppercase tracking-widest font-black"
                            onClick={() => navigate(`/portal/${orgSlug}/dashboard/browse`)}
                        >
                            Browse Programs
                        </Button>
                    </div>
                )}
            </div>

            {/* Coming Soon / Announcements placeholder */}
            <div className="space-y-4">
                <h2 className="text-lg font-black text-white uppercase tracking-tight">Announcements</h2>
                <GlassBox className="p-4 border-white/5 opacity-60">
                    <p className="text-xs text-slate-400">No new announcements from your community.</p>
                </GlassBox>
            </div>
        </div>
    );
}
