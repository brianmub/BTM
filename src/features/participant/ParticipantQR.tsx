import { useState, useEffect } from 'react';
import { Card, GlassBox } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { QrCode as QrIcon, Camera, CheckCircle2, XCircle, ChevronLeft, Loader2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { sessionService } from '@/services/sessionService';

export function ParticipantQR() {
    const { user } = useAuth();
    const { organization } = useOrganization();
    const { orgSlug } = useParams();
    const navigate = useNavigate();

    const [mode, setMode] = useState<'my-id' | 'scanner'>('my-id');
    const [scannedResult, setScannedResult] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState<boolean | null>(null);
    const [lastAction, setLastAction] = useState<'clock_in' | 'clock_out' | 'none' | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let scanner: Html5QrcodeScanner | null = null;

        if (mode === 'scanner') {
            const initScanner = () => {
                const element = document.getElementById("participant-reader");
                if (!element) {
                    // If not found yet, wait a frame (common with animations)
                    requestAnimationFrame(initScanner);
                    return;
                }

                scanner = new Html5QrcodeScanner(
                    "participant-reader",
                    { fps: 10, qrbox: { width: 250, height: 250 } },
                    false
                );

                scanner.render(async (decodedText) => {
                    setScannedResult(decodedText);
                    await handleScan(decodedText);
                    scanner?.clear();
                }, (error) => {
                    // Silent
                });
            };

            // Small delay to ensure motion animation has started/rendered the container
            const timer = setTimeout(initScanner, 100);

            return () => {
                clearTimeout(timer);
                if (scanner) {
                    scanner.clear().catch(console.error);
                }
            };
        }
    }, [mode]);

    const handleScan = async (qrData: string) => {
        if (!user || !organization) return;

        try {
            setLoading(true);
            // participant scans session QR
            const result = await sessionService.processQRCheckin(qrData, user.id, organization.id);
            setIsSuccess(true);
            setLastAction((result as any).action);
        } catch (err) {
            setIsSuccess(false);
            setLastAction(null);
        } finally {
            setLoading(false);
            setTimeout(() => {
                setScannedResult(null);
                setIsSuccess(null);
                setLastAction(null);
                if (mode === 'scanner') setMode('scanner');
            }, 3000);
        }
    };

    return (
        <div className="min-h-screen bg-background p-6 space-y-8">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(`/portal/${orgSlug}/dashboard`)}
                    className="p-2 bg-surface rounded-xl text-slate-400 hover:text-foreground transition-colors border border-surface-border shadow-sm"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-xl font-black text-foreground uppercase tracking-tight">Attendance Hub</h1>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Digital credentials & verification</p>
                </div>
            </div>

            <div className="flex bg-surface p-1 rounded-2xl border border-surface-border shadow-xl">
                <button
                    onClick={() => setMode('my-id')}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'my-id' ? 'bg-gradient-premium text-white' : 'text-slate-500'}`}
                >
                    My ID Card
                </button>
                <button
                    onClick={() => setMode('scanner')}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'scanner' ? 'bg-gradient-premium text-white' : 'text-slate-500'}`}
                >
                    Scan Session
                </button>
            </div>

            <AnimatePresence mode="wait">
                {mode === 'my-id' ? (
                    <motion.div
                        key="my-id"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-8"
                    >
                        <Card className="bg-surface border-surface-border p-10 text-center space-y-8 overflow-hidden relative group shadow-2xl">
                            <div className="absolute inset-0 bg-primary/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>

                            <div className="space-y-2 relative z-10">
                                <h3 className="text-2xl font-black text-foreground uppercase tracking-tight">Identity Token</h3>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Scan for session verification</p>
                            </div>

                            <div className="relative group">
                                <div className="absolute -inset-4 bg-gradient-premium opacity-20 blur-xl group-hover:opacity-30 transition-opacity rounded-full"></div>
                                <div className="relative bg-background p-6 rounded-3xl border border-surface-border shadow-inner">
                                    {user?.id && (
                                        <QRCodeSVG
                                            value={`user-${user.id}`}
                                            size={200}
                                            level="H"
                                            includeMargin={true}
                                        />
                                    )}
                                </div>
                            </div>

                            <div className="pt-4 relative z-10">
                                <div className="flex items-center space-x-2 mb-4">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Active Verification Signal</p>
                                </div>
                            </div>
                        </Card>

                        <div className="bg-primary/5 p-6 rounded-2xl border border-primary/20 shadow-lg">
                            <h4 className="text-[10px] font-black text-primary uppercase tracking-widest mb-2">Privacy Notice</h4>
                            <p className="text-[9px] text-slate-500 font-medium leading-relaxed uppercase tracking-wider">
                                This encrypted token is unique to your profile. Do not share or screenshot for 3rd party use.
                            </p>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="scanner"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        <Card className="aspect-square bg-surface border-surface-border relative overflow-hidden flex items-center justify-center p-0 shadow-2xl">
                            {scannedResult ? (
                                <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm">
                                    <div className="text-center space-y-6">
                                        {isSuccess ? (
                                            <>
                                                <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto border-2 shadow-2xl transition-colors ${lastAction === 'clock_out' ? 'bg-blue-500/20 text-blue-600 border-blue-500/30' : 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30'
                                                    }`}>
                                                    <CheckCircle2 className="w-12 h-12" />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-black text-foreground uppercase tracking-tight">{lastAction === 'clock_out' ? 'See You Soon' : 'Welcome'}</h3>
                                                    <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${lastAction === 'clock_out' ? 'text-blue-600' : 'text-emerald-600'}`}>
                                                        {lastAction === 'clock_out' ? 'Checkout Synchronized' : 'Attendance Verified'}
                                                    </p>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="w-24 h-24 bg-rose-500/10 text-rose-600 rounded-full flex items-center justify-center mx-auto border-2 border-rose-500/20 shadow-2xl">
                                                    <XCircle className="w-12 h-12" />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Access Denied</h3>
                                                    <p className="text-rose-600 text-[10px] font-black uppercase tracking-widest mt-1">Invalid or Inactive Session Token</p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ) : null}

                            {loading && <div className="p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}
                            {!scannedResult && (
                                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                    <Card className="max-w-md w-full p-8 border-surface-border bg-surface shadow-2xl relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-premium"></div>

                                        <div className="text-center space-y-8">
                                            <div id="participant-reader" className="w-full h-full"></div>
                                        </div>
                                    </Card>
                                </div>
                            )}
                        </Card>

                        <div className="bg-primary/5 p-6 rounded-2xl border border-primary/20 flex items-start gap-4 shadow-lg">
                            <div className="mt-8 pt-8 border-t border-surface-border text-center">
                                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em] leading-relaxed">
                                    Hold your device steady for the scanner.<br />
                                    This token automatically refreshes every minute.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
