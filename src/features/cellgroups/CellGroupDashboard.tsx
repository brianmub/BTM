import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/services/supabase';
import { useOrganization } from '@/hooks/useOrganization';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { GlassBox } from '@/components/ui/Card';
import {
    Loader2, Users, CalendarPlus, History, ClipboardList,
    Calendar, X, MapPin, Clock
} from 'lucide-react';
import { motion } from 'framer-motion';

interface CellGroup {
    id: string;
    name: string;
    description: string;
    max_capacity: number;
    member_count: number;
    last_meeting_date: string | null;
    open_meeting_id: string | null;
}

export function CellGroupDashboard() {
    const { organization } = useOrganization();
    const { profile } = useAuth();
    const { orgSlug } = useParams();
    const navigate = useNavigate();
    const basePath = orgSlug ? `/portal/${orgSlug}/dashboard/cell-groups` : '/dashboard/cell-groups';

    const [groups, setGroups] = useState<CellGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [scheduleGroup, setScheduleGroup] = useState<CellGroup | null>(null);

    useEffect(() => {
        if (organization && profile) fetchMyGroups();
    }, [organization, profile]);

    const fetchMyGroups = async () => {
        setLoading(true);
        try {
            // Both primary and stand-in facilitator see their groups
            const { data, error } = await supabase
                .from('program_groups')
                .select(`
                    id,
                    name,
                    description,
                    max_capacity,
                    members:group_members(count)
                `)
                .eq('organization_id', organization!.id)
                .or(`facilitator_id.eq.${profile!.id},second_facilitator_id.eq.${profile!.id}`);

            if (error) throw error;

            const groupsWithMeetings = await Promise.all(
                (data || []).map(async (g: any) => {
                    const { data: meetings } = await supabase
                        .from('cell_meetings')
                        .select('id, scheduled_date, status')
                        .eq('group_id', g.id)
                        .order('scheduled_date', { ascending: false })
                        .limit(5);

                    const openMeeting = meetings?.find((m: any) => m.status === 'open');
                    const lastClosed = meetings?.find((m: any) => m.status === 'closed');

                    return {
                        ...g,
                        member_count: g.members[0]?.count || 0,
                        last_meeting_date: lastClosed?.scheduled_date || null,
                        open_meeting_id: openMeeting?.id || null,
                    };
                })
            );

            setGroups(groupsWithMeetings);
        } catch (err) {
            console.error('Error fetching cell groups:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-12 pb-20">
            <div>
                <h1 className="text-4xl font-black text-foreground tracking-tight uppercase">Cell Groups</h1>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">
                    Your small groups — schedule independent meetings &amp; track attendance
                </p>
            </div>

            {loading ? (
                <div className="flex justify-center py-24">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                </div>
            ) : groups.length === 0 ? (
                <div className="text-center py-32 border border-dashed border-surface-border rounded-3xl bg-surface/30">
                    <Users className="w-14 h-14 text-slate-600 mx-auto mb-4" />
                    <p className="text-foreground font-black uppercase tracking-widest text-sm mb-2">No Groups Assigned</p>
                    <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest">
                        Ask your program admin to assign you to a cell group.
                    </p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 gap-6">
                    {groups.map((group, i) => (
                        <motion.div
                            key={group.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08 }}
                        >
                            <GlassBox className="p-8 border-surface-border bg-surface hover:border-primary/30 transition-all flex flex-col gap-6 shadow-xl">

                                <div className="flex items-start justify-between">
                                    <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
                                        <Users className="w-6 h-6 text-primary" />
                                    </div>
                                    {group.open_meeting_id && (
                                        <span className="text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full animate-pulse">
                                            Meeting Open
                                        </span>
                                    )}
                                </div>

                                <div>
                                    <h3 className="text-xl font-black text-foreground uppercase tracking-tight mb-1">{group.name}</h3>
                                    <p className="text-slate-500 text-xs leading-relaxed">
                                        {group.description || 'No description provided.'}
                                    </p>
                                </div>

                                <div className="flex gap-6 py-4 border-y border-surface-border">
                                    <div>
                                        <p className="text-2xl font-black text-foreground">{group.member_count}</p>
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-0.5">Members</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-black text-foreground">{group.max_capacity || '∞'}</p>
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-0.5">Capacity</p>
                                    </div>
                                    {group.last_meeting_date && (
                                        <div className="ml-auto text-right">
                                            <div className="flex items-center gap-1 text-slate-400 justify-end">
                                                <Calendar className="w-3 h-3" />
                                                <p className="text-[10px] font-black uppercase tracking-widest">Last Meeting</p>
                                            </div>
                                            <p className="text-xs font-black text-foreground mt-0.5">
                                                {new Date(group.last_meeting_date).toLocaleDateString()}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-3">
                                    {group.open_meeting_id ? (
                                        <Button
                                            variant="premium"
                                            className="flex-1 h-11 text-[10px] font-black uppercase tracking-widest"
                                            onClick={() => navigate(`${basePath}/${group.open_meeting_id}`)}
                                        >
                                            <ClipboardList className="w-4 h-4 mr-2" />
                                            Resume Register
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="premium"
                                            className="flex-1 h-11 text-[10px] font-black uppercase tracking-widest"
                                            onClick={() => setScheduleGroup(group)}
                                        >
                                            <CalendarPlus className="w-4 h-4 mr-2" />
                                            Schedule Meeting
                                        </Button>
                                    )}
                                    <Button
                                        variant="outline"
                                        className="h-11 px-4 border-surface-border bg-background text-[10px] font-black uppercase tracking-widest"
                                        onClick={() => navigate(`${basePath}/${group.id}/history`)}
                                    >
                                        <History className="w-4 h-4" />
                                    </Button>
                                </div>
                            </GlassBox>
                        </motion.div>
                    ))}
                </div>
            )}

            {scheduleGroup && (
                <ScheduleMeetingModal
                    group={scheduleGroup}
                    organizationId={organization!.id}
                    createdBy={profile!.id}
                    onClose={() => setScheduleGroup(null)}
                    onSuccess={(meetingId) => navigate(`${basePath}/${meetingId}`)}
                />
            )}
        </div>
    );
}

// ─── Schedule Meeting Modal ────────────────────────────────────────────────────
function ScheduleMeetingModal({
    group, organizationId, createdBy, onClose, onSuccess
}: {
    group: CellGroup;
    organizationId: string;
    createdBy: string;
    onClose: () => void;
    onSuccess: (meetingId: string) => void;
}) {
    const today = new Date().toISOString().split('T')[0];
    const [date, setDate] = useState(today);
    const [time, setTime] = useState('18:00');
    const [venue, setVenue] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const formattedDate = new Date(date).toLocaleDateString('en-ZA', {
                day: 'numeric', month: 'long', year: 'numeric'
            });
            const { data, error: err } = await supabase
                .from('cell_meetings')
                .insert([{
                    group_id: group.id,
                    organization_id: organizationId,
                    scheduled_date: date,
                    meeting_time: time,
                    title: `${group.name} — ${formattedDate}`,
                    venue: venue || null,
                    notes: notes || null,
                    status: 'open',
                    created_by: createdBy,
                }])
                .select()
                .single();

            if (err) throw err;
            onSuccess(data.id);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-surface border border-surface-border rounded-3xl w-full max-w-md p-8 shadow-2xl relative"
            >
                <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-foreground transition-colors">
                    <X className="w-5 h-5" />
                </button>

                <div className="mb-8">
                    <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 w-fit mb-4">
                        <CalendarPlus className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-2xl font-black text-foreground uppercase tracking-tight">Schedule Meeting</h3>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">{group.name}</p>
                    <p className="text-slate-400 text-xs mt-2">
                        Set the date and time agreed by your group — this meeting is independent of any program session.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                            <Calendar className="w-3 h-3 inline mr-1.5" /> Meeting Date
                        </label>
                        <input
                            type="date"
                            required
                            value={date}
                            min={today}
                            onChange={e => setDate(e.target.value)}
                            className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 text-foreground text-sm outline-none focus:border-primary/40 transition-all font-bold"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                            <Clock className="w-3 h-3 inline mr-1.5" /> Meeting Time
                        </label>
                        <input
                            type="time"
                            required
                            value={time}
                            onChange={e => setTime(e.target.value)}
                            className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 text-foreground text-sm outline-none focus:border-primary/40 transition-all font-bold"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                            <MapPin className="w-3 h-3 inline mr-1.5" /> Venue (optional)
                        </label>
                        <input
                            type="text"
                            value={venue}
                            onChange={e => setVenue(e.target.value)}
                            placeholder="e.g. 12 Oak Street or Host's home"
                            className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 text-foreground text-sm outline-none focus:border-primary/40 transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                            Notes (optional)
                        </label>
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="Study topic, reminder, etc."
                            rows={3}
                            className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 text-foreground text-sm outline-none focus:border-primary/40 transition-all resize-none"
                        />
                    </div>

                    {error && (
                        <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest">{error}</p>
                    )}

                    <Button
                        type="submit"
                        variant="premium"
                        className="w-full h-12 font-black uppercase tracking-widest text-[11px]"
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Open Register'}
                    </Button>
                </form>
            </motion.div>
        </div>
    );
}
