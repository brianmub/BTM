import { X, Printer, Download, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { GlassBox } from '@/components/ui/Card';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

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

    const handleDownloadPDF = async () => {
        const element = document.getElementById('receipt-content');
        if (!element) return;

        // Hide elements with 'no-pdf' class
        const noPdfElements = element.querySelectorAll('.no-pdf');
        noPdfElements.forEach(el => (el as HTMLElement).style.opacity = '0');

        try {
            const canvas = await html2canvas(element, {
                scale: 3, // Higher scale for better quality
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                windowWidth: element.scrollWidth,
                windowHeight: element.scrollHeight
            });
            
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: [80, 90] // Ultra-compact 'slip' format
            });

            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            
            // Add metadata
            pdf.setProperties({
                title: `Receipt ${payment.receipt_number}`,
                subject: 'Payment Receipt',
                author: organization?.name || 'Kingdom Connect',
                keywords: 'receipt, payment, kingdomconnect',
                creator: 'Kingdom Connect System'
            });

            pdf.save(`receipt-${payment.receipt_number}.pdf`);
        } catch (error) {
            console.error('PDF Generation Error:', error);
        } finally {
            noPdfElements.forEach(el => (el as HTMLElement).style.opacity = '1');
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl"
                />

                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-sm overflow-hidden"
                >
                    <GlassBox id="receipt-content" className="p-0 border-white/10 shadow-[0_32px_128px_-32px_rgba(0,0,0,1)] overflow-hidden bg-background print-only rounded-[1.5rem]">
                        {/* Ultra-Compact Receipt Header */}
                        <div className="bg-gradient-premium p-3 text-center text-white relative overflow-hidden">
                            <div className="absolute -right-4 -top-4 w-16 h-16 bg-white/10 rounded-full blur-2xl" />
                            <div className="flex items-center justify-center gap-3">
                                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-xl border border-white/30 shadow-lg">
                                    <CheckCircle2 className="w-5 h-5 text-white" />
                                </div>
                                <h3 className="text-lg font-united tracking-tighter italic uppercase mt-0.5">Receipt</h3>
                                <button onClick={onClose} className="ml-auto p-1 hover:bg-white/10 rounded-full no-pdf print:hidden">
                                    <X className="w-3 h-3 text-white/50" />
                                </button>
                            </div>
                        </div>

                        {/* Ultra-Compact Body */}
                        <div className="p-3 space-y-3 bg-background text-foreground print:text-black">
                            {/* Org & Address - Single Line Compact */}
                            <div className="text-center border-b border-surface-border pb-2">
                                <div className="text-base font-united text-foreground tracking-tight leading-none mb-1">{organization?.name}</div>
                                <div className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">{organization?.slug}.hq | Harare, Zimbabwe</div>
                            </div>

                            {/* Core TransactionDetails */}
                            <div className="space-y-2 py-1">
                                <div className="flex justify-between items-center text-[7px] font-black text-slate-500 uppercase tracking-widest">
                                    <span>REF: #{payment.receipt_number}</span>
                                    <span>{payment.payment_method}</span>
                                </div>
                                
                                <div className="flex flex-row items-center justify-between py-1.5 px-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest font-united">Amount Paid</span>
                                    <div className="text-xl font-united text-primary tracking-tighter leading-none flex items-start">
                                        <span className="text-xs mt-0.5 mr-0.5 opacity-50">$</span>
                                        {payment.amount.toFixed(2)}
                                    </div>
                                </div>
                            </div>

                            {/* Payer & Allocation - Single Row Grid */}
                            <div className="grid grid-cols-2 gap-4 py-1 border-t border-slate-50">
                                <div className="space-y-0.5">
                                    <div className="text-[6px] font-black text-slate-400 uppercase tracking-widest">Payer</div>
                                    <div className="text-[10px] font-black truncate">{payment.user.first_name} {payment.user.surname}</div>
                                </div>
                                <div className="space-y-0.5 text-right">
                                    <div className="text-[6px] font-black text-slate-400 uppercase tracking-widest">Date</div>
                                    <div className="text-[10px] font-black">{new Date(payment.created_at).toLocaleDateString()}</div>
                                </div>
                            </div>
                            
                            <div className="space-y-0.5 pt-1 border-t border-slate-50">
                                <div className="text-[6px] font-black text-slate-400 uppercase tracking-widest">Allocation</div>
                                <div className="text-[10px] font-bold text-slate-700 leading-tight border-l-2 border-primary pl-2 uppercase truncate">{payment.program?.name || 'General Operational Fund'}</div>
                            </div>

                            {/* Audit & QR - Ultra Tight */}
                            <div className="pt-2 flex items-end justify-between gap-4 border-t border-slate-100">
                                <div className="text-left space-y-1 flex-1">
                                    <div className="text-[6px] font-black text-slate-400 uppercase tracking-widest">Digital Audit Key</div>
                                    <code className="text-[7px] font-black text-primary p-0.5 bg-primary/5 rounded border border-primary/10 block truncate">{payment.receipt_number?.slice(0, 16) || 'N/A'}</code>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="h-4 w-16 border-b border-slate-300 border-dashed" />
                                        <span className="text-[5px] font-black text-slate-400 uppercase tracking-widest">Auth_Sign</span>
                                    </div>
                                </div>
                                <div className="w-10 h-10 bg-white p-0.5 rounded-lg border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
                                    <QRCodeSVG value={payment.receipt_number} size={36} level="H" includeMargin={false} />
                                </div>
                            </div>
                        </div>

                        {/* Ultra Compact Actions */}
                        <div className="p-2 bg-surface/30 border-t border-surface-border/30 flex gap-2 no-pdf print:hidden">
                            <Button
                                variant="outline"
                                className="flex-1 h-9 bg-white border-slate-200 text-[7px] font-black uppercase tracking-widest"
                                onClick={handlePrint}
                            >
                                <Printer className="w-3 h-3 mr-1.5" /> Print
                            </Button>
                            <Button
                                variant="premium"
                                className="flex-1 h-9 text-[7px] font-black uppercase tracking-widest"
                                onClick={handleDownloadPDF}
                            >
                                <Download className="w-3 h-3 mr-1.5" /> PDF
                            </Button>
                        </div>
                    </GlassBox>
                    
                    <button 
                        onClick={onClose}
                        className="w-full mt-2 text-[8px] font-black uppercase tracking-[0.4em] text-slate-500 hover:text-white transition-colors py-1 no-pdf"
                    >
                        Close
                    </button>


                </motion.div>
            </div>
            
            {/* Print-only Global Styling - Hardened for all browsers */}
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    @page { 
                        margin: 0; 
                        size: 80mm auto; 
                    }
                    html, body {
                        background: #fff !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        height: auto !important;
                        width: 80mm !important;
                        overflow: visible !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    body * { 
                        visibility: hidden !important; 
                        margin: 0 !important;
                    }
                    #receipt-content, #receipt-content * { 
                        visibility: visible !important; 
                    }
                    #receipt-content {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 80mm !important;
                        min-height: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        box-shadow: none !important;
                        border: none !important;
                        background: #fff !important;
                        border-radius: 0 !important;
                        display: block !important;
                    }
                    .no-pdf, button, .print-hidden { 
                        display: none !important; 
                        height: 0 !important;
                        width: 0 !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    /* Force colors for thermal print reliability */
                    .text-primary { color: #000 !important; }
                    .bg-gradient-premium { 
                        background: #000 !important; 
                        color: #fff !important; 
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .bg-background, .bg-surface { 
                        background: #fff !important; 
                        color: #000 !important;
                    }
                    .border-surface-border {
                        border-color: #000 !important; /* Higher contrast for thermal */
                        border-style: dashed !important;
                    }
                    * {
                        -webkit-transition: none !important;
                        transition: none !important;
                    }
                }
            `}} />
        </AnimatePresence>
    );
}

