import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, Calendar, Clock, MapPin, MoreVertical, QrCode, Users, CheckCircle, ArrowLeft, Sparkles, Zap, Loader2, Pencil, Trash2, Ban, ShieldCheck, X } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { sessionService } from '@/services/sessionService';
import { programService } from '@/services/programService';
import { useAuth } from '@/hooks/useAuth';
import { Session, Program } from '@/types';
import { Banknote, AlertCircle, AlertTriangle } from 'lucide-react';

export function SessionList({ embedded = false }: { embedded?: boolean }) {
    const { programId } = useParams();
    const navigate = useNavigate();
    const { profile, user } = useAuth();
    const [sessions, setSessions] = useState<Session[]>([]);
    const [program, setProgram] = useState<Program | null>(null);
    const [paymentStatuses, setPaymentStatuses] = useState<Record<string, any>>({});
    const [attendanceData, setAttendanceData] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
    const [deletingSession, setDeletingSession] = useState<Session | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [enrollingId, setEnrollingId] = useState<string | null>(null);

    const isParticipant = profile?.role === 'participant';

    useEffect(() => {
        if (programId) {
            fetchData();
        }
    }, [programId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [sessData, progData] = await Promise.all([
                sessionService.getSessions(programId!),
                programService.getProgramById(programId!)
            ]);
            setSessions(sessData);
            setProgram(progData);

            if (isParticipant && user) {
                // Fetch user's specific sess-enrollments and attendance
                const statusMap: Record<string, any> = {};
                const attMap: Record<string, any> = {};

                await Promise.all(sessData.map(async (s) => {
                    try {
                        const status = await sessionService.getSessionPaymentStatus(s.id, user.id);
                        if (status) statusMap[s.id] = status;

                        // Check attendance for this session
                        const { data: att } = await (await import('@/services/supabase')).supabase
                            .from('attendance_records')
                            .select('*')
                            .eq('session_id', s.id)
                            .eq('user_id', user.id)
                            .maybeSingle(); // Used maybeSingle to avoid errors
                        if (att) attMap[s.id] = att;
                    } catch (e) {
                        console.error('Error fetching session details:', e);
                    }
                }));
                setPaymentStatuses(statusMap);
                setAttendanceData(attMap);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleActive = async (session: Session) => {
        try {
            await sessionService.updateSession(session.id, { is_active: !session.is_active });
            await fetchData();
            setActiveMenuId(null);
        } catch (err) {
            console.error('Failed to toggle session status:', err);
        }
    };

    const confirmDelete = async () => {
        if (!deletingSession) return;
        try {
            setIsDeleting(true);
            setDeleteError(null);
            await sessionService.deleteSession(deletingSession.id);
            setDeletingSession(null);
            await fetchData();
        } catch (err: any) {
            console.error('Failed to delete session:', err);
            if (err.message === 'HAS_ATTENDEES') {
                setDeleteError('This session has attendance records and cannot be deleted. Try deactivating it instead.');
            } else {
                setDeleteError('An unexpected error occurred while deleting the session.');
            }
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSessionEnroll = async (session: Session) => {
        if (!user || !profile) return;
        try {
            setEnrollingId(session.id);
            const fee = session.session_fee || program?.session_fee || 0;
            const isPaid = fee > 0;

            // Record PENDING enrollment/payment for manual cash flow
            await sessionService.recordSessionPayment(
                session.id,
                user.id,
                session.organization_id,
                fee,
                'cash', // Expecting cash
                user.id, // Processed by self (requested)
                isPaid ? 'pending' : 'paid' // Default to pending if there's a fee
            );

            await fetchData();
            if (isPaid) {
                alert(`Enrollment requested for ${session.name}. Please present $${fee.toFixed(2)} cash at the Check-in Station to finalize.`);
            }
        } catch (err: any) {
            alert('Failed to enroll in session: ' + err.message);
        } finally {
            setEnrollingId(null);
        }
    };

    if (loading && sessions.length === 0) {
        return (
            <div className={`flex items-center justify-center ${embedded ? 'h-32' : 'h-[60vh]'}`}>
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className={`space-y-12 ${embedded ? '' : 'pb-32'}`}>
            {!embedded && (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="flex items-center space-x-6">
                        <button
                            onClick={() => navigate('/dashboard/programs')}
                            className="w-14 h-14 bg-background hover:bg-surface border border-surface-border rounded-2xl flex items-center justify-center transition-all group"
                        >
                            <ArrowLeft className="w-6 h-6 text-slate-400 group-hover:text-foreground transition-colors" />
                        </button>
                        <div>
                            <div className="flex items-center space-x-2 mb-1">
                                <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">{program?.name || 'Program'}</span>
                                <span className="text-slate-300 font-black">•</span>
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Program Schedule</span>
                            </div>
                            <h1 className="text-4xl font-black text-foreground tracking-tight uppercase">Curriculum Schedule</h1>
                        </div>
                    </div>
                    <Button
                        variant="premium"
                        className="h-14 px-8 font-black uppercase tracking-widest text-xs"
                        onClick={() => navigate(`/dashboard/programs/${programId}/sessions/new`)}
                    >
                        <Plus className="w-4 h-4 mr-3" /> Add New Session
                    </Button>
                </div>
            )}

            {embedded && (
                <div className="flex justify-between items-center bg-surface p-6 rounded-3xl border border-surface-border">
                    <div>
                        <h4 className="text-sm font-black text-foreground uppercase tracking-tight">Curriculum Schedule</h4>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Manage individual sessions and attendance</p>
                    </div>
                    <Button
                        variant="premium"
                        size="sm"
                        className="h-10 text-[10px] font-black uppercase tracking-widest"
                        onClick={() => navigate(`/dashboard/programs/${programId}/sessions/new`)}
                    >
                        <Plus className="w-3 h-3 mr-2" /> New Session
                    </Button>
                </div>
            )}

            {
                error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-bold uppercase tracking-widest">
                        Error loading sessions: {error}
                    </div>
                )
            }

            <div className="grid gap-8">
                {sessions.map((session, i) => (
                    <motion.div
                        key={session.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                    >
                        <Card className="p-0 overflow-hidden bg-surface border-surface-border hover:border-primary/30 transition-all group">
                            <div className="flex flex-col md:flex-row">
                                {/* Date Accent Card */}
                                <div className="bg-background md:w-40 flex flex-col items-center justify-center p-8 border-b md:border-b-0 md:border-r border-surface-border relative overflow-hidden group-hover:bg-primary/5 transition-colors">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-premium opacity-50"></div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2 group-hover:text-primary">
                                        {new Date(session.session_date).toLocaleDateString('en-US', { month: 'short' })}
                                    </p>
                                    <p className="text-5xl font-black text-foreground leading-none tracking-tighter">
                                        {new Date(session.session_date).getDate()}
                                    </p>
                                    <div className="mt-4 w-8 h-1 bg-surface rounded-full overflow-hidden">
                                        <div className="h-full w-full bg-primary/20 group-hover:bg-primary/50 transition-colors"></div>
                                    </div>
                                </div>

                                {/* Session Details */}
                                <div className="flex-1 p-8 flex flex-col justify-center">
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-4">
                                                <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border shadow-2xl ${session.is_active
                                                    ? 'bg-primary/10 text-primary border-primary/20'
                                                    : 'bg-slate-500/10 text-slate-500 border-slate-500/20'
                                                    }`}>
                                                    {session.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                                <div className="flex items-center text-[10px] font-black text-slate-500 uppercase tracking-widest bg-background px-3 py-1.5 rounded-lg border border-surface-border">
                                                    <Clock className="w-3.5 h-3.5 mr-2 text-primary" /> {session.start_time.slice(0, 5)} - {session.end_time.slice(0, 5)}
                                                </div>
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-black text-foreground uppercase tracking-tight group-hover:text-primary transition-colors">{session.name}</h3>
                                                <div className="flex items-center text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-3">
                                                    <MapPin className="w-3.5 h-3.5 mr-2 text-pink-500" /> {session.location || 'Location Pending'}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {isParticipant && (
                                                <div className={`px-4 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ${paymentStatuses[session.id]?.payment_status === 'paid'
                                                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                                    : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                                                    }`}>
                                                    <Banknote className="w-3.5 h-3.5" />
                                                    {paymentStatuses[session.id]?.payment_status === 'paid'
                                                        ? 'Paid'
                                                        : `Unpaid ($${session.session_fee || program?.session_fee || 0})`}
                                                </div>
                                            )}
                                            <div className="relative">
                                                <button
                                                    onClick={() => setActiveMenuId(activeMenuId === session.id ? null : session.id)}
                                                    className={`w-10 h-10 bg-background hover:bg-surface rounded-xl flex items-center justify-center transition-all border ${activeMenuId === session.id ? 'border-primary/30 bg-primary/5' : 'border-transparent hover:border-surface-border'}`}
                                                >
                                                    <MoreVertical className={`w-5 h-5 ${activeMenuId === session.id ? 'text-primary' : 'text-slate-500'} group-hover:text-foreground`} />
                                                </button>

                                                <AnimatePresence>
                                                    {activeMenuId === session.id && (
                                                        <>
                                                            <div className="fixed inset-0 z-10" onClick={() => setActiveMenuId(null)} />
                                                            <motion.div
                                                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                                                className="absolute right-0 mt-2 w-56 bg-background border border-surface-border rounded-2xl shadow-2xl z-20 py-2 overflow-hidden"
                                                            >
                                                                <button
                                                                    onClick={() => navigate(`/dashboard/programs/${programId}/sessions/edit/${session.id}`)}
                                                                    className="w-full px-4 py-3 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 hover:text-primary transition-colors border-b border-slate-50"
                                                                >
                                                                    <Pencil className="w-3.5 h-3.5" /> Edit Details
                                                                </button>
                                                                <button
                                                                    onClick={() => handleToggleActive(session)}
                                                                    className={`w-full px-4 py-3 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest transition-colors border-b border-slate-50 ${session.is_active ? 'text-amber-500 hover:bg-amber-50' : 'text-emerald-500 hover:bg-emerald-50'}`}
                                                                >
                                                                    {session.is_active ? (
                                                                        <>
                                                                            <Ban className="w-3.5 h-3.5" /> Deactivate
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <ShieldCheck className="w-3.5 h-3.5" /> Activate
                                                                        </>
                                                                    )}
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setDeletingSession(session);
                                                                        setActiveMenuId(null);
                                                                    }}
                                                                    className="w-full px-4 py-3 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 transition-colors"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" /> Delete Terminally
                                                                </button>
                                                            </motion.div>
                                                        </>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between mt-4 pt-8 border-t border-surface-border">
                                        <div className="flex items-center gap-8">
                                            <div className="flex items-center gap-4 group/stat">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-lg shadow-emerald-500/20 ${attendanceData[session.id]
                                                    ? 'bg-emerald-500 text-[#FFFFFF]'
                                                    : 'bg-background text-slate-400'
                                                    }`}>
                                                    <CheckCircle className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-foreground leading-none">
                                                        {attendanceData[session.id] ? 'Present' : 'Absent'}
                                                    </p>
                                                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Verification Status</p>
                                                </div>
                                            </div>

                                            {isParticipant && paymentStatuses[session.id]?.payment_status !== 'paid' && (
                                                <div className="flex items-center gap-3 text-rose-500 animate-pulse">
                                                    <AlertCircle className="w-4 h-4" />
                                                    <p className="text-[9px] font-black uppercase tracking-widest">Enrollment Lock: Pay to Access</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex gap-4">
                                            {!isParticipant && (
                                                <div className="flex gap-3">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-12 px-6 text-[10px] font-black uppercase tracking-widest border-surface-border text-slate-500 hover:text-foreground"
                                                        onClick={() => navigate(`/dashboard/qr?session=${session.id}&mode=manual`)}
                                                    >
                                                        <Users className="w-4 h-4 mr-2" /> Manage Attendance
                                                    </Button>
                                                    <Button
                                                        variant="premium"
                                                        size="sm"
                                                        className="h-12 px-6 text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-primary/10"
                                                        onClick={() => navigate(`/dashboard/qr?session=${session.id}`)}
                                                    >
                                                        <QrCode className="w-4 h-4 mr-2" /> Start Check-In
                                                    </Button>
                                                </div>
                                            )}
                                            {isParticipant && (
                                                <Button
                                                    variant={paymentStatuses[session.id]?.payment_status === 'paid' ? "outline" : "premium"}
                                                    className="h-12 px-6 border-surface-border text-[10px] font-black uppercase tracking-widest"
                                                    disabled={enrollingId === session.id}
                                                    onClick={() => {
                                                        if (paymentStatuses[session.id]?.payment_status === 'paid') {
                                                            navigate(`/portal/${profile?.orgSlug}/dashboard/qr?session=${session.id}`);
                                                        } else {
                                                            handleSessionEnroll(session);
                                                        }
                                                    }}
                                                >
                                                    {enrollingId === session.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : paymentStatuses[session.id]?.payment_status === 'paid' ? (
                                                        <>
                                                            <CheckCircle className="w-3.5 h-3.5 mr-2" /> Self Check-in
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Sparkles className="w-3.5 h-3.5 mr-2" /> Enroll & Pay
                                                        </>
                                                    )}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                ))}

                {sessions.length === 0 && !loading && (
                    <div className="h-64 rounded-3xl border-2 border-dashed border-surface-border flex flex-col items-center justify-center p-10 text-center">
                        <Calendar className="w-12 h-12 text-slate-300 mb-4" />
                        <h3 className="text-xl font-black text-slate-400 uppercase tracking-tight">No Sessions Slotted</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2">Begin scheduling curriculum sessions for this program.</p>
                    </div>
                )}
            </div>

            {/* Global Delete Confirmation */}
            <AnimatePresence>
                {deletingSession && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-background w-full max-w-md rounded-3xl border border-red-100 shadow-2xl overflow-hidden"
                        >
                            <div className="p-8 text-center">
                                <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center text-red-500 mx-auto mb-6">
                                    <AlertTriangle className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-black text-foreground uppercase tracking-tight mb-2">Delete Session?</h3>
                                {deleteError ? (
                                    <p className="text-red-500 text-xs font-bold uppercase tracking-widest bg-red-50 p-4 rounded-xl border border-red-100 mb-4">
                                        {deleteError}
                                    </p>
                                ) : (
                                    <p className="text-slate-500 text-sm font-bold">
                                        You are about to permanently remove <span className="text-foreground">{deletingSession.name}</span>. This will purge all attendance records and payment links.
                                    </p>
                                )}
                            </div>

                            <div className="p-6 bg-red-50/50 border-t border-red-100 flex gap-3">
                                <Button variant="outline" className="flex-1 font-black uppercase tracking-widest border-red-100 text-red-600 hover:bg-red-50" onClick={() => {
                                    setDeletingSession(null);
                                    setDeleteError(null);
                                }}>
                                    {deleteError ? 'Close' : 'Abort'}
                                </Button>
                                {!deleteError && (
                                    <Button variant="ghost" className="flex-1 font-black uppercase tracking-widest bg-red-500 text-white hover:bg-red-600" onClick={confirmDelete} disabled={isDeleting}>
                                        {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Purge'}
                                    </Button>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div >
    );
}
