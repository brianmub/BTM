import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { GlassBox } from '@/components/ui/Card';
import { supabase } from '@/services/supabase';
import { Loader2, Lock, User, CheckCircle2 } from 'lucide-react';

export function AcceptInvite() {
    const { token } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [invite, setInvite] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const [form, setForm] = useState({
        password: '',
        confirmPassword: '',
        firstName: '',
        surname: ''
    });

    useEffect(() => {
        if (token) verifyToken();
    }, [token]);

    const verifyToken = async () => {
        try {
            const { data, error } = await supabase
                .from('invitations')
                .select('*, organizations(name, primary_color)')
                .eq('token', token)
                .is('accepted_at', null)
                .single();

            if (error || !data) throw new Error('Invalid or expired invitation.');

            // Check expiry
            if (new Date(data.expires_at) < new Date()) throw new Error('Invitation has expired.');

            setInvite(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (e: React.FormEvent) => {
        e.preventDefault();
        if (form.password !== form.confirmPassword) {
            setError("Passwords don't match");
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            // 1. Create Auth User
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: invite.email,
                password: form.password,
            });

            if (authError) throw authError;

            if (authData.user) {
                // 2. Create Profile
                const { error: profileError } = await supabase
                    .from('users')
                    .insert([{
                        // id: auto-generated
                        auth_id: authData.user.id,
                        organization_id: invite.organization_id,
                        email: invite.email,
                        first_name: form.firstName,
                        surname: form.surname,
                        role: invite.role,
                        is_active: true
                    }]);

                if (profileError) throw profileError;

                // 3. Mark Invite Accepted
                await supabase
                    .from('invitations')
                    .update({ accepted_at: new Date().toISOString() })
                    .eq('id', invite.id);

                // 4. Redirect
                navigate('/dashboard');
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to accept invitation.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-10 h-10 text-primary animate-spin" /></div>;

    if (error) return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
            <GlassBox className="p-8 max-w-md w-full text-center border-red-500/20 bg-rose-500/5">
                <h1 className="text-xl font-bold text-rose-600 mb-2">Invitation Error</h1>
                <p className="text-slate-500 mb-6">{error}</p>
                <Button variant="outline" onClick={() => navigate('/login')}>Go to Login</Button>
            </GlassBox>
        </div>
    );

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6 text-foreground relative overflow-hidden">
            {/* Dynamic Background */}
            <div
                className="fixed top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full opacity-20 blur-[150px] pointer-events-none"
                style={{ background: invite.organizations?.primary_color || '#6366f1' }}
            ></div>

            <GlassBox className="relative z-10 p-10 max-w-lg w-full border-surface-border bg-surface shadow-2xl">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                        <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h1 className="text-2xl font-black uppercase tracking-tight mb-2">Join {invite.organizations?.name}</h1>
                    <p className="text-slate-500 text-sm">Set up your account to accept the invitation.</p>
                </div>

                <form onSubmit={handleAccept} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">First Name</label>
                            <input
                                type="text"
                                required
                                className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 text-foreground outline-none focus:border-primary/30 transition-colors shadow-inner"
                                value={form.firstName}
                                onChange={e => setForm({ ...form, firstName: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Surname</label>
                            <input
                                type="text"
                                required
                                className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 text-foreground outline-none focus:border-primary/30 transition-colors shadow-inner"
                                value={form.surname}
                                onChange={e => setForm({ ...form, surname: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Secure Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                                type="password"
                                required
                                minLength={6}
                                className="w-full bg-background border border-surface-border rounded-xl pl-12 pr-4 py-3 text-foreground outline-none focus:border-primary/30 transition-colors shadow-inner"
                                value={form.password}
                                onChange={e => setForm({ ...form, password: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Confirm Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                                type="password"
                                required
                                minLength={6}
                                className="w-full bg-background border border-surface-border rounded-xl pl-12 pr-4 py-3 text-foreground outline-none focus:border-primary/30 transition-colors shadow-inner"
                                value={form.confirmPassword}
                                onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                            />
                        </div>
                    </div>

                    <Button variant="premium" className="w-full h-14 text-sm font-black uppercase tracking-widest mt-4" disabled={submitting}>
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Complete Setup & Join'}
                    </Button>
                </form>
            </GlassBox>
        </div>
    );
}
