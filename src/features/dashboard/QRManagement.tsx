import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { QrCode as QrIcon, Maximize, RefreshCw, CheckCircle2, XCircle, Camera, Search, Loader2, Banknote } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { sessionService } from '@/services/sessionService';
import { useOrganization } from '@/hooks/useOrganization';
import { useAuth } from '@/hooks/useAuth';
import { ReceiptModal } from '@/components/shared/ReceiptModal';
import { Session } from '@/types';

export function QRManagement() {
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get('session');
    const mode = searchParams.get('mode');
    const { organization } = useOrganization();
    const { user, profile } = useAuth();

    const [view, setView] = useState<'generate' | 'scan'>(sessionId ? 'generate' : 'scan');
    const [scannedResult, setScannedResult] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState<boolean | null>(null);
    const [lastAction, setLastAction] = useState<'clock_in' | 'clock_out' | 'none' | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [attendance, setAttendance] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [paymentRequired, setPaymentRequired] = useState<{ userId: string } | null>(null);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [participants, setParticipants] = useState<any[]>([]);
    const [isManualModalOpen, setIsManualModalOpen] = useState(mode === 'manual');
    const [latestPayment, setLatestPayment] = useState<any>(null);
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

    useEffect(() => {
        if (sessionId) {
            fetchSessionData();
            fetchParticipants();
        }
    }, [sessionId]);

    const fetchParticipants = async () => {
        if (!sessionId) return;
        try {
            // 1. Get Program ID from session
            const { data: sess } = await (await import('@/services/supabase')).supabase
                .from('sessions')
                .select('program_id')
                .eq('id', sessionId)
                .single();

            if (!sess) return;

            // 2. Get all enrolled users for this program
            const { data: enrolls } = await (await import('@/services/supabase')).supabase
                .from('enrollments')
                .select(`
                    user_id,
                    users (id, first_name, surname, profile_photo_url)
                `)
                .eq('program_id', sess.program_id)
                .eq('status', 'active');

            setParticipants(enrolls || []);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchSessionData = async () => {
        try {
            setLoading(true);
            const { data: sess } = await (await import('@/services/supabase')).supabase
                .from('sessions')
                .select('*')
                .eq('id', sessionId)
                .single();
            setSession(sess);

            const att = await sessionService.getAttendanceForSession(sessionId!);
            setAttendance(att);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const isUserAttended = (userId: string) => attendance.some(a => a.user_id === userId);

    useEffect(() => {
        let scanner: Html5QrcodeScanner | null = null;

        if (view === 'scan') {
            const initScanner = () => {
                const element = document.getElementById("reader");
                if (!element) {
                    requestAnimationFrame(initScanner);
                    return;
                }

                scanner = new Html5QrcodeScanner(
                    "reader",
                    { fps: 10, qrbox: { width: 250, height: 250 } },
                    /* verbose= */ false
                );

                scanner.render(async (decodedText) => {
                    setScannedResult(decodedText);
                    await handleAttendanceCheck(decodedText);
                    scanner?.clear();
                }, (error) => {
                    // console.warn(error);
                });
            };

            const timer = setTimeout(initScanner, 100);

            return () => {
                clearTimeout(timer);
                if (scanner) {
                    scanner.clear().catch(console.error);
                }
            };
        }
    }, [view]);

    const handleAttendanceCheck = async (data: string) => {
        if (!organization?.id || !sessionId) {
            setIsSuccess(false);
            return;
        }

        try {
            setLoading(true);
            const cleanData = data.startsWith('user-') ? data.replace('user-', '') : data;

            const response = await sessionService.markAttendance(sessionId, cleanData, organization.id);
            setIsSuccess(true);
            setLastAction(response.action as any);
            fetchSessionData();
        } catch (err: any) {
            if (err.message === 'PAYMENT_REQUIRED') {
                setPaymentRequired({ userId: data.startsWith('user-') ? data.replace('user-', '') : data });
            }
            setIsSuccess(false);
            setLastAction(null);
        } finally {
            setLoading(false);
            setTimeout(() => {
                setScannedResult(null);
                setIsSuccess(null);
                setLastAction(null);
                if (view === 'scan') setView('scan');
            }, 3000);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-12 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div>
                    <h1 className="text-4xl font-black text-foreground tracking-tight uppercase">Attendance Terminal</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">Bi-directional verification & validation</p>
                </div>
                <div className="flex bg-surface p-1.5 rounded-2xl border border-surface-border">
                    <button
                        onClick={() => setView('generate')}
                        className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'generate' ? 'bg-gradient-premium text-white shadow-xl' : 'text-slate-500 hover:text-foreground'}`}
                    >
                        Display QR
                    </button>
                    <button
                        onClick={() => setView('scan')}
                        className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'scan' ? 'bg-gradient-premium text-white shadow-xl' : 'text-slate-500 hover:text-foreground'}`}
                    >
                        Scanner Mode
                    </button>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-12">
                {/* Action Area */}
                <Card className="flex flex-col items-center justify-center p-12 min-h-[550px] bg-surface border-surface-border relative overflow-hidden group">
                    <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                    {view === 'generate' ? (
                        <div className="text-center space-y-10 w-full relative z-10">
                            {session ? (
                                <>
                                    <div className="relative inline-block">
                                        <div className="absolute inset-0 bg-indigo-500/20 blur-[100px] rounded-full animate-pulse"></div>
                                        <div className="relative bg-white p-10 rounded-[40px] shadow-2xl border border-indigo-500/20">
                                            <QRCodeSVG
                                                value={session.qr_code_data}
                                                size={240}
                                                level="H"
                                                includeMargin={true}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-foreground uppercase tracking-tight mb-2">{session.name}</h3>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest max-w-xs mx-auto mb-10 leading-relaxed">
                                            Participants scan this encrypted token to confirm their presence in the session.
                                        </p>
                                        <div className="flex gap-4 justify-center">
                                            <Button variant="outline" className="h-12 bg-background border-surface-border text-[10px] font-black uppercase tracking-widest">
                                                <Maximize className="w-4 h-4 mr-3 text-primary" /> Fullscreen
                                            </Button>
                                            <Button variant="outline" className="h-12 bg-background border-surface-border text-[10px] font-black uppercase tracking-widest" onClick={fetchSessionData}>
                                                <RefreshCw className="w-4 h-4 mr-3 text-primary" /> Refresh Data
                                            </Button>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="text-slate-600 font-black uppercase tracking-widest text-[10px]">
                                    {sessionId ? 'Loading session parameters...' : 'Select a session from the curriculum list'}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center relative z-10">
                            {scannedResult ? (
                                <div className="flex flex-col items-center justify-center transition-all duration-500 py-10">
                                    {isSuccess ? (
                                        <div className="text-center space-y-8">
                                            <div className={`w-32 h-32 rounded-full flex items-center justify-center mx-auto border shadow-2xl transition-colors ${lastAction === 'clock_out'
                                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-blue-500/20'
                                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/20'
                                                }`}>
                                                <CheckCircle2 className="w-16 h-16" />
                                            </div>
                                            <div>
                                                <h3 className="text-3xl font-black text-foreground uppercase tracking-tight">
                                                    {lastAction === 'clock_out' ? 'Departure Recorded' : 'Access Granted'}
                                                </h3>
                                                <p className={`font-black uppercase tracking-widest text-[10px] mt-2 ${lastAction === 'clock_out' ? 'text-blue-400' : 'text-emerald-400'
                                                    }`}>
                                                    {lastAction === 'clock_out' ? 'Checkout Synchronized' : 'Check-in Synchronized'}
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center space-y-8 animate-shake">
                                            <div className="w-32 h-32 bg-rose-500/10 text-rose-400 rounded-full flex items-center justify-center mx-auto border border-rose-500/20 shadow-2xl shadow-rose-500/20">
                                                <XCircle className="w-16 h-16" />
                                            </div>
                                            <div>
                                                <h3 className="text-3xl font-black text-foreground uppercase tracking-tight">
                                                    {paymentRequired ? 'No Payment Found' : 'Validation Failed'}
                                                </h3>
                                                <p className="text-rose-400 font-black uppercase tracking-widest text-[10px] mt-2">
                                                    {paymentRequired ? 'Session Access Denied: Financial Protocol' : 'Unrecognized Protocol or Identity'}
                                                </p>

                                                {paymentRequired && (
                                                    <Button
                                                        variant="premium"
                                                        className="mt-8 h-12 uppercase font-black tracking-widest text-[10px]"
                                                        onClick={() => setIsProcessingPayment(true)}
                                                    >
                                                        <Banknote className="w-4 h-4 mr-2" /> Collect ${session?.session_fee?.toFixed(2) || '5.00'} Payment
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="w-full space-y-10">
                                    <div id="reader" className="w-full rounded-3xl overflow-hidden border border-surface-border bg-background/50 aspect-square flex items-center justify-center relative">
                                        <div className="absolute inset-0 border-[40px] border-surface opacity-20 pointer-events-none"></div>
                                        <div className="text-center">
                                            <Camera className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Awaiting Capture Input</p>
                                        </div>
                                    </div>
                                    <div className="bg-indigo-500/5 p-6 rounded-2xl border border-indigo-500/10">
                                        <p className="text-[9px] text-indigo-400 font-black uppercase tracking-widest leading-relaxed">
                                            PROTOCOL: Align participant's digital ID within the capture zone.
                                            The system will automatically extract and validate identity parameters.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </Card>

                {/* Right Analytics Area */}
                <div className="space-y-12">
                    <Card className="bg-gradient-premium border-none text-white overflow-hidden p-10 shadow-2xl shadow-indigo-500/20 relative">
                        <div className="absolute top-0 right-0 p-10 opacity-10">
                            <QrIcon className="w-40 h-40" />
                        </div>
                        <div className="relative z-10 flex items-center justify-between mb-10">
                            <h3 className="text-lg font-black uppercase tracking-[0.2em]">Session Analytics</h3>
                            <span className="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-[9px] font-black uppercase tracking-widest border border-white/20">Live Syncing</span>
                        </div>
                        <div className="relative z-10 space-y-10">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-6xl font-black tracking-tighter leading-none">{attendance.length}</p>
                                    <p className="text-[10px] font-black uppercase text-white/60 tracking-widest mt-3">Verified Entries</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-black tracking-tight">{session?.max_capacity ? Math.round((attendance.length / session.max_capacity) * 100) : '--'}%</p>
                                    <p className="text-[10px] font-black uppercase text-white/60 tracking-widest mt-1">Attendance Rate</p>
                                </div>
                            </div>
                            <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden border border-white/5 p-0.5">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: session?.max_capacity ? `${(attendance.length / session.max_capacity) * 100}%` : '50%' }}
                                    className="h-full bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.8)]"
                                ></motion.div>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-10 bg-surface border-surface-border">
                        <h3 className="text-[11px] font-black text-foreground uppercase tracking-[0.2em] mb-10">Audit Stream</h3>
                        <div className="space-y-8">
                            {attendance.length > 0 ? attendance.slice(0, 4).map((att, i) => (
                                <div key={att.id} className="flex items-center justify-between group">
                                    <div className="flex items-center space-x-5">
                                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center font-black text-indigo-400 border border-white/5 group-hover:border-indigo-500/30 transition-all overflow-hidden">
                                            {att.users.profile_photo_url ? (
                                                <img src={att.users.profile_photo_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                att.users.first_name[0] + att.users.surname[0]
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-white uppercase tracking-tight">{att.users.first_name} {att.users.surname}</p>
                                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                                                ID: {att.user_id.slice(0, 8)} • {new Date(att.checkin_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="w-6 h-6 bg-emerald-500/10 rounded-lg flex items-center justify-center border border-emerald-500/20">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-10">
                                    <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest">No Recent Activity</p>
                                </div>
                            )}
                        </div>
                        <Button
                            variant="ghost"
                            className="w-full mt-12 h-14 bg-background text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-foreground border border-transparent hover:border-surface-border"
                            onClick={() => setIsManualModalOpen(true)}
                        >
                            <Search className="w-4 h-4 mr-3" /> Execute Manual Override
                        </Button>
                    </Card>
                </div>
            </div>

            {/* In-App Payment Collection Modal */}
            {isProcessingPayment && paymentRequired && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-background/90 backdrop-blur-xl p-4">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-surface border border-surface-border rounded-3xl w-full max-w-md p-8 shadow-2xl"
                    >
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xl font-black text-foreground uppercase tracking-tight text-center w-full">Point-of-Entry Checkout</h3>
                        </div>

                        <div className="bg-background rounded-2xl p-6 mb-8 border border-surface-border text-center">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Session Fee</p>
                            <p className="text-5xl font-black text-foreground tracking-tighter">${session?.session_fee?.toFixed(2) || '5.00'}</p>
                        </div>

                        <div className="space-y-4">
                            <Button
                                variant="premium"
                                className="w-full h-14 uppercase font-black tracking-widest text-xs"
                                onClick={async () => {
                                    try {
                                        setLoading(true);
                                        // Use the returned payment for receipt
                                        const p = await sessionService.recordSessionPayment(
                                            sessionId!,
                                            paymentRequired.userId,
                                            organization!.id,
                                            session?.session_fee || 5,
                                            'cash',
                                            profile!.id,
                                            'paid'
                                        );

                                        setLatestPayment(p);
                                        setIsReceiptModalOpen(true);

                                        setIsProcessingPayment(false);
                                        setPaymentRequired(null);
                                        // We don't auto-check-in here to keep them separate, 
                                        // but if it was QR-triggered, we might want to ask.
                                        // For now, let's allow them to click 'Check-in' in the background or after modal.
                                        fetchParticipants();
                                    } catch (err) {
                                        console.error(err);
                                    } finally {
                                        setLoading(false);
                                    }
                                }}
                            >
                                <Banknote className="w-4 h-4 mr-3" /> Confirm Cash Tender
                            </Button>
                            <Button
                                variant="outline"
                                className="h-14 w-full border-surface-border text-slate-500 uppercase font-black tracking-widest text-xs"
                                onClick={() => {
                                    setIsProcessingPayment(false);
                                    setPaymentRequired(null);
                                    setScannedResult(null);
                                }}
                            >
                                <XCircle className="w-4 h-4 mr-3" /> Abort Transaction
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Manual Override Modal */}
            {isManualModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-2xl p-4">
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-surface border border-surface-border rounded-[32px] w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
                    >
                        <div className="p-8 border-b border-surface-border flex justify-between items-center bg-background">
                            <div>
                                <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Manual Attendance Registry</h3>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Bypass QR protocol for authenticated override</p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setIsManualModalOpen(false)}>
                                <XCircle className="w-6 h-6 text-slate-500 hover:text-foreground" />
                            </Button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {participants.map((p) => {
                                const userItem = Array.isArray(p.users) ? p.users[0] : p.users;
                                const attended = isUserAttended(userItem.id);
                                return (
                                    <div key={userItem.id} className="bg-background border border-surface-border rounded-2xl p-4 flex items-center justify-between group hover:bg-surface transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-surface flex items-center justify-center font-black text-xs text-primary border border-surface-border overflow-hidden">
                                                {userItem.profile_photo_url ? (
                                                    <img src={userItem.profile_photo_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    (userItem.first_name[0] + userItem.surname[0]).toUpperCase()
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-foreground uppercase tracking-tight">{userItem.first_name} {userItem.surname}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${attended ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'}`}>
                                                        {attended ? 'Attended' : 'Absent'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                className="h-9 px-4 text-[9px] font-black uppercase tracking-widest bg-emerald-500/5 text-emerald-600 border-surface-border hover:bg-emerald-500/10"
                                                onClick={() => {
                                                    setPaymentRequired({ userId: userItem.id });
                                                    setIsProcessingPayment(true);
                                                }}
                                            >
                                                <Banknote className="w-3.5 h-3.5 mr-2" /> Fee
                                            </Button>
                                            <Button
                                                variant="premium"
                                                className="h-9 px-4 text-[9px] font-black uppercase tracking-widest"
                                                disabled={attended}
                                                onClick={() => handleAttendanceCheck(`user-${userItem.id}`)}
                                            >
                                                <CheckCircle2 className="w-3.5 h-3.5 mr-2" /> {attended ? 'Verified' : 'Check-in'}
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}

                            {participants.length === 0 && (
                                <div className="text-center py-20 bg-background rounded-3xl border border-dashed border-surface-border">
                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">No Active Enrollments Found</p>
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-surface-border bg-background/50">
                            <Button variant="ghost" className="w-full text-slate-500 text-[10px] font-black uppercase tracking-widest" onClick={() => setIsManualModalOpen(false)}>
                                Exit Override Mode
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}

            {isReceiptModalOpen && latestPayment && (
                <ReceiptModal
                    isOpen={isReceiptModalOpen}
                    onClose={() => setIsReceiptModalOpen(false)}
                    payment={latestPayment}
                    organization={organization}
                />
            )}
        </div>
    );
}
