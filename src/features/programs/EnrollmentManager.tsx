import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { useOrganization } from '@/hooks/useOrganization';
import { Loader2, Search, Filter, CheckCircle2, XCircle, Banknote, MoreVertical, Printer } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useParams } from 'react-router-dom';
import { ReceiptModal } from '@/components/shared/ReceiptModal';
import { History } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface Enrollment {
    id: string;
    user: {
        id: string;
        first_name: string;
        surname: string;
        email: string;
        phone_number?: string;
        marital_status?: string;
        residential_address?: string;
    };
    program: {
        id: string;
        name: string;
        enrollment_fee: number;
    };
    status: string;
    payment_status: string;
    amount_due: number;
    amount_paid: number;
    enrolled_at: string;
}

export function EnrollmentManager({ programId: propProgramId }: { programId?: string }) {
    const { programId: urlProgramId } = useParams();
    const programId = propProgramId || urlProgramId;
    const { organization } = useOrganization();
    const { profile } = useAuth();
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [latestPayment, setLatestPayment] = useState<any>(null);
    const [payments, setPayments] = useState<any[]>([]);

    useEffect(() => {
        if (organization) fetchEnrollments();
    }, [organization, programId]);

    const fetchEnrollments = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('enrollments')
                .select(`
                    id,
                    status,
                    payment_status,
                    amount_due,
                    amount_paid,
                    enrolled_at,
                    user:users (id, first_name, surname, email, phone_number, marital_status, residential_address),
                    program:programs (id, name, enrollment_fee)
                `)
                .eq('organization_id', organization!.id)
                .order('enrolled_at', { ascending: false });

            if (programId) {
                query = query.eq('program_id', programId);
            }

            const { data, error } = await query;
            if (error) throw error;

            // Fix: Supabase join results can sometimes be typed as arrays
            const formattedData = (data as any[] || []).map(item => ({
                ...item,
                user: Array.isArray(item.user) ? item.user[0] : item.user,
                program: Array.isArray(item.program) ? item.program[0] : item.program
            }));

            setEnrollments(formattedData);
        } catch (err) {
            console.error('Error fetching enrollments:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleReceivePayment = (enrollment: Enrollment) => {
        setSelectedEnrollment(enrollment);
        setIsPaymentModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">Enrollments & Payments</h2>
                    <p className="text-slate-500 text-xs">Manage student access and financials</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="h-10 text-xs uppercase font-bold">
                        <Filter className="w-4 h-4 mr-2" /> Filter
                    </Button>
                    <Button variant="outline" className="h-10 text-xs uppercase font-bold">
                        <Printer className="w-4 h-4 mr-2" /> Report
                    </Button>
                </div>
            </div>

            {/* List */}
            <Card className="p-0 overflow-hidden bg-surface border-surface-border shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-500">
                        <thead className="bg-background text-xs uppercase font-black text-foreground tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Student</th>
                                <th className="px-6 py-4">Program</th>
                                <th className="px-6 py-4">Contact & Status</th>
                                <th className="px-6 py-4">Finance</th>
                                <th className="px-6 py-4 text-right">Balance</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-border">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-500" />
                                    </td>
                                </tr>
                            ) : enrollments.map((enrollment) => (
                                <tr key={enrollment.id} className="hover:bg-background transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-foreground">{enrollment.user.first_name} {enrollment.user.surname}</div>
                                        <div className="text-[10px] opacity-60 text-slate-500">{enrollment.user.email}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-medium text-foreground">{enrollment.program.name}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${enrollment.user.marital_status === 'married' ? 'bg-pink-500/10 text-pink-400' : 'bg-slate-500/10 text-slate-400'
                                                    }`}>
                                                    {enrollment.user.marital_status || 'Single'}
                                                </span>
                                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${enrollment.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                                                    }`}>
                                                    {enrollment.status}
                                                </span>
                                            </div>
                                            <div className="text-[10px] text-slate-500 font-bold">{enrollment.user.phone_number || 'No Phone'}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${enrollment.payment_status === 'paid' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                                                }`}>
                                                {enrollment.payment_status === 'paid' && <CheckCircle2 className="w-3 h-3" />}
                                                {enrollment.payment_status}
                                            </span>
                                            <div className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">${enrollment.amount_paid} Paid</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono text-foreground">
                                        ${(enrollment.amount_due - enrollment.amount_paid).toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <Button
                                            variant="ghost"
                                            className="h-8 w-8 p-0 text-slate-400 hover:text-foreground"
                                            onClick={async () => {
                                                setSelectedEnrollment(enrollment);
                                                const { data } = await supabase
                                                    .from('payment_records')
                                                    .select('*, user:users(first_name, surname), program:programs(name)')
                                                    .eq('enrollment_id', enrollment.id)
                                                    .order('created_at', { ascending: false });
                                                setPayments(data || []);
                                                setIsHistoryOpen(true);
                                            }}
                                        >
                                            <History className="w-4 h-4" />
                                        </Button>
                                        {(enrollment.amount_due - enrollment.amount_paid) > 0 && (
                                            <Button
                                                variant="premium"
                                                className="h-8 text-[10px] px-3 uppercase font-black tracking-widest"
                                                onClick={() => handleReceivePayment(enrollment)}
                                            >
                                                <Banknote className="w-3 h-3 mr-2" /> Pay
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {isPaymentModalOpen && selectedEnrollment && (
                <ReceivePaymentModal
                    enrollment={selectedEnrollment}
                    profile={profile}
                    onClose={() => setIsPaymentModalOpen(false)}
                    onSuccess={(payment) => {
                        setIsPaymentModalOpen(false);
                        setLatestPayment(payment);
                        setIsReceiptModalOpen(true);
                        fetchEnrollments();
                    }}
                />
            )}

            {isReceiptModalOpen && latestPayment && (
                <ReceiptModal
                    isOpen={isReceiptModalOpen}
                    onClose={() => setIsReceiptModalOpen(false)}
                    payment={latestPayment}
                    organization={organization}
                />
            )}

            {isHistoryOpen && selectedEnrollment && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-md p-4">
                    <div className="bg-surface border border-surface-border rounded-2xl w-full max-w-lg p-6 shadow-2xl overflow-hidden">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Payment History</h3>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{selectedEnrollment.user.first_name} {selectedEnrollment.user.surname}</p>
                            </div>
                            <button onClick={() => setIsHistoryOpen(false)} className="text-slate-500 hover:text-foreground"><XCircle className="w-6 h-6" /></button>
                        </div>

                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                            {payments.length > 0 ? payments.map((p) => (
                                <div key={p.id} className="bg-background border border-surface-border rounded-xl p-4 flex items-center justify-between group hover:border-primary/30 transition-all">
                                    <div className="space-y-1">
                                        <div className="text-sm font-black text-foreground">${p.amount.toFixed(2)}</div>
                                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                            {new Date(p.created_at).toLocaleDateString()} • {p.payment_method}
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        className="h-8 text-[9px] font-black uppercase tracking-widest border-surface-border bg-background opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => {
                                            setLatestPayment(p);
                                            setIsReceiptModalOpen(true);
                                        }}
                                    >
                                        View Receipt
                                    </Button>
                                </div>
                            )) : (
                                <div className="text-center py-10 text-slate-500 text-sm italic font-medium">
                                    No payments recorded yet.
                                </div>
                            )}
                        </div>

                        <div className="mt-8 pt-6 border-t border-surface-border">
                            <Button variant="ghost" className="w-full text-slate-400 font-bold uppercase tracking-widest text-[10px]" onClick={() => setIsHistoryOpen(false)}>
                                Done
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function ReceivePaymentModal({ enrollment, profile, onClose, onSuccess }: { enrollment: Enrollment, profile: any, onClose: () => void, onSuccess: (payment: any) => void }) {
    const { organization } = useOrganization();
    const [amount, setAmount] = useState(enrollment.amount_due - enrollment.amount_paid);
    const [method, setMethod] = useState('cash');
    const [reference, setReference] = useState('');
    const [sessionId, setSessionId] = useState<string>('none');
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchSessions = async () => {
            const { data } = await supabase
                .from('sessions')
                .select('*')
                .eq('program_id', enrollment.program.id)
                .order('session_date', { ascending: true });
            setSessions(data || []);
        };
        fetchSessions();
    }, [enrollment.program.id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (sessionId !== 'none') {
                const { sessionService } = await import('@/services/sessionService');
                const p = await sessionService.recordSessionPayment(sessionId, enrollment.user.id, organization!.id, amount, method, profile.id);
                onSuccess(p);
                return;
            }

            // 1. Record General Payment (Existing Logic)
            const paymentPayload = {
                organization_id: organization!.id,
                user_id: enrollment.user.id,
                enrollment_id: enrollment.id,
                amount: amount,
                payment_method: method,
                transaction_reference: reference || `MANUAL-${Date.now()}`,
                status: 'completed',
                receipt_number: `RCP-${Date.now().toString().slice(-6)}`,
                processed_by: profile.id
            };

            const { data: paymentData, error: payError } = await supabase
                .from('payment_records')
                .insert([paymentPayload])
                .select(`
                    *,
                    user:users(first_name, surname),
                    program:programs(name)
                `)
                .single();

            if (payError) throw payError;

            // 2. Update Enrollment
            const newPaid = enrollment.amount_paid + amount;
            const newStatus = newPaid >= enrollment.amount_due ? 'paid' : 'partial';
            const { error: enrollError } = await supabase
                .from('enrollments')
                .update({
                    amount_paid: newPaid,
                    payment_status: newStatus,
                    status: newStatus === 'paid' ? 'active' : enrollment.status
                })
                .eq('id', enrollment.id);

            if (enrollError) throw enrollError;

            onSuccess(paymentData);

        } catch (err: any) {
            alert('Error: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4">
            <div className="bg-surface border border-surface-border rounded-2xl w-full max-w-md p-6 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Receive Payment</h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-foreground"><XCircle className="w-6 h-6" /></button>
                </div>

                <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 mb-6">
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-500">Student:</span>
                        <span className="text-foreground font-bold">{enrollment.user.first_name} {enrollment.user.surname}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Outstanding:</span>
                        <span className="text-rose-500 font-bold">${(enrollment.amount_due - enrollment.amount_paid).toFixed(2)}</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Amount ($)</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={e => setAmount(Number(e.target.value))}
                            className="w-full bg-background border border-surface-border rounded-lg p-3 text-foreground font-mono text-lg focus:border-primary/50 outline-none"
                            max={enrollment.amount_due - enrollment.amount_paid}
                            min={0.01}
                            step="0.01"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Assign to Session (Optional)</label>
                        <select
                            value={sessionId}
                            onChange={e => {
                                setSessionId(e.target.value);
                                if (e.target.value !== 'none') setAmount(5); // Default session fee
                            }}
                            className="w-full bg-background border border-surface-border rounded-lg p-3 text-foreground text-sm focus:border-primary/50 outline-none"
                        >
                            <option value="none" className="bg-surface text-foreground">General Program Fee</option>
                            {sessions.map(s => (
                                <option key={s.id} value={s.id} className="bg-surface text-foreground">{s.name} ({new Date(s.session_date).toLocaleDateString()})</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Payment Method</label>
                        <select
                            value={method}
                            onChange={e => setMethod(e.target.value)}
                            className="w-full bg-background border border-surface-border rounded-lg p-3 text-foreground text-sm focus:border-primary/50 outline-none"
                        >
                            <option value="cash" className="bg-surface text-foreground">Cash</option>
                            <option value="ecocash" className="bg-surface text-foreground">EcoCash</option>
                            <option value="swipe" className="bg-surface text-foreground">Swipe / Bank Card</option>
                            <option value="bank_transfer" className="bg-surface text-foreground">Bank Transfer</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Reference / Notes (Optional)</label>
                        <input
                            type="text"
                            value={reference}
                            onChange={e => setReference(e.target.value)}
                            placeholder="e.g. Transaction ID or Receipt Book #"
                            className="w-full bg-background border border-surface-border rounded-lg p-3 text-foreground text-sm focus:border-primary/50 outline-none"
                        />
                    </div>

                    <Button type="submit" variant="premium" className="w-full h-12 uppercase font-black tracking-widest mt-4" disabled={loading}>
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Payment'}
                    </Button>
                </form>
            </div>
        </div>
    );
}
