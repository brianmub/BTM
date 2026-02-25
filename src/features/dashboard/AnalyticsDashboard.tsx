import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import {
    TrendingUp,
    Download,
    Calendar,
    Filter,
    ArrowUpRight,
    ArrowDownRight,
    Sparkles,
    Activity,
    Award,
    Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useOrganization } from '@/hooks/useOrganization';
import { profileService } from '@/services/profileService';

export function AnalyticsDashboard() {
    const { organization, loading: orgLoading } = useOrganization();
    const [stats, setStats] = useState({ programs: 0, sessions: 0, attendance: 0 });
    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState<any>({ attendanceFlux: [], userExpansion: [], programPerformance: [] });

    useEffect(() => {
        if (orgLoading) return;

        if (organization?.id) {
            fetchStats();
        } else {
            setLoading(false);
        }
    }, [organization?.id, orgLoading]);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const [s, a] = await Promise.all([
                profileService.getStats(organization!.id),
                profileService.getAnalytics(organization!.id)
            ]);
            setStats(s as any);
            setAnalytics(a);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Process Attendance Flux for Chart (Last 7 Days)
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    function lastSevenDays() {
        return [6, 5, 4, 3, 2, 1, 0].map(i => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d;
        });
    }

    const attendanceData = lastSevenDays().map(date => {
        const dayName = days[date.getDay()];
        const count = analytics.attendanceFlux.filter((a: any) =>
            new Date(a.checkin_time).toDateString() === date.toDateString()
        ).length;
        return { name: dayName, attendance: count, capacity: 100 };
    });

    const growthData = [3, 2, 1, 0].map(weeksAgo => {
        const start = new Date();
        start.setDate(start.getDate() - (weeksAgo + 1) * 7);
        const end = new Date();
        end.setDate(end.getDate() - weeksAgo * 7);

        const count = analytics.userExpansion.filter((e: any) => {
            const date = new Date(e.enrolled_at);
            return date >= start && date < end;
        }).length;

        return { name: `Wk ${4 - weeksAgo}`, users: count };
    });

    if (loading && stats.programs === 0) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
            </div>
        );
    }

    const avgAttendance = analytics.attendanceFlux.length > 0
        ? Math.round(analytics.attendanceFlux.length / new Set(analytics.attendanceFlux.map((a: any) => new Date(a.checkin_time).toDateString())).size)
        : 0;

    const newEnrollments = analytics.userExpansion.length;

    return (
        <div className="space-y-12 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div>
                    <div className="flex items-center space-x-2 mb-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Intelligence Matrix</span>
                    </div>
                    <h1 className="text-4xl font-black text-foreground tracking-tight uppercase">Reporting & Analytics</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">Deep insights into organizational expansion</p>
                </div>
                <div className="flex gap-4">
                    <Button variant="outline" className="h-14 px-8 bg-background border-surface-border text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-foreground">
                        <Filter className="w-4 h-4 mr-3" /> Last 30 Cycles
                    </Button>
                    <Button variant="premium" className="h-14 px-8 font-black uppercase tracking-widest text-xs">
                        <Download className="w-4 h-4 mr-3" /> Export Intelligence
                    </Button>
                </div>
            </div>

            <div className="grid md:grid-cols-4 gap-8">
                {[
                    { label: 'Avg. Attendance', value: avgAttendance, change: 'Computed', up: true, color: 'pink' },
                    { label: 'New Enrolments', value: newEnrollments, change: 'Live', up: true, color: 'emerald' },
                    { label: 'Active Matrix', value: stats.programs, change: 'Optimal', up: true, color: 'amber' },
                ].map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                    >
                        <Card className="bg-surface border-surface-border p-8 group hover:border-primary/30 transition-all shadow-xl">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4">{stat.label}</p>
                            <div className="flex items-end justify-between">
                                <h3 className="text-3xl font-black text-foreground tracking-tighter">{stat.value}</h3>
                                <div className={`flex items-center text-[9px] font-black ${stat.up ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'} px-2 py-1 rounded-lg border ${stat.up ? 'border-emerald-500/20' : 'border-rose-500/20'} uppercase tracking-widest`}>
                                    {stat.up ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                                    {stat.change}
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-12">
                {/* Attendance Trends */}
                <Card className="p-10 bg-surface border-surface-border overflow-hidden relative shadow-2xl">
                    <div className="flex items-center justify-between mb-10 relative z-10">
                        <div className="flex items-center space-x-3">
                            <Activity className="w-5 h-5 text-primary" />
                            <h3 className="text-[11px] font-black text-foreground uppercase tracking-[0.2em]">Attendance Flux</h3>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)]"></div>
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Actual</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-slate-200 rounded-full"></div>
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Capacity</span>
                            </div>
                        </div>
                    </div>
                    <div className="h-80 w-full relative z-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={attendanceData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }}
                                    dy={10}
                                />
                                <YAxis hide />
                                <Tooltip
                                    cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                                    contentStyle={{
                                        backgroundColor: 'var(--surface)',
                                        borderRadius: '16px',
                                        border: '1px solid var(--surface-border)',
                                        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
                                    }}
                                    itemStyle={{ color: 'var(--foreground)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}
                                />
                                <Bar dataKey="capacity" fill="rgba(0,0,0,0.05)" radius={[6, 6, 0, 0]} barSize={32} />
                                <Bar dataKey="attendance" fill="var(--primary)" radius={[6, 6, 0, 0]} barSize={32} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Growth Chart */}
                <Card className="p-10 bg-surface border-surface-border overflow-hidden relative shadow-2xl">
                    <div className="flex items-center justify-between mb-10 relative z-10">
                        <div className="flex items-center space-x-3">
                            <TrendingUp className="w-5 h-5 text-pink-500" />
                            <h3 className="text-[11px] font-black text-foreground uppercase tracking-[0.2em]">User Expansion</h3>
                        </div>
                    </div>
                    <div className="h-80 w-full relative z-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={growthData}>
                                <defs>
                                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'var(--surface)',
                                        borderRadius: '16px',
                                        border: '1px solid var(--surface-border)',
                                        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
                                    }}
                                    itemStyle={{ color: 'var(--foreground)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="users"
                                    stroke="#ec4899"
                                    strokeWidth={4}
                                    fillOpacity={1}
                                    fill="url(#colorUsers)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            <div className="grid lg:grid-cols-3 gap-12">
                <Card className="lg:col-span-2 p-10 bg-surface border-surface-border shadow-2xl">
                    <h3 className="text-[11px] font-black text-foreground uppercase tracking-[0.2em] mb-10">Curriculum Performance</h3>
                    <div className="space-y-8">
                        {analytics.programPerformance.length > 0 ? analytics.programPerformance.map((program: any, i: number) => {
                            const colors = ['bg-indigo-500', 'bg-pink-500', 'bg-amber-500', 'bg-emerald-500'];
                            const color = colors[i % colors.length];
                            // Using enrollment count as a simple performance metric for now
                            const rate = Math.min(100, (program.enrollments[0]?.count || 0) * 5); // Multiplier for visual effect

                            return (
                                <div key={program.id} className="space-y-3">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                        <span className="text-foreground">{program.name}</span>
                                        <span className="text-slate-500">{program.enrollments[0]?.count || 0} Enrolled</span>
                                    </div>
                                    <div className="w-full h-2 bg-background rounded-full overflow-hidden border border-surface-border p-0.5">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${rate}%` }}
                                            className={`h-full ${color} rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(0,0,0,0.5)]`}
                                        ></motion.div>
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="text-center py-10 text-slate-500 text-[10px] uppercase font-black tracking-widest italic">
                                No active curricula recorded.
                            </div>
                        )}
                    </div>
                </Card>

                <Card className="bg-gradient-premium border-none p-10 flex flex-col items-center justify-center text-center shadow-2xl shadow-indigo-500/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
                        <Award className="w-32 h-32 text-white" />
                    </div>
                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8 mx-auto border border-white/20">
                            <Calendar className="w-8 h-8 text-white" />
                        </div>
                        <h4 className="text-xl font-black text-white uppercase tracking-tight mb-3">Intelligence Sync</h4>
                        <p className="text-[10px] text-white/70 font-bold uppercase tracking-widest mb-10 max-w-[200px] leading-relaxed">
                            Configure automated digital reports delivered to the oversight committee.
                        </p>
                        <Button variant="outline" className="w-full h-14 bg-white/10 border-white/20 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/20">
                            Execute Automation
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
}
