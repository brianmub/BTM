import { X, Printer, Download, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { GlassBox } from '@/components/ui/Card';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';

interface ReceiptModalProps {
    isOpen: boolean;
    onClose: () => void;
    payment: {
        receipt_number: string;
        amount: number;
        payment_method: string;
        created_at: string;
        user: { first_name: string, surname: string };
        program?: { name: string };
    };
    organization: any;
}

export function ReceiptModal({ isOpen, onClose, payment, organization }: ReceiptModalProps) {
    if (!isOpen) return null;

    const handlePrint = () => {
        window.print();
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                />

                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 10 }}
                    className="relative w-full max-w-sm overflow-hidden"
                >
                    <GlassBox id="receipt-content" className="p-0 border-surface-border shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] overflow-hidden bg-surface print-only">
                        {/* Receipt Header - More Compact */}
                        <div className="bg-gradient-premium p-6 text-center text-white relative">
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors print:hidden"
                            >
                                <X className="w-4 h-4" />
                            </button>
                            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 backdrop-blur-md border border-white/30">
                                <CheckCircle2 className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-black uppercase tracking-tight">Payment Recorded</h3>
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-80 mt-1">Official Proof of Deposit</p>
                        </div>

                        {/* Receipt Body - Lean Vertical Spacing */}
                        <div className="p-6 space-y-4 bg-background text-foreground print:text-black">
                            {/* Org Info */}
                            <div className="text-center">
                                <div className="text-base font-black uppercase tracking-tighter text-foreground">{organization?.name}</div>
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">{organization?.slug}</div>
                            </div>

                            {/* Core Transaction Details */}
                            <div className="space-y-2 py-4 border-y border-surface-border border-dashed">
                                <div className="flex justify-between items-center">
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Transaction Ref</span>
                                    <span className="text-[11px] font-mono font-bold tracking-tighter">#{payment.receipt_number}</span>
                                </div>
                                <div className="flex justify-between items-center text-primary">
                                    <span className="text-[9px] font-black uppercase tracking-widest">Amount Paid</span>
                                    <span className="text-xl font-black tracking-tighter">${payment.amount.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Payer & Allocation - Tighter Grouping */}
                            <div className="grid grid-cols-2 gap-4 py-2 border-b border-surface-border/50 pb-4">
                                <div className="space-y-1">
                                    <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Issued To</div>
                                    <div className="text-[11px] font-bold truncate">{payment.user.first_name} {payment.user.surname}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Date Issued</div>
                                    <div className="text-[11px] font-bold">{new Date(payment.created_at).toLocaleDateString()}</div>
                                </div>
                                <div className="space-y-1 col-span-2 pt-1">
                                    <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Allocation / Course</div>
                                    <div className="text-[11px] font-bold truncate text-primary">{payment.program?.name || 'Program Enrollment Fee'}</div>
                                </div>
                            </div>

                            {/* Verification Block - More Compact */}
                            <div className="pt-2 text-center flex items-center justify-between gap-6 px-2">
                                <div className="text-left space-y-1 flex-1">
                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Verification</div>
                                    <p className="text-[9px] font-bold text-slate-500 leading-tight">
                                        Scan QR or use code <br/>
                                        <span className="text-primary font-black">{payment.receipt_number?.slice(0, 8) || 'REF-N/A'}</span>
                                    </p>
                                </div>
                                <div className="w-16 h-16 bg-white p-1 rounded-lg border border-surface-border flex items-center justify-center shrink-0 shadow-sm transition-transform hover:scale-105">
                                    <QRCodeSVG value={payment.receipt_number} size={64} level="M" includeMargin={false} />
                                </div>
                            </div>
                        </div>

                        {/* Actions - Print Only logic */}
                        <div className="p-4 bg-surface border-t border-surface-border flex gap-3 print:hidden">
                            <Button
                                variant="outline"
                                className="flex-1 h-12 bg-background border-surface-border text-[9px] font-black uppercase tracking-widest"
                                onClick={handlePrint}
                            >
                                <Printer className="w-4 h-4 mr-2" /> Print Slip
                            </Button>
                            <Button
                                variant="premium"
                                className="flex-1 h-12 text-[9px] font-black uppercase tracking-widest"
                                onClick={handlePrint}
                            >
                                <Download className="w-4 h-4 mr-2" /> Save PDF
                            </Button>
                        </div>
                    </GlassBox>
                </motion.div>
            </div>
            
            {/* Print-only Global Styling */}
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    body * { visibility: hidden; }
                    .print-only, .print-only * { visibility: visible; }
                    #receipt-content, #receipt-content * { visibility: visible; }
                    #receipt-content {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 80mm; /* Common thermal printer width */
                        margin: 0 auto;
                        padding: 10mm;
                    }
                    .glass-box { box-shadow: none !important; border: 1px solid #eee !important; background: white !important; }
                    .text-primary { color: black !important; }
                    .bg-gradient-premium { background: white !important; color: black !important; border-bottom: 2px dashed #ccc; }
                }
            `}} />
        </AnimatePresence>
    );
}
