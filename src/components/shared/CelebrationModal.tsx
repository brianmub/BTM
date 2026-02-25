import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Sparkles, X, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import confetti from 'canvas-confetti';
import { useEffect } from 'react';

interface CelebrationModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    subtitle: string;
    points?: number;
    badge?: string;
}

export function CelebrationModal({ isOpen, onClose, title, subtitle, points = 50, badge = 'Signed' }: CelebrationModalProps) {
    useEffect(() => {
        if (isOpen) {
            const duration = 3 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

            const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

            const interval: any = setInterval(function () {
                const timeLeft = animationEnd - Date.now();

                if (timeLeft <= 0) {
                    return clearInterval(interval);
                }

                const particleCount = 50 * (timeLeft / duration);
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
            }, 250);

            return () => clearInterval(interval);
        }
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-background/90 backdrop-blur-xl"
                    />

                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative w-full max-w-lg bg-surface border border-primary/20 rounded-[40px] shadow-2xl overflow-hidden p-8 text-center"
                    >
                        {/* Background Glow */}
                        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />

                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 p-2 rounded-full bg-background/50 hover:bg-background text-slate-400 hover:text-foreground transition-all"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="relative z-10 space-y-8 py-6">
                            <motion.div
                                initial={{ y: -20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="w-24 h-24 bg-primary rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-primary/40 rotate-12"
                            >
                                <Trophy className="w-12 h-12 text-white" />
                            </motion.div>

                            <div className="space-y-2">
                                <motion.h2
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                    className="text-4xl font-black text-foreground uppercase tracking-tighter leading-none"
                                >
                                    {title}
                                </motion.h2>
                                <motion.p
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.4 }}
                                    className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em]"
                                >
                                    {subtitle}
                                </motion.p>
                            </div>

                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="flex justify-center gap-4"
                            >
                                <div className="px-6 py-4 bg-background border border-surface-border rounded-2xl text-center">
                                    <div className="flex items-center gap-2 text-primary mb-1 justify-center">
                                        <Star className="w-4 h-4 fill-primary" />
                                        <span className="text-xl font-black text-foreground">+{points}</span>
                                    </div>
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Faith Points</p>
                                </div>
                                <div className="px-6 py-4 bg-background border border-surface-border rounded-2xl text-center">
                                    <div className="flex items-center gap-2 text-emerald-500 mb-1 justify-center">
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span className="text-xl font-black text-foreground">{badge}</span>
                                    </div>
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Achievement</p>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.6 }}
                            >
                                <Button
                                    variant="premium"
                                    className="w-full h-16 rounded-2xl text-base font-black uppercase tracking-widest shadow-xl shadow-primary/20"
                                    onClick={onClose}
                                >
                                    <Sparkles className="w-5 h-5 mr-3" /> Enter Training Ground
                                </Button>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
