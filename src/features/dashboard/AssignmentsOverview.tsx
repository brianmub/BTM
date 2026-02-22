import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { useOrganization } from '@/hooks/useOrganization';
import { Card, GlassBox } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
    FileText,
    Calendar,
    ChevronRight,
    Clock,
    CheckCircle,
    AlertCircle,
    Users,
    ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function AssignmentsOverview() {
    const { organization } = useOrganization();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        pending: 0,
        graded: 0,
        totalTasks: 0
    });
    const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (organization) fetchData();
    }, [organization]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch total assignments
            const { count: tasksCount } = await supabase
                .from('assignments')
                .select('*', { count: 'exact', head: true })
                .eq('organization_id', organization!.id);

            // Fetch submissions for stats
            const { data: subsData } = await supabase
                .from('assignment_submissions')
                .select('status')
                .eq('organization_id', organization!.id);

            const pending = subsData?.filter(s => s.status === 'submitted').length || 0;
            const graded = subsData?.filter(s => s.status === 'graded').length || 0;

            setStats({
                pending,
                graded,
                totalTasks: tasksCount || 0
            });

            // Fetch recent submissions with details
            const { data: recent } = await supabase
                .from('assignment_submissions')
                .select(`
                    *,
                    users (first_name, surname),
                    assignments (name, session_id)
                `)
                .eq('organization_id', organization!.id)
                .order('submitted_at', { ascending: false })
                .limit(10);

            setRecentSubmissions(recent || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="animate-pulse space-y-8">
        <div className="h-32 bg-white/5 rounded-3xl" />
        <div className="grid grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-white/5 rounded-2xl" />)}
        </div>
        <div className="h-96 bg-white/5 rounded-3xl" />
    </div>;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <p className="text-xs font-black text-indigo-400 uppercase tracking-[0.2em] mb-2">Protocol Intake</p>
                    <h1 className="text-4xl font-black text-white uppercase tracking-tight">Assignment Matrix</h1>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-6">
                <GlassBox className="p-6 border-white/5 bg-amber-500/5">
                    <AlertCircle className="w-6 h-6 text-amber-400 mb-2" />
                    <div className="text-3xl font-black text-white">{stats.pending}</div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pending Evaluation</p>
                </GlassBox>
                <GlassBox className="p-6 border-white/5 bg-emerald-500/5">
                    <CheckCircle className="w-6 h-6 text-emerald-400 mb-2" />
                    <div className="text-3xl font-black text-white">{stats.graded}</div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Graded Protocols</p>
                </GlassBox>
                <GlassBox className="p-6 border-white/5 bg-indigo-500/5">
                    <FileText className="w-6 h-6 text-indigo-400 mb-2" />
                    <div className="text-3xl font-black text-white">{stats.totalTasks}</div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Assignments</p>
                </GlassBox>
            </div>

            {/* Recent Submissions */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                        <Clock className="w-4 h-4 text-indigo-400" />
                        Live Intake Stream
                    </h2>
                </div>

                <div className="grid gap-4">
                    {recentSubmissions.length > 0 ? recentSubmissions.map((sub) => (
                        <Card key={sub.id} className="p-6 bg-slate-900/40 border-white/5 hover:border-indigo-500/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 group">
                            <div className="flex items-center gap-6">
                                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-indigo-400 border border-white/5">
                                    <Users className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="text-sm font-black text-white uppercase tracking-tight">{sub.users.first_name} {sub.users.surname}</p>
                                        <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{sub.assignments.name}</p>
                                    </div>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                        Submitted {new Date(sub.submitted_at).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border ${sub.status === 'graded'
                                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                        : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                    }`}>
                                    {sub.status === 'graded' ? `Scored: ${sub.score}` : 'Pending Proof'}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-white"
                                    onClick={async () => {
                                        // Navigate to the program details context where this assignment lives
                                        const { data: session } = await supabase
                                            .from('sessions')
                                            .select('program_id')
                                            .eq('id', sub.assignments.session_id)
                                            .single();
                                        if (session) navigate(`/dashboard/programs/${session.program_id}`);
                                    }}
                                >
                                    Evaluate <ArrowRight className="w-3 h-3 ml-2" />
                                </Button>
                            </div>
                        </Card>
                    )) : (
                        <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                            <FileText className="w-10 h-10 text-slate-700 mx-auto mb-4" />
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">No recent intake activity detected.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
