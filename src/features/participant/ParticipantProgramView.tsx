import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/services/supabase';
import { useOrganization } from '@/hooks/useOrganization';
import { GlassBox } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
    Calendar,
    FileText,
    ArrowLeft,
    CheckCircle2,
    Clock,
    Award,
    Loader2,
    MapPin,
    Users,
    BookOpen,
    Info,
    CheckCircle,
    XCircle,
    QrCode,
    ChevronRight,
    Sparkles,
    UserCheck,
    ClipboardList,
    X,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { CelebrationModal } from '@/components/shared/CelebrationModal';
import { programService } from '@/services/programService';

type Tab = 'overview' | 'sessions';

export function ParticipantProgramView() {
    const { programId, orgSlug } = useParams();
    const navigate = useNavigate();
    const { currentProfile, organization } = useOrganization();

    const [program, setProgram] = useState<any>(null);
    const [enrollment, setEnrollment] = useState<any>(null);
    const [sessions, setSessions] = useState<any[]>([]);
    const [attendanceMap, setAttendanceMap] = useState<Record<string, any>>({});
    const [sessionEnrollMap, setSessionEnrollMap] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);
    const [enrolling, setEnrolling] = useState(false);
    const [checkingInId, setCheckingInId] = useState<string | null>(null);
    const [registerSessionId, setRegisterSessionId] = useState<string | null>(null);
    const [registerData, setRegisterData] = useState<any[]>([]);
    const [registerLoading, setRegisterLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [showCelebration, setShowCelebration] = useState(false);

    useEffect(() => {
        if (programId && currentProfile) fetchAll();
    }, [programId, currentProfile]);

    const fetchAll = async () => {
        setLoading(true);
        try {
            // 1. Program info
            const { data: prog } = await supabase
                .from('programs')
                .select('*')
                .eq('id', programId)
                .single();
            setProgram(prog);

            // 2. Program enrollment
            const { data: enroll } = await supabase
                .from('enrollments')
                .select('*')
                .eq('program_id', programId)
                .eq('user_id', currentProfile!.id)
                .maybeSingle();
            setEnrollment(enroll);

            // 3. Sessions
            const { data: sess } = await supabase
                .from('sessions')
                .select('*')
                .eq('program_id', programId)
                .eq('is_active', true)
                .order('session_date', { ascending: true });
            setSessions(sess || []);

            if (sess && sess.length > 0 && currentProfile) {
                const sessionIds = sess.map((s: any) => s.id);

                // 4. Attendance per session
                const { data: attendances } = await supabase
                    .from('attendance_records')
                    .select('session_id, status, checked_in_at, confirmed_by_leader, is_verified')
                    .eq('user_id', currentProfile.id)
                    .in('session_id', sessionIds);

                const attMap: Record<string, any> = {};
                (attendances || []).forEach((a: any) => { attMap[a.session_id] = a; });
                setAttendanceMap(attMap);

                // 5. Session enrollments (payment status per session)
                if (enroll) {
                    const { data: sessEnrolls } = await supabase
                        .from('session_enrollments')
                        .select('session_id, payment_status, amount_paid, amount_due')
                        .eq('enrollment_id', enroll.id)
                        .in('session_id', sessionIds);

                    const seMap: Record<string, any> = {};
                    (sessEnrolls || []).forEach((se: any) => { seMap[se.session_id] = se; });
                    setSessionEnrollMap(seMap);
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // ── TEST CHECK-IN: direct Supabase upsert for testing (bypasses QR scanner) ──
    const handleTestCheckIn = async (session: any) => {
        if (!currentProfile || !program) return;
        try {
            setCheckingInId(session.id);
            const now = new Date().toISOString();
            const { error } = await supabase
                .from('attendance_records')
                .upsert([{
                    session_id: session.id,
                    user_id: currentProfile.id,
                    organization_id: program.organization_id,
                    checked_in: true,
                    checked_in_at: now,
                    entry_time: now,
                    status: 'present',
                }], { onConflict: 'session_id,user_id' });
            if (error) throw error;
            await fetchAll();
        } catch (err: any) {
            alert('Check-in failed: ' + err.message);
        } finally {
            setCheckingInId(null);
        }
    };

    // ── VIEW REGISTER: fetch all check-ins for a session ──
    const openRegister = async (sessionId: string) => {
        setRegisterSessionId(sessionId);
        setRegisterLoading(true);
        try {
            const { data } = await supabase
                .from('attendance_records')
                .select('id, status, checked_in_at, exit_time, user:user_id(first_name, surname, profile_photo_url)')
                .eq('session_id', sessionId)
                .order('checked_in_at', { ascending: true });
            setRegisterData(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setRegisterLoading(false);
        }
    };

    const handleEnroll = async () => {
        if (!program || !currentProfile) return;
        try {
            setEnrolling(true);
            await programService.enrollInProgram(
                program.id,
                currentProfile.id,
                program.organization_id,
                'paid'
            );
            setShowCelebration(true);
            await fetchAll();
            setActiveTab('sessions');
        } catch (err: any) {
            alert('Failed to join program: ' + err.message);
        } finally {
            setEnrolling(false);
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-[60vh]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
    );

    if (!program) return <div className="text-foreground p-10">Program not found.</div>;

    const completedSessions = sessions.filter(s => {
        const att = attendanceMap[s.id];
        return att?.status === 'present' || att?.confirmed_by_leader || att?.is_verified;
    }).length;
    const totalSessions = sessions.length;
    const progressPct = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

    const tabs: { id: Tab; label: string; icon: any; locked?: boolean }[] = [
        { id: 'overview', label: 'Overview', icon: Info },
        { id: 'sessions', label: 'Sessions', icon: Calendar, locked: !enrollment },
    ];

    return (
        <div className="pb-28">
            {/* ── HERO ── */}
            <div className="relative h-52 overflow-hidden bg-foreground">
                {program.image_url ? (
                    <img src={program.image_url} alt={program.name} className="absolute inset-0 w-full h-full object-cover opacity-40" />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-foreground to-foreground" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-foreground via-foreground/50 to-transparent" />

                {/* Back */}
                <button
                    onClick={() => navigate(`/portal/${orgSlug}/dashboard`)}
                    className="absolute top-5 left-5 z-10 flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-sm rounded-xl px-3 py-2 text-white transition-all"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Back</span>
                </button>

                {/* Enrolled badge */}
                {enrollment && (
                    <div className="absolute top-5 right-5 z-10 bg-emerald-500/20 border border-emerald-500/40 backdrop-blur-sm rounded-xl px-3 py-2">
                        <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Enrolled
                        </span>
                    </div>
                )}

                {/* Title */}
                <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
                    <p className="text-[9px] font-black text-primary uppercase tracking-[0.3em] mb-1">
                        {program.category || 'Training Program'}
                    </p>
                    <h1 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">{program.name}</h1>
                </div>
            </div>

            {/* ── JOIN BUTTON ── */}
            {!enrollment && (
                <div className="px-5 py-4 bg-foreground border-b border-white/10">
                    <Button
                        variant="premium"
                        className="w-full h-13 rounded-2xl font-black uppercase tracking-widest text-sm shadow-2xl shadow-primary/30"
                        onClick={handleEnroll}
                        disabled={enrolling}
                    >
                        {enrolling ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Sparkles className="w-5 h-5 mr-2" />}
                        Join the Program
                    </Button>
                </div>
            )}

            {/* ── PROGRESS BAR (enrolled only) ── */}
            {enrollment && totalSessions > 0 && (
                <div className="px-5 py-4 bg-surface border-b border-surface-border">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Your Progress</span>
                        <span className="text-[9px] font-black text-primary uppercase tracking-widest">
                            {completedSessions}/{totalSessions} Sessions
                        </span>
                    </div>
                    <div className="h-2 bg-background rounded-full overflow-hidden border border-surface-border">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPct}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className="h-full bg-primary rounded-full"
                        />
                    </div>
                </div>
            )}

            {/* ── TABS ── */}
            <div className="px-5 pt-4">
                <div className="flex gap-1 p-1 bg-surface border border-surface-border rounded-2xl shadow-lg">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => !tab.locked && setActiveTab(tab.id)}
                                disabled={tab.locked}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isActive
                                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                    : tab.locked
                                        ? 'text-slate-300 cursor-not-allowed opacity-50'
                                        : 'text-slate-500 hover:text-foreground'
                                    }`}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── TAB CONTENT ── */}
            <div className="p-5 space-y-4">

                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        {/* About */}
                        <GlassBox className="p-5 border-surface-border bg-surface shadow-xl space-y-4">
                            <div className="flex items-center gap-2 pb-3 border-b border-surface-border">
                                <BookOpen className="w-4 h-4 text-primary" />
                                <h3 className="text-xs font-black text-foreground uppercase tracking-widest">About This Program</h3>
                            </div>
                            <p className="text-sm text-slate-500 leading-relaxed font-medium">
                                {program.description || 'No description provided for this program.'}
                            </p>
                        </GlassBox>

                        {/* Key Details Grid */}
                        <div className="grid grid-cols-2 gap-3">
                            <GlassBox className="p-4 border-surface-border bg-surface shadow-lg space-y-2">
                                <div className="flex items-center gap-2 text-primary">
                                    <Calendar className="w-4 h-4" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Start Date</span>
                                </div>
                                <p className="text-sm font-black text-foreground">
                                    {new Date(program.start_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </p>
                            </GlassBox>

                            <GlassBox className="p-4 border-surface-border bg-surface shadow-lg space-y-2">
                                <div className="flex items-center gap-2 text-pink-500">
                                    <Calendar className="w-4 h-4" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">End Date</span>
                                </div>
                                <p className="text-sm font-black text-foreground">
                                    {program.end_date
                                        ? new Date(program.end_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
                                        : 'Ongoing'}
                                </p>
                            </GlassBox>

                            <GlassBox className="p-4 border-surface-border bg-surface shadow-lg space-y-2">
                                <div className="flex items-center gap-2 text-amber-500">
                                    <Users className="w-4 h-4" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Capacity</span>
                                </div>
                                <p className="text-sm font-black text-foreground">
                                    {program.max_participants ? `${program.max_participants} seats` : 'Unlimited'}
                                </p>
                            </GlassBox>

                            <GlassBox className="p-4 border-surface-border bg-surface shadow-lg space-y-2">
                                <div className="flex items-center gap-2 text-emerald-500">
                                    <FileText className="w-4 h-4" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Sessions</span>
                                </div>
                                <p className="text-sm font-black text-foreground">
                                    {totalSessions} {totalSessions === 1 ? 'session' : 'sessions'}
                                </p>
                            </GlassBox>
                        </div>

                        {/* Requirements */}
                        <GlassBox className="p-5 border-surface-border bg-surface shadow-xl space-y-4">
                            <div className="flex items-center gap-2 pb-3 border-b border-surface-border">
                                <Award className="w-4 h-4 text-amber-500" />
                                <h3 className="text-xs font-black text-foreground uppercase tracking-widest">Completion Requirements</h3>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Attendance Required</span>
                                    <span className="text-[10px] font-black text-foreground bg-primary/10 border border-primary/20 px-2 py-1 rounded-lg">
                                        {program.attendance_required_pct ?? 80}%
                                    </span>
                                </div>
                            </div>
                        </GlassBox>

                        {/* CTA if not enrolled */}
                        {!enrollment && (
                            <GlassBox className="p-6 bg-primary/5 border-primary/20 shadow-lg border-dashed space-y-4">
                                <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Join to Access Sessions</h4>
                                <p className="text-sm text-foreground font-medium">
                                    Enroll to unlock detailed curriculum sessions and track your progress.
                                </p>
                                <Button variant="premium" className="w-full h-12 font-black uppercase tracking-widest text-xs" onClick={handleEnroll} disabled={enrolling}>
                                    {enrolling ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                                    Join the Program
                                </Button>
                            </GlassBox>
                        )}
                    </motion.div>
                )}

                {/* SESSIONS TAB */}
                {activeTab === 'sessions' && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        {sessions.length === 0 ? (
                            <div className="text-center py-16 bg-surface rounded-3xl border border-dashed border-surface-border">
                                <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">No sessions scheduled yet</p>
                                <p className="text-slate-400 text-[10px] mt-2">Check back soon for upcoming sessions.</p>
                            </div>
                        ) : (
                            sessions.map((session, i) => {
                                const att = attendanceMap[session.id];
                                const isPresent = att?.status === 'present';
                                const isLate = att?.status === 'late';
                                const sessionDate = new Date(session.session_date);
                                const isPast = sessionDate < new Date();

                                return (
                                    <motion.div
                                        key={session.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.06 }}
                                    >
                                        <GlassBox className={`overflow-hidden border-surface-border bg-surface shadow-xl transition-all ${isPresent ? 'border-l-4 border-l-emerald-500' : isLate ? 'border-l-4 border-l-amber-500' : ''}`}>
                                            <div className="flex">
                                                {/* Date column */}
                                                <div className={`flex-shrink-0 w-20 flex flex-col items-center justify-center py-5 border-r border-surface-border ${isPast ? 'bg-background' : 'bg-primary/5'}`}>
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                                                        {sessionDate.toLocaleDateString('en-US', { month: 'short' })}
                                                    </p>
                                                    <p className={`text-3xl font-black leading-none mt-0.5 ${isPast ? 'text-slate-400' : 'text-primary'}`}>
                                                        {sessionDate.getDate()}
                                                    </p>
                                                    <p className="text-[8px] font-bold text-slate-400 mt-1">
                                                        {sessionDate.toLocaleDateString('en-US', { weekday: 'short' })}
                                                    </p>
                                                </div>

                                                {/* Detail column */}
                                                <div className="flex-1 p-4 space-y-2">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <h4 className="text-sm font-black text-foreground uppercase tracking-tight leading-tight flex-1">
                                                            {session.name}
                                                        </h4>
                                                        {/* Attendance badge */}
                                                        {att ? (
                                                            <span className={`flex-shrink-0 flex items-center gap-1 text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border ${isPresent
                                                                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                                                : isLate
                                                                    ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                                                    : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                                                                }`}>
                                                                {isPresent ? <CheckCircle className="w-2.5 h-2.5" /> : isLate ? <Clock className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />}
                                                                {att.status}
                                                            </span>
                                                        ) : (
                                                            isPast ? (
                                                                <span className="flex-shrink-0 text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border bg-slate-500/10 text-slate-500 border-slate-500/20">
                                                                    Absent
                                                                </span>
                                                            ) : (
                                                                <span className="flex-shrink-0 text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border bg-primary/10 text-primary border-primary/20">
                                                                    Upcoming
                                                                </span>
                                                            )
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-3 text-[10px] text-slate-500 font-bold">
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-3 h-3 text-primary" />
                                                            {session.start_time?.slice(0, 5)} – {session.end_time?.slice(0, 5)}
                                                        </span>
                                                        {session.location && (
                                                            <span className="flex items-center gap-1">
                                                                <MapPin className="w-3 h-3 text-pink-500" />
                                                                {session.location}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {session.description && (
                                                        <p className="text-[10px] text-slate-400 leading-relaxed line-clamp-2">{session.description}</p>
                                                    )}

                                                    {/* ── Action row (session payment gated) ── */}
                                                    {enrollment && (() => {
                                                        const sessEnroll = sessionEnrollMap[session.id];
                                                        const sessionPaid = sessEnroll?.payment_status === 'paid';

                                                        return (
                                                            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-surface-border flex-wrap">

                                                                {/* Already checked in */}
                                                                {att ? (
                                                                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest">
                                                                        <CheckCircle className="w-3 h-3" /> Checked In
                                                                        {att.checked_in_at && att.checked_in_at.startsWith('20') && (
                                                                            <span className="font-bold text-slate-400 ml-1">
                                                                                · {new Date(att.checked_in_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                                            </span>
                                                                        )}
                                                                    </span>
                                                                ) : sessionPaid ? (
                                                                    /* Session paid — enable check-in */
                                                                    <>
                                                                        {/* QR Check-In (real flow) */}
                                                                        <button
                                                                            onClick={() => navigate(`/portal/${orgSlug}/dashboard/qr`)}
                                                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-white text-[9px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all"
                                                                        >
                                                                            <QrCode className="w-3 h-3" /> Check In via QR
                                                                        </button>
                                                                        {/* Direct test check-in */}
                                                                        <button
                                                                            onClick={() => handleTestCheckIn(session)}
                                                                            disabled={checkingInId === session.id}
                                                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface border border-primary/30 text-primary text-[9px] font-black uppercase tracking-widest hover:bg-primary/5 active:scale-95 transition-all disabled:opacity-50"
                                                                        >
                                                                            {checkingInId === session.id
                                                                                ? <Loader2 className="w-3 h-3 animate-spin" />
                                                                                : <UserCheck className="w-3 h-3" />}
                                                                            [TEST]
                                                                        </button>
                                                                    </>
                                                                ) : (
                                                                    /* Session not yet paid — visible but disabled */
                                                                    <button
                                                                        disabled
                                                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface border border-surface-border text-slate-400 text-[9px] font-black uppercase tracking-widest cursor-not-allowed opacity-60"
                                                                    >
                                                                        <QrCode className="w-3 h-3" />
                                                                        Check In
                                                                        <span className="ml-1 text-[8px] text-amber-500">— Awaiting Payment</span>
                                                                    </button>
                                                                )}

                                                                {/* View Register — always visible */}
                                                                <button
                                                                    onClick={() => openRegister(session.id)}
                                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface border border-surface-border text-slate-500 text-[9px] font-black uppercase tracking-widest hover:border-primary/30 hover:text-primary transition-all"
                                                                >
                                                                    <ClipboardList className="w-3 h-3" /> View Register
                                                                </button>
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        </GlassBox>
                                    </motion.div>
                                );
                            })
                        )}
                    </motion.div>
                )}

            </div>

            {/* Celebration */}
            <CelebrationModal
                isOpen={showCelebration}
                onClose={() => setShowCelebration(false)}
                title="Welcome Aboard!"
                subtitle={`You've successfully joined ${program.name}`}
                points={100}
                badge="Enrolled"
            />

            {/* ── REGISTER SLIDE-UP MODAL ── */}
            {registerSessionId && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 backdrop-blur-sm" onClick={() => setRegisterSessionId(null)}>
                    <div
                        className="w-full max-w-lg bg-background rounded-t-3xl border border-surface-border shadow-2xl max-h-[80vh] flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Handle */}
                        <div className="flex justify-center pt-3 pb-1">
                            <div className="w-10 h-1 bg-surface-border rounded-full" />
                        </div>

                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
                            <div className="flex items-center gap-2">
                                <ClipboardList className="w-4 h-4 text-primary" />
                                <span className="text-xs font-black text-foreground uppercase tracking-widest">
                                    Attendance Register
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-[9px] font-black text-primary bg-primary/10 border border-primary/20 px-2 py-1 rounded-lg uppercase tracking-widest">
                                    {registerData.length} checked in
                                </span>
                                <button onClick={() => setRegisterSessionId(null)} className="text-slate-400 hover:text-foreground transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
                            {registerLoading ? (
                                <div className="flex justify-center py-10">
                                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                </div>
                            ) : registerData.length === 0 ? (
                                <div className="text-center py-12">
                                    <Users className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                                    <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">No check-ins yet</p>
                                    <p className="text-slate-400 text-[10px] mt-1">Be the first to check in!</p>
                                </div>
                            ) : (
                                registerData.map((rec: any, i: number) => {
                                    const name = rec.user?.first_name
                                        ? `${rec.user.first_name} ${rec.user.surname ?? ''}`.trim()
                                        : 'Participant';
                                    return (
                                        <div key={rec.id} className="flex items-center gap-3 p-3 bg-surface border border-surface-border rounded-2xl">
                                            {/* Avatar */}
                                            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                                {rec.user?.profile_photo_url
                                                    ? <img src={rec.user.profile_photo_url} alt="" className="w-full h-full object-cover" />
                                                    : <span className="text-[10px] font-black text-primary">{name[0]}</span>}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-black text-foreground truncate">{name}</p>
                                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                                                    {rec.checked_in_at && rec.checked_in_at.startsWith('20')
                                                        ? new Date(rec.checked_in_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                                                        : '—'}
                                                </p>
                                            </div>
                                            <span className={`flex-shrink-0 text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border ${rec.status === 'present'
                                                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                                : rec.status === 'late'
                                                    ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                                    : 'bg-slate-500/10 text-slate-500 border-slate-500/20'
                                                }`}>
                                                {rec.status}
                                            </span>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-surface-border">
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest text-center">
                                Attendance data updates in real time
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
