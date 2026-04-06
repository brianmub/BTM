
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { profileService } from '@/services/profileService';
import { GlassBox } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ReceiptModal } from '@/components/shared/ReceiptModal';
import { 
    Banknote, Calendar, ChevronRight, Receipt, 
    ArrowUpRight, Filter, Download, Clock, CheckCircle2 
} from 'lucide-react';
import { motion } from 'framer-motion';

export function ParticipantPayments() {
    const { profile } = useAuth();
    const { organization } = useOrganization();
    
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPayment, setSelectedPayment] = useState<any>(null);
    const [isReceiptOpen, setIsReceiptOpen] = useState(false);

    useEffect(() => {
        if (profile?.id) fetchPayments();
    }, [profile?.id]);

    const fetchPayments = async () => {
        try {
            setLoading(true);
            const data = await profileService.getUserPayments(profile!.id);
            setPayments(data || []);
        } catch (err) {
            console.error('Error fetching payments:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleViewReceipt = (payment: any) => {
        // Ensure user object is present for the modal which expects 'user: {first_name, surname}'
        const formattedPayment = {
            ...payment,
            user: { 
                first_name: profile?.first_name || '', 
                surname: profile?.surname || '' 
            }
        };
        setSelectedPayment(formattedPayment);
        setIsReceiptOpen(true);
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="bg-foreground px-6 pt-12 pb-8 relative overflow-hidden">
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
                <h1 className="text-3xl font-black text-white uppercase tracking-tighter relative z-10">Payment History</h1>
                <p className="text-white/60 text-xs font-medium uppercase tracking-widest mt-1 relative z-10">Financial Records & Receipts</p>
            </div>

            <div className="p-6 -mt-6 relative z-20 space-y-6">
                {/* Summary Tiles */}
                <div className="grid grid-cols-2 gap-3">
                    <GlassBox className="p-4 bg-surface/50 backdrop-blur-xl border-white/5">
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Paid</span>
                            <span className="text-xl font-black text-foreground tracking-tighter">
                                ${payments.reduce((sum, p) => sum + (p.status === 'paid' ? p.amount : 0), 0).toFixed(2)}
                            </span>
                        </div>
                    </GlassBox>
                    <GlassBox className="p-4 bg-surface/50 backdrop-blur-xl border-white/5">
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Records</span>
                            <span className="text-xl font-black text-foreground tracking-tighter">{payments.length}</span>
                        </div>
                    </GlassBox>
                </div>

                {/* Filters / Labels */}
                <div className="flex items-center justify-between">
                    <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Filter className="w-3 h-3" /> Recent Transactions
                    </h2>
                </div>

                {/* Payment List */}
                <div className="space-y-3">
                    {loading ? (
                        [1, 2, 3].map(i => (
                            <div key={i} className="h-24 bg-surface rounded-2xl animate-pulse border border-surface-border" />
                        ))
                    ) : payments.length > 0 ? (
                        payments.map((p, idx) => (
                            <motion.div
                                key={p.id}
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                className="group relative"
                            >
                                <GlassBox className="p-4 bg-surface border-surface-border hover:border-primary/30 transition-all active:scale-[0.98] cursor-pointer">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-white/5 dark:to-white/10 flex items-center justify-center border border-white/5 shadow-inner">
                                                <Receipt className="w-6 h-6 text-primary" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-black text-foreground text-sm tracking-tight truncate uppercase">
                                                    {p.program?.name || 'Program Fee'}
                                                </h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[9px] font-bold text-slate-500">
                                                        {new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </span>
                                                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                                                    <span className="text-[9px] font-bold text-primary uppercase tracking-widest">{p.payment_method}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-black text-foreground font-mono">${p.amount.toFixed(2)}</div>
                                            <div className="mt-1">
                                                {p.status === 'paid' ? (
                                                    <span className="flex items-center gap-1 justify-end text-[8px] text-emerald-500 font-black uppercase tracking-widest">
                                                        <CheckCircle2 className="w-2.5 h-2.5" /> Paid
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 justify-end text-[8px] text-amber-500 font-black uppercase tracking-widest">
                                                        <Clock className="w-2.5 h-2.5" /> Pending
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-4 pt-4 border-t border-surface-border flex items-center justify-between">
                                        <div className="text-[8px] font-bold text-slate-400 font-mono tracking-tighter">REF: {p.receipt_number?.slice(0, 8)}...</div>
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            className="h-8 text-[8px] font-black uppercase tracking-widest bg-background border-surface-border"
                                            onClick={() => handleViewReceipt(p)}
                                        >
                                            <Download className="w-3 h-3 mr-2 text-primary" /> View Receipt
                                        </Button>
                                    </div>
                                </GlassBox>
                            </motion.div>
                        ))
                    ) : (
                        <div className="text-center py-20 bg-surface rounded-3xl border border-dashed border-surface-border">
                            <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Banknote className="w-8 h-8 text-slate-300" />
                            </div>
                            <h3 className="text-sm font-black text-foreground uppercase tracking-tight">No Payments Found</h3>
                            <p className="text-slate-500 text-[10px] font-medium px-12 mt-2">
                                Your payment records will appear here once you've recorded a transaction with the office.
                            </p>
                        </div>
                    )}
                </div>
                
                <div className="py-10 text-center">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">End of History</p>
                </div>
            </div>

            {selectedPayment && (
                <ReceiptModal 
                    isOpen={isReceiptOpen}
                    onClose={() => setIsReceiptOpen(false)}
                    payment={selectedPayment}
                    organization={organization}
                />
            )}
        </div>
    );
}
