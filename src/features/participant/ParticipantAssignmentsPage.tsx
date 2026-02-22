import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { supabase } from '@/services/supabase';
import { Card, GlassBox } from '@/components/ui/Card';
import {
    FileText,
    Calendar,
    ChevronRight,
    Clock,
    CheckCircle,
    AlertCircle,
    Loader2
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';

export function ParticipantAssignmentsPage() {
    const { user } = useAuth();
    const { organization, currentProfile } = useOrganization();
    const { orgSlug } = useParams();
    const navigate = useNavigate();
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (currentProfile) fetchAllTasks();
    }, [currentProfile]);

    const fetchAllTasks = async () => {
        setLoading(true);
        try {
            // Get all enrollments
            const { data: enrollments } = await supabase
                .from('enrollments')
                .select('program_id')
                .eq('user_id', currentProfile?.id);

            const programIds = enrollments?.map(e => e.program_id) || [];
            if (programIds.length === 0) {
                setTasks([]);
                return;
            }

            // Get sessions for these programs
            const { data: sessions } = await supabase
                .from('sessions')
                .select('id, name, program_id, programs(name)')
                .in('program_id', programIds);

            const sessionIds = sessions?.map(s => s.id) || [];
            if (sessionIds.length === 0) {
                setTasks([]);
                return;
            }

            // Get assignments for these sessions
            const { data: assignments } = await supabase
                .from('assignments')
                .select('*')
                .in('session_id', sessionIds)
                .order('due_date', { ascending: true });

            // Get submissions
            const { data: submissions } = await supabase
                .from('assignment_submissions')
                .select('*')
                .eq('user_id', currentProfile?.id);

            const combined = sessions && assignments ? assignments.map(asg => ({
                ...asg,
                session: sessions.find(s => s.id === asg.session_id),
                submission: submissions?.find(sub => sub.assignment_id === asg.id)
            })) : [];

            setTasks(combined);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="p-6 flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
    );

    const pendingTasks = tasks.filter(t => !t.submission);
    const completedTasks = tasks.filter(t => t.submission);

    return (
        <div className="p-6 space-y-8 pb-24">
            <header className="space-y-1">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Training Protocol</p>
                <h1 className="text-3xl font-black text-white tracking-tight uppercase">My Assignments</h1>
                <p className="text-slate-400 text-sm">Review your active tasks and requirements.</p>
            </header>

            <div className="grid grid-cols-2 gap-4">
                <GlassBox className="p-4 bg-amber-500/10 border-amber-500/20">
                    <div className="text-2xl font-black text-white">{pendingTasks.length}</div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Pending Tasks</div>
                </GlassBox>
                <GlassBox className="p-4 bg-emerald-500/10 border-emerald-500/20">
                    <div className="text-2xl font-black text-white">{completedTasks.length}</div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Handed In</div>
                </GlassBox>
            </div>

            <div className="space-y-6">
                <div className="space-y-4">
                    <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] px-1">Active Requirements</h2>
                    {tasks.length > 0 ? (
                        <div className="grid gap-3">
                            {tasks.map((task) => {
                                const isOverdue = !task.submission && new Date(task.due_date) < new Date();
                                return (
                                    <GlassBox
                                        key={task.id}
                                        className="p-4 active:scale-[0.98] transition-transform cursor-pointer overflow-hidden group"
                                        onClick={() => navigate(`/portal/${orgSlug}/dashboard/program/${task.session.program_id}`)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-xl transition-colors ${task.submission
                                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                                : isOverdue
                                                    ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                                                    : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                                                }`}>
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-sm font-black text-white uppercase tracking-tight line-clamp-1">{task.name}</h3>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">{task.session?.programs?.name}</p>
                                                    <span className="w-0.5 h-0.5 bg-slate-700 rounded-full"></span>
                                                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-none">
                                                        {task.session?.name}
                                                    </p>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-indigo-400 transition-colors" />
                                        </div>
                                        <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3">
                                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest flex items-center">
                                                <Calendar className="w-3 h-3 mr-1.5 text-pink-400" /> Due: {new Date(task.due_date).toLocaleDateString()}
                                            </span>
                                            {task.submission ? (
                                                <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest flex items-center">
                                                    <CheckCircle className="w-3 h-3 mr-1" /> Handed In
                                                </span>
                                            ) : isOverdue ? (
                                                <span className="text-[8px] font-black text-rose-400 uppercase tracking-widest flex items-center">
                                                    <AlertCircle className="w-3 h-3 mr-1" /> Overdue
                                                </span>
                                            ) : (
                                                <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest flex items-center">
                                                    Action Required
                                                </span>
                                            )}
                                        </div>
                                    </GlassBox>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                            <Clock className="w-10 h-10 text-slate-700 mx-auto mb-4" />
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">No tasks assigned to your profile yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
