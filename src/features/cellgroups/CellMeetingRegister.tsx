import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { GlassBox, Card } from '@/components/ui/Card';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Loader2, CheckCircle2, XCircle, Camera, Users,
    QrCode, ClipboardList, Lock, AlertCircle
} from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface Member {
    id: string;
    first_name: string;
    surname: string;
    profile_photo_url?: string;
    attendance_status: 'present' | 'absent' | 'excused' | null;
}

interface MeetingInfo {
    id: string;
    title: string;
    scheduled_date: string;
    status: 'open' | 'closed';
    group: { name: string };
}

export function CellMeetingRegister() {
    const { meetingId, orgSlug } = useParams();
    const cellGroupsPath = orgSlug ? `/portal/${orgSlug}/dashboard/cell-groups` : '/dashboard/cell-groups';
    const { profile } = useAuth();
    const navigate = useNavigate();

    const [meeting, setMeeting] = useState<MeetingInfo | null>(null);
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [closingMeeting, setClosingMeeting] = useState(false);
    const [tab, setTab] = useState<'manual' | 'qr'>('manual');
    const [marking, setMarking] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // QR state
    const [scanResult, setScanResult] = useState<{ success: boolean; name: string } | null>(null);
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    useEffect(() => {
        if (meetingId) {
            fetchMeetingData();
        }
    }, [meetingId]);

    // Init / teardown QR scanner
    useEffect(() => {
        if (tab !== 'qr' || meeting?.status === 'closed') return;

        const initScanner = () => {
            const el = document.getElementById('cell-reader');
            if (!el) { requestAnimationFrame(initScanner); return; }

            scannerRef.current = new Html5QrcodeScanner(
                'cell-reader',
                { fps: 10, qrbox: { width: 250, height: 250 } },
                false
            );
            scannerRef.current.render(
                async (decoded) => {
                    scannerRef.current?.clear();
                    await handleQRScan(decoded);
                },
                () => { }
            );
        };

        const t = setTimeout(initScanner, 150);
        return () => {
            clearTimeout(t);
            scannerRef.current?.clear().catch(() => { });
            scannerRef.current = null;
        };
    }, [tab, meeting]);

    const fetchMeetingData = async () => {
        setLoading(true);
        try {
            // Get meeting + group name
            const { data: m, error: me } = await supabase
                .from('cell_meetings')
                .select('id, title, scheduled_date, status, group:program_groups(name)')
                .eq('id', meetingId)
                .single();

            if (me || !m) throw new Error('Meeting not found.');
            setMeeting(m as any);

            // Get group_members
            const { data: gm } = await supabase
                .from('group_members')
                .select('user_id, users(id, first_name, surname, profile_photo_url)')
                .eq('group_id', (m as any).group_id || '');

            // Get existing cell_attendance for this meeting
            const { data: att } = await supabase
                .from('cell_attendance')
                .select('user_id, status')
                .eq('meeting_id', meetingId);

            const attMap: Record<string, 'present' | 'absent' | 'excused'> = {};
            (att || []).forEach((a: any) => { attMap[a.user_id] = a.status; });

            // Build members list by re-fetching with correct group_id
            const { data: m2 } = await supabase
                .from('cell_meetings')
                .select('group_id')
                .eq('id', meetingId)
                .single();

            const { data: gm2 } = await supabase
                .from('group_members')
                .select('user_id, users(id, first_name, surname, profile_photo_url)')
                .eq('group_id', (m2 as any)?.group_id || '');

            const formatted: Member[] = (gm2 || []).map((row: any) => {
                const u = Array.isArray(row.users) ? row.users[0] : row.users;
                return {
                    id: u.id,
                    first_name: u.first_name,
                    surname: u.surname,
                    profile_photo_url: u.profile_photo_url,
                    attendance_status: attMap[u.id] || null,
                };
            });

            setMembers(formatted);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const markAttendance = async (
        userId: string,
        status: 'present' | 'absent' | 'excused',
        method: 'manual' | 'qr' = 'manual'
    ) => {
        if (meeting?.status === 'closed') return;
        setMarking(userId);
        try {
            await supabase
                .from('cell_attendance')
                .upsert({
                    meeting_id: meetingId,
                    user_id: userId,
                    status,
                    checkin_method: method,
                    marked_by: profile?.id,
                    marked_at: new Date().toISOString(),
                }, { onConflict: 'meeting_id,user_id' });

            setMembers(prev =>
                prev.map(m => m.id === userId ? { ...m, attendance_status: status } : m)
            );
        } catch (err: any) {
            console.error(err);
        } finally {
            setMarking(null);
        }
    };

    const handleQRScan = async (decoded: string) => {
        // Participant QR format: "user-<id>"
        const userId = decoded.startsWith('user-') ? decoded.replace('user-', '') : decoded;
        const member = members.find(m => m.id === userId);

        if (!member) {
            setScanResult({ success: false, name: 'Unknown participant' });
        } else if (member.attendance_status === 'present') {
            setScanResult({ success: true, name: `${member.first_name} ${member.surname} (Already recorded)` });
        } else {
            await markAttendance(userId, 'present', 'qr');
            setScanResult({ success: true, name: `${member.first_name} ${member.surname}` });
        }

        setTimeout(() => setScanResult(null), 3000);
    };

    const handleCloseMeeting = async () => {
        setClosingMeeting(true);
        try {
            await supabase
                .from('cell_meetings')
                .update({ status: 'closed' })
                .eq('id', meetingId);

            setMeeting(prev => prev ? { ...prev, status: 'closed' } : prev);
        } catch (err: any) {
            console.error(err);
        } finally {
            setClosingMeeting(false);
        }
    };

    const presentCount = members.filter(m => m.attendance_status === 'present').length;
    const absentCount = members.filter(m => m.attendance_status === 'absent').length;
    const unmarkedCount = members.filter(m => m.attendance_status === null).length;
    const pct = members.length > 0 ? Math.round((presentCount / members.length) * 100) : 0;

    if (loading) return (
        <div className="flex justify-center items-center min-h-[50vh]">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
    );

    if (error) return (
        <div className="max-w-lg mx-auto text-center py-32">
            <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-4" />
            <p className="text-foreground font-black uppercase tracking-widest">{error}</p>
            <Button variant="outline" className="mt-6" onClick={() => navigate(cellGroupsPath)}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto space-y-10 pb-20">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        className="h-10 w-10 p-0 rounded-xl border border-surface-border bg-background shrink-0"
                        onClick={() => navigate(cellGroupsPath)}
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">
                                {meeting?.title || 'Meeting Register'}
                            </h1>
                            {meeting?.status === 'closed' && (
                                <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest bg-slate-500/10 text-slate-400 border border-slate-500/20 px-3 py-1 rounded-full">
                                    <Lock className="w-3 h-3" /> Closed
                                </span>
                            )}
                        </div>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">
                            {(meeting?.group as any)?.name} &nbsp;•&nbsp;{' '}
                            {meeting?.scheduled_date
                                ? new Date(meeting.scheduled_date).toLocaleDateString('en-ZA', {
                                    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                                })
                                : ''}
                        </p>
                    </div>
                </div>

                {meeting?.status === 'open' && (
                    <Button
                        variant="outline"
                        className="h-11 text-[10px] font-black uppercase tracking-widest border-rose-500/30 text-rose-400 bg-rose-500/5 hover:bg-rose-500/10"
                        onClick={handleCloseMeeting}
                        disabled={closingMeeting}
                    >
                        {closingMeeting ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                            <><Lock className="w-4 h-4 mr-2" /> Close Meeting</>
                        )}
                    </Button>
                )}
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-4 gap-4">
                {[
                    { label: 'Total', value: members.length, color: 'text-foreground' },
                    { label: 'Present', value: presentCount, color: 'text-emerald-400' },
                    { label: 'Absent', value: absentCount, color: 'text-rose-400' },
                    { label: 'Unmarked', value: unmarkedCount, color: 'text-amber-400' },
                ].map(stat => (
                    <GlassBox key={stat.label} className="p-5 border-surface-border text-center">
                        <p className={`text-3xl font-black tracking-tighter ${stat.color}`}>{stat.value}</p>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">{stat.label}</p>
                    </GlassBox>
                ))}
            </div>

            {/* Progress bar */}
            <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                    <span className="text-slate-400">Attendance Rate</span>
                    <span className={pct >= 75 ? 'text-emerald-400' : pct >= 50 ? 'text-amber-400' : 'text-rose-400'}>
                        {pct}%
                    </span>
                </div>
                <div className="h-2 bg-surface rounded-full overflow-hidden border border-surface-border">
                    <motion.div
                        className={`h-full rounded-full ${pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6 }}
                    />
                </div>
            </div>

            {/* Tabs */}
            <div>
                <div className="flex bg-surface p-1.5 rounded-2xl border border-surface-border w-fit mb-8">
                    <button
                        onClick={() => setTab('manual')}
                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'manual' ? 'bg-gradient-premium text-white shadow-xl' : 'text-slate-500 hover:text-foreground'}`}
                    >
                        <ClipboardList className="w-3.5 h-3.5 inline mr-2" />
                        Manual List
                    </button>
                    <button
                        onClick={() => setTab('qr')}
                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'qr' ? 'bg-gradient-premium text-white shadow-xl' : 'text-slate-500 hover:text-foreground'}`}
                    >
                        <QrCode className="w-3.5 h-3.5 inline mr-2" />
                        QR Scan
                    </button>
                </div>

                {/* Manual Tab */}
                {tab === 'manual' && (
                    <div className="space-y-3">
                        {members.length === 0 ? (
                            <div className="text-center py-24 border border-dashed border-surface-border rounded-3xl">
                                <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">No members in this group</p>
                            </div>
                        ) : (
                            members.map((member, i) => (
                                <motion.div
                                    key={member.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                    className="bg-surface border border-surface-border rounded-2xl p-4 flex items-center justify-between gap-4 group hover:border-primary/20 transition-all"
                                >
                                    {/* Avatar + Name */}
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="w-11 h-11 rounded-xl bg-background border border-surface-border flex items-center justify-center font-black text-xs text-primary shrink-0 overflow-hidden">
                                            {member.profile_photo_url ? (
                                                <img src={member.profile_photo_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                (member.first_name[0] + member.surname[0]).toUpperCase()
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-black text-foreground uppercase tracking-tight truncate">
                                                {member.first_name} {member.surname}
                                            </p>
                                            {member.attendance_status && (
                                                <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${member.attendance_status === 'present'
                                                    ? 'bg-emerald-500/10 text-emerald-400'
                                                    : member.attendance_status === 'excused'
                                                        ? 'bg-amber-500/10 text-amber-400'
                                                        : 'bg-rose-500/10 text-rose-400'
                                                    }`}>
                                                    {member.attendance_status}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Buttons */}
                                    <div className="flex gap-2 shrink-0">
                                        {meeting?.status === 'open' ? (
                                            <>
                                                <button
                                                    disabled={marking === member.id}
                                                    onClick={() => markAttendance(member.id, 'present')}
                                                    className={`h-9 px-3 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${member.attendance_status === 'present'
                                                        ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20'
                                                        : 'bg-emerald-500/5 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10'}`}
                                                >
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> Present
                                                </button>
                                                <button
                                                    disabled={marking === member.id}
                                                    onClick={() => markAttendance(member.id, 'absent')}
                                                    className={`h-9 px-3 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${member.attendance_status === 'absent'
                                                        ? 'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/20'
                                                        : 'bg-rose-500/5 text-rose-500 border-rose-500/20 hover:bg-rose-500/10'}`}
                                                >
                                                    <XCircle className="w-3.5 h-3.5" /> Absent
                                                </button>
                                                <button
                                                    disabled={marking === member.id}
                                                    onClick={() => markAttendance(member.id, 'excused')}
                                                    className={`h-9 px-3 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${member.attendance_status === 'excused'
                                                        ? 'bg-amber-500 text-white border-amber-500'
                                                        : 'bg-amber-500/5 text-amber-500 border-amber-500/20 hover:bg-amber-500/10'}`}
                                                >
                                                    Excused
                                                </button>
                                            </>
                                        ) : (
                                            <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-2 rounded-xl border ${member.attendance_status === 'present'
                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                : member.attendance_status === 'excused'
                                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                    : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                                                {member.attendance_status || 'Unmarked'}
                                            </span>
                                        )}
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                )}

                {/* QR Scanner Tab */}
                {tab === 'qr' && (
                    <div className="grid lg:grid-cols-2 gap-8">
                        <Card className="p-8 bg-surface border-surface-border flex flex-col items-center justify-center min-h-[420px] relative overflow-hidden">
                            {meeting?.status === 'closed' ? (
                                <div className="text-center">
                                    <Lock className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                        Meeting is closed — QR scanning disabled
                                    </p>
                                </div>
                            ) : (
                                <AnimatePresence mode="wait">
                                    {scanResult ? (
                                        <motion.div
                                            key="result"
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="text-center space-y-6"
                                        >
                                            <div className={`w-28 h-28 rounded-full flex items-center justify-center mx-auto border shadow-2xl ${scanResult.success
                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/20'
                                                : 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-rose-500/20'}`}>
                                                {scanResult.success
                                                    ? <CheckCircle2 className="w-14 h-14" />
                                                    : <XCircle className="w-14 h-14" />}
                                            </div>
                                            <div>
                                                <p className="text-2xl font-black text-foreground uppercase tracking-tight">
                                                    {scanResult.success ? 'Marked Present' : 'Not Found'}
                                                </p>
                                                <p className={`text-[10px] font-black uppercase tracking-widest mt-2 ${scanResult.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                    {scanResult.name}
                                                </p>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.div key="scanner" className="w-full space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                            <div id="cell-reader" className="w-full rounded-2xl overflow-hidden border border-surface-border aspect-square flex items-center justify-center relative bg-background/50">
                                                <div className="text-center">
                                                    <Camera className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                                                        Awaiting Scan
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="text-center text-[9px] text-indigo-400 font-black uppercase tracking-widest leading-relaxed">
                                                Ask the participant to show their personal QR code from the participant portal.
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            )}
                        </Card>

                        {/* Recently scanned */}
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black text-foreground uppercase tracking-widest">
                                QR Verified This Meeting
                            </h3>
                            {members.filter(m => m.attendance_status === 'present').length === 0 ? (
                                <div className="py-12 border border-dashed border-surface-border rounded-2xl text-center">
                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                                        No scans yet
                                    </p>
                                </div>
                            ) : (
                                members.filter(m => m.attendance_status === 'present').map((m, i) => (
                                    <motion.div
                                        key={m.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="flex items-center gap-4 bg-surface border border-emerald-500/20 rounded-xl p-4"
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center font-black text-xs text-emerald-400 overflow-hidden">
                                            {m.profile_photo_url ? (
                                                <img src={m.profile_photo_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                (m.first_name[0] + m.surname[0]).toUpperCase()
                                            )}
                                        </div>
                                        <p className="text-sm font-black text-foreground uppercase tracking-tight">
                                            {m.first_name} {m.surname}
                                        </p>
                                        <CheckCircle2 className="w-4 h-4 text-emerald-400 ml-auto" />
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
