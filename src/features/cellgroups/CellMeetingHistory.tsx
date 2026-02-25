import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/services/supabase';
import { GlassBox } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Loader2, CalendarCheck, Users, CheckCircle2, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface MeetingRecord {
    id: string;
    title: string;
    scheduled_date: string;
    status: 'open' | 'closed';
    present_count: number;
    absent_count: number;
    total_count: number;
}

interface GroupInfo {
    name: string;
}

export function CellMeetingHistory() {
    const { groupId, orgSlug } = useParams<{ groupId: string; orgSlug: string }>();
    const navigate = useNavigate();
    const cellGroupsPath = orgSlug ? `/portal/${orgSlug}/dashboard/cell-groups` : '/dashboard/cell-groups';

    const [group, setGroup] = useState<GroupInfo | null>(null);
    const [meetings, setMeetings] = useState<MeetingRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (groupId) fetchHistory();
    }, [groupId]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            // Fetch group info
            const { data: groupData } = await supabase
                .from('program_groups')
                .select('name')
                .eq('id', groupId)
                .single();

            setGroup(groupData);

            // Fetch all meetings for this group
            const { data: meetingsData, error } = await supabase
                .from('cell_meetings')
                .select('id, title, scheduled_date, status')
                .eq('group_id', groupId)
                .order('scheduled_date', { ascending: false });

            if (error) throw error;

            // For each meeting, fetch attendance summary
            const meetingsWithStats = await Promise.all(
                (meetingsData || []).map(async (m: any) => {
                    const { data: att } = await supabase
                        .from('cell_attendance')
                        .select('status')
                        .eq('meeting_id', m.id);

                    const present = att?.filter((a: any) => a.status === 'present').length || 0;
                    const absent = att?.filter((a: any) => a.status === 'absent').length || 0;

                    return {
                        ...m,
                        present_count: present,
                        absent_count: absent,
                        total_count: (att?.length || 0),
                    };
                })
            );

            setMeetings(meetingsWithStats);
        } catch (err) {
            console.error('Error fetching history:', err);
        } finally {
            setLoading(false);
        }
    };

    const attendancePct = (m: MeetingRecord) =>
        m.total_count > 0 ? Math.round((m.present_count / m.total_count) * 100) : 0;

    return (
        <div className="max-w-4xl mx-auto space-y-10 pb-20">
            {/* Header */}
            <div className="flex items-center gap-6">
                <Button
                    variant="ghost"
                    className="h-10 w-10 p-0 rounded-xl border border-surface-border bg-background"
                    onClick={() => navigate(cellGroupsPath)}
                >
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">
                        Meeting History
                    </h1>
                    {group && (
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">
                            {group.name}
                        </p>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-24">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                </div>
            ) : meetings.length === 0 ? (
                <div className="text-center py-32 border border-dashed border-surface-border rounded-3xl bg-surface/30">
                    <CalendarCheck className="w-14 h-14 text-slate-600 mx-auto mb-4" />
                    <p className="text-foreground font-black uppercase tracking-widest text-sm">No Meetings Yet</p>
                    <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest mt-2">
                        Open your first meeting from the Cell Groups dashboard.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {meetings.map((m, i) => {
                        const pct = attendancePct(m);
                        const pctColor = pct >= 75 ? 'text-emerald-400' : pct >= 50 ? 'text-amber-400' : 'text-rose-400';
                        const barColor = pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-500';

                        return (
                            <motion.div
                                key={m.id}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.06 }}
                            >
                                <GlassBox className="p-6 border-surface-border bg-surface hover:border-primary/30 transition-all">
                                    <div className="flex items-start justify-between gap-6">
                                        {/* Date & Title */}
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-primary/10 rounded-xl border border-primary/20 shrink-0">
                                                <CalendarCheck className="w-5 h-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-foreground uppercase tracking-tight">
                                                    {m.title || `Meeting — ${m.scheduled_date}`}
                                                </p>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                                                    {new Date(m.scheduled_date).toLocaleDateString('en-ZA', {
                                                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                                                    })}
                                                </p>
                                                <span className={`inline-block mt-1 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${m.status === 'open' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'}`}>
                                                    {m.status}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Attendance Rate */}
                                        <div className="text-right shrink-0">
                                            <p className={`text-3xl font-black tracking-tighter ${pctColor}`}>{pct}%</p>
                                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Attendance</p>
                                        </div>
                                    </div>

                                    {/* Stats + Bar */}
                                    {m.total_count > 0 && (
                                        <div className="mt-6 space-y-3">
                                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                                <span className="flex items-center gap-1.5 text-emerald-400">
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> {m.present_count} Present
                                                </span>
                                                <span className="flex items-center gap-1.5 text-slate-500">
                                                    <XCircle className="w-3.5 h-3.5" /> {m.absent_count} Absent
                                                </span>
                                                <span className="flex items-center gap-1.5 text-slate-400">
                                                    <Users className="w-3.5 h-3.5" /> {m.total_count} Total
                                                </span>
                                            </div>
                                            <div className="h-1.5 bg-surface rounded-full overflow-hidden border border-surface-border">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </GlassBox>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
