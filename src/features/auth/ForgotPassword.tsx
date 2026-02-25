import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { GlassBox } from '@/components/ui/Card';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, ArrowLeft, Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/services/supabase';

export function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError(null);

            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (resetError) throw resetError;

            setSubmitted(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-500/10 rounded-full blur-[120px]"></div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="text-center mb-10">
                    <Button variant="ghost" className="mb-8 pl-0 hover:pl-0 text-slate-500 hover:text-foreground transition-colors" onClick={() => navigate(-1)}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
                    </Button>
                    <h2 className="text-4xl font-black text-foreground tracking-tight mb-2 uppercase">Reset Access</h2>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Secure Recovery Protocol</p>
                </div>

                <GlassBox className="p-10 border-surface-border bg-surface backdrop-blur-2xl">
                    {submitted ? (
                        <div className="text-center space-y-6">
                            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto text-emerald-500">
                                <CheckCircle2 className="w-8 h-8" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Email Dispatched</h3>
                                <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest leading-relaxed">
                                    A restoration link has been sent to <span className="text-foreground">{email}</span>. Please check your inbox.
                                </p>
                            </div>
                            <Button onClick={() => navigate('/login')} className="w-full h-14 text-sm font-black uppercase tracking-widest" variant="outline">
                                Return to Login
                            </Button>
                        </div>
                    ) : (
                        <form className="space-y-8" onSubmit={handleSubmit}>
                            {error && (
                                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-500 text-[10px] font-black uppercase tracking-widest text-center shadow-lg">
                                    {error}
                                </div>
                            )}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within:text-indigo-400 transition-colors" />
                                    <input
                                        type="email"
                                        placeholder="your@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 rounded-2xl border border-surface-border bg-background text-foreground placeholder:text-slate-400 focus:border-primary/50 focus:ring-0 transition-all outline-none font-medium"
                                        required
                                    />
                                </div>
                            </div>

                            <Button type="submit" className="w-full h-16 text-lg font-black uppercase tracking-widest" variant="premium" disabled={loading}>
                                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Send Reset Link <ArrowRight className="ml-3 w-6 h-6" /></>}
                            </Button>
                        </form>
                    )}
                </GlassBox>

                <div className="mt-12 text-center">
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] opacity-40">
                        Institutional Grade Security Overload
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
