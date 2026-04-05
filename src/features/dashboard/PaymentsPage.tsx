import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { useOrganization } from '@/hooks/useOrganization';
import {
    Loader2,
    Search,
    Filter,
    Banknote,
    Download,
    Printer,
    History,
    ChevronRight,
    User,
    Calendar,
    ArrowUpRight,
    Plus,
    XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, GlassBox } from '@/components/ui/Card';
import { ReceiptModal } from '@/components/shared/ReceiptModal';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';

export function PaymentsPage() {
    const { organization } = useOrganization();
    const { profile } = useAuth();
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPayment, setSelectedPayment] = useState<any>(null);
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    const [isNewPaymentModalOpen, setIsNewPaymentModalOpen] = useState(false);

    useEffect(() => {
        if (organization) fetchPayments();
    }, [organization]);

    const fetchPayments = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('payment_records')
                .select(`
                    *,
                    user:users(first_name, surname, email, profile_photo_url),
                    program:programs(name),
                    session:sessions(name, session_date)
                `)
                .eq('organization_id', organization!.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPayments(data || []);
        } catch (err) {
            console.error('Error fetching payments:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredPayments = payments.filter(p =>
        p.user?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.user?.surname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.receipt_number?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const stats = {
        total: payments.reduce((sum, p) => sum + p.amount, 0),
        count: payments.length,
        today: payments.filter(p => new Date(p.created_at).toDateString() === new Date().toDateString())
            .reduce((sum, p) => sum + p.amount, 0)
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-black text-foreground tracking-tighter uppercase italic">
                        Financial <span className="text-primary">Ledger</span>
                    </h1>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-1">
                        Centralized Payment Processing & Audit Trail
                    </p>
                </div>
                <Button
                    variant="premium"
                    className="h-12 px-8 font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-primary/10"
                    onClick={() => setIsNewPaymentModalOpen(true)}
                >
                    <Plus className="w-4 h-4 mr-2" /> Record Manual Payment
                </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Revenue (MTD)', value: `$${stats.total.toLocaleString()}`, icon: <Banknote className="w-5 h-5 text-emerald-600" />, trend: '+12%' },
                    { label: 'Today\'s Intake', value: `$${stats.today.toLocaleString()}`, icon: <ArrowUpRight className="w-5 h-5 text-primary" />, trend: 'Live' },
                    { label: 'Transactions', value: stats.count, icon: <History className="w-5 h-5 text-pink-600" />, trend: 'Vetted' },
                ].map((stat, i) => (
                    <GlassBox key={i} className="p-6 border-surface-border bg-surface">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-background rounded-xl border border-surface-border">
                                {stat.icon}
                            </div>
                            <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md uppercase tracking-widest">
                                {stat.trend}
                            </span>
                        </div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
                        <p className="text-3xl font-black text-foreground tracking-tighter">{stat.value}</p>
                    </GlassBox>
                ))}
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Search by student or receipt #..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-14 bg-background border border-surface-border rounded-2xl pl-12 pr-6 text-sm font-bold text-foreground outline-none focus:bg-surface focus:border-primary/30 transition-all"
                    />
                </div>
                <Button variant="outline" className="h-14 px-8 border-surface-border bg-background text-slate-500 hover:text-foreground font-black uppercase tracking-widest text-[10px]">
                    <Filter className="w-4 h-4 mr-2" /> Advanced Filters
                </Button>
            </div>

            {/* History Table */}
            <Card className="p-0 overflow-hidden bg-surface border-surface-border">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-500">
                        <thead className="bg-background text-xs uppercase font-black text-foreground tracking-wider border-b border-surface-border">
                            <tr>
                                <th className="px-8 py-5">Transaction Details</th>
                                <th className="px-8 py-5">Student / User</th>
                                <th className="px-8 py-5">Allocated To</th>
                                <th className="px-8 py-5">Value</th>
                                <th className="px-8 py-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-border">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" />
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-4">Auditing Records...</p>
                                    </td>
                                </tr>
                            ) : filteredPayments.map((payment) => (
                                <tr key={payment.id} className="hover:bg-background transition-colors group">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                            <div>
                                                <div className="text-foreground font-mono font-bold text-xs">{payment.receipt_number}</div>
                                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">
                                                    {new Date(payment.created_at).toLocaleDateString()} • {payment.payment_method}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-background border border-surface-border flex items-center justify-center font-black text-[10px] text-primary">
                                                {payment.user?.first_name?.[0]}{payment.user?.surname?.[0]}
                                            </div>
                                            <div>
                                                <div className="text-foreground font-bold">{payment.user?.first_name} {payment.user?.surname}</div>
                                                <div className="text-[10px] opacity-60">{payment.user?.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-primary">
                                                <Calendar className="w-3 h-3" />
                                                <span className="text-[10px] font-black uppercase tracking-wider">{payment.program?.name}</span>
                                            </div>
                                            {payment.session && (
                                                <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest pl-5">
                                                    Session: {payment.session.name}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 italic">
                                        <div className="text-foreground font-black text-lg tracking-tighter">
                                            ${payment.amount.toFixed(2)}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-10 px-4 bg-background text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-foreground border border-transparent hover:border-surface-border"
                                            onClick={() => {
                                                setSelectedPayment(payment);
                                                setIsReceiptModalOpen(true);
                                            }}
                                        >
                                            <Printer className="w-3.5 h-3.5 mr-2" /> Receipt
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Receipt Modal */}
            {isReceiptModalOpen && selectedPayment && (
                <ReceiptModal
                    isOpen={isReceiptModalOpen}
                    onClose={() => setIsReceiptModalOpen(false)}
                    payment={selectedPayment}
                    organization={organization}
                />
            )}

            {/* New Payment Modal */}
            <AnimatePresence>
                {isNewPaymentModalOpen && (
                    <NewPaymentModal
                        organization={organization}
                        profile={profile}
                        onClose={() => setIsNewPaymentModalOpen(false)}
                        onSuccess={(newData?: any[]) => {
                            if (newData) {
                                setPayments(newData);
                            } else {
                                setIsNewPaymentModalOpen(false);
                                fetchPayments();
                            }
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

function NewPaymentModal({ organization, profile, onClose, onSuccess }: { organization: any, profile: any, onClose: () => void, onSuccess: (data?: any[]) => void }) {
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [users, setUsers] = useState<any[]>([]);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [programs, setPrograms] = useState<any[]>([]);
    const [selectedProgram, setSelectedProgram] = useState<string>('');
    const [sessions, setSessions] = useState<any[]>([]);
    const [selectedSession, setSelectedSession] = useState<string>('none');
    const [amount, setAmount] = useState(5);
    const [method, setMethod] = useState('cash');
    const [continuousMode, setContinuousMode] = useState(true);

    useEffect(() => {
        if (search.length > 2) {
            const delay = setTimeout(searchUsers, 500);
            return () => clearTimeout(delay);
        }
    }, [search]);

    const searchUsers = async () => {
        const { data } = await supabase
            .from('users')
            .select('id, first_name, surname, email')
            .or(`first_name.ilike.%${search}%,surname.ilike.%${search}%,email.ilike.%${search}%`)
            .limit(5);
        setUsers(data || []);
    };

    useEffect(() => {
        if (selectedUser) {
            fetchUserEnrollments();
        }
    }, [selectedUser]);

    const fetchUserEnrollments = async () => {
        const { data } = await supabase
            .from('enrollments')
            .select(`
                id,
                program:programs(id, name)
            `)
            .eq('user_id', selectedUser.id)
            .eq('organization_id', organization.id)
            .eq('status', 'active');

        setPrograms(data?.map(e => ({
            id: e.id,
            progId: (e.program as any).id,
            name: (e.program as any).name
        })) || []);
    };

    useEffect(() => {
        if (selectedProgram) {
            fetchSessions();
        }
    }, [selectedProgram]);

    const fetchSessions = async () => {
        const prog = programs.find(p => p.id === selectedProgram);
        if (!prog) return;

        const { data } = await supabase
            .from('sessions')
            .select('id, name, session_date')
            .eq('program_id', prog.progId)
            .order('session_date', { ascending: true });
        setSessions(data || []);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { sessionService } = await import('@/services/sessionService');

            if (selectedSession !== 'none') {
                await sessionService.recordSessionPayment(
                    selectedSession,
                    selectedUser.id,
                    organization.id,
                    amount,
                    method,
                    profile.id
                );
            } else {
                // Record general program payment
                const { error } = await supabase
                    .from('payment_records')
                    .insert([{
                        organization_id: organization.id,
                        user_id: selectedUser.id,
                        enrollment_id: selectedProgram,
                        amount,
                        payment_method: method,
                        status: 'completed',
                        receipt_number: `GEN-${Date.now().toString().slice(-6)}`,
                        processed_by: profile.id
                    }]);
                if (error) throw error;
            }

            if (continuousMode) {
                // Clear only user-specific data
                setSelectedUser(null);
                setSearch('');
                // Keep selectedProgram, selectedSession, amount, and method for the next entry
            } else {
                onSuccess();
            }
        } catch (err: any) {
            alert('Error: ' + err.message);
        } finally {
            setLoading(false);
            // Refresh parent list even in continuous mode
            if (continuousMode) {
                const { data } = await supabase
                    .from('payment_records')
                    .select('*, user:users(first_name, surname, email, profile_photo_url), program:programs(name), session:sessions(name, session_date)')
                    .eq('organization_id', organization.id)
                    .order('created_at', { ascending: false });
                if (data) onSuccess(data); // Modified onSuccess to optionally accept data
            }
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/90 backdrop-blur-2xl">
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-surface border border-surface-border rounded-[32px] w-full max-w-lg p-10 shadow-2xl space-y-8"
            >
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-2xl font-black text-foreground uppercase tracking-tight">Financial Input</h3>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Manual transaction override protocol</p>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-foreground transition-colors"><XCircle className="w-8 h-8" /></button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* User Search */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Student Search</label>
                        {!selectedUser ? (
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    className="w-full h-14 bg-background border border-surface-border rounded-2xl pl-12 pr-6 text-sm font-bold text-foreground outline-none focus:bg-surface focus:border-primary/30"
                                    placeholder="Search by name or email..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                                {users.length > 0 && search.length > 2 && (
                                    <div className="absolute top-16 left-0 right-0 bg-surface border border-surface-border rounded-2xl p-2 z-10 shadow-2xl">
                                        {users.map(u => (
                                            <button
                                                key={u.id}
                                                type="button"
                                                className="w-full text-left p-3 hover:bg-background rounded-xl transition-colors text-sm font-bold text-slate-600"
                                                onClick={() => setSelectedUser(u)}
                                            >
                                                {u.first_name} {u.surname} <span className="text-[10px] opacity-60 italic">{u.email}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex justify-between items-center p-4 bg-primary/10 border border-primary/20 rounded-2xl">
                                <span className="font-black text-primary text-sm">{selectedUser.first_name} {selectedUser.surname}</span>
                                <button type="button" onClick={() => setSelectedUser(null)} className="text-[8px] font-black uppercase text-slate-500 underline">Change</button>
                            </div>
                        )}
                    </div>

                    {/* Continuous Mode Toggle */}
                    <div className="flex items-center justify-between p-4 bg-background border border-surface-border rounded-2xl">
                        <div className="flex items-center gap-3">
                            <History className="w-4 h-4 text-slate-500" />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Continuous Entry Mode</span>
                        </div>
                        <button 
                            type="button"
                            onClick={() => setContinuousMode(!continuousMode)}
                            className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${continuousMode ? 'bg-primary border-primary shadow-[0_0_10px_rgba(var(--primary),0.3)]' : 'bg-background border-surface-border'}`}
                        >
                            <div className={`w-2 h-2 rounded-full ${continuousMode ? 'bg-white' : 'bg-slate-700'}`}></div>
                        </button>
                    </div>

                    {selectedUser && (
                        <>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Target Program</label>
                                <select
                                    className="w-full h-14 bg-white/5 border border-white/5 rounded-2xl px-6 text-sm font-bold text-white outline-none"
                                    value={selectedProgram}
                                    onChange={e => setSelectedProgram(e.target.value)}
                                    required
                                >
                                    <option value="">Select Enrollment...</option>
                                    {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>

                            {selectedProgram && (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Session Lock</label>
                                            <select
                                                className="w-full h-14 bg-white/5 border border-white/5 rounded-2xl px-6 text-sm font-bold text-white outline-none"
                                                value={selectedSession}
                                                onChange={e => setSelectedSession(e.target.value)}
                                            >
                                                <option value="none">General Fee</option>
                                                {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Amount ($)</label>
                                            <input
                                                type="number"
                                                className="w-full h-14 bg-white/5 border border-white/5 rounded-2xl px-6 text-sm font-bold text-white outline-none"
                                                value={amount}
                                                onChange={e => setAmount(Number(e.target.value))}
                                                step="0.01"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Tender Method</label>
                                        <select
                                            className="w-full h-14 bg-background border border-surface-border rounded-2xl px-6 text-sm font-bold text-foreground outline-none font-black uppercase tracking-widest text-[10px]"
                                            value={method}
                                            onChange={e => setMethod(e.target.value)}
                                        >
                                            <option value="cash">💵 Hard Cash</option>
                                            <option value="ecocash">📱 EcoCash / Mobile</option>
                                            <option value="swipe">💳 POS / Swipe</option>
                                            <option value="bank_transfer">🏛️ Bank EFT</option>
                                        </select>
                                    </div>

                                    <Button
                                        type="submit"
                                        variant="premium"
                                        className="w-full h-16 font-black uppercase tracking-widest text-xs"
                                        disabled={loading}
                                    >
                                        {loading ? <Loader2 className="animate-spin" /> : 'Execute Financial Entry'}
                                    </Button>
                                </>
                            )}
                        </>
                    )}
                </form>
            </motion.div>
        </div>
    );
}
