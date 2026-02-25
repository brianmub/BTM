import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { ShieldAlert, LogOut, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function ImpersonationBanner() {
    const { isImpersonating, stopImpersonating, profile, originalProfile } = useAuth();

    if (!isImpersonating) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -50, opacity: 0 }}
                className="bg-amber-500 text-white px-4 py-2 flex items-center justify-between sticky top-0 z-[1000] shadow-lg"
            >
                <div className="flex items-center space-x-3 overflow-hidden">
                    <div className="bg-white/20 p-1.5 rounded-lg flex-shrink-0">
                        <ShieldAlert className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center md:space-x-2 text-[11px] font-black uppercase tracking-widest whitespace-nowrap overflow-hidden">
                        <span>Impersonation Mode:</span>
                        <span className="bg-white/20 px-2 py-0.5 rounded flex items-center truncate max-w-[200px]">
                            Viewing as {profile?.email}
                        </span>
                        <span className="hidden md:inline opacity-60">|</span>
                        <span className="opacity-80">Original Identity: {originalProfile?.email}</span>
                    </div>
                </div>

                <Button
                    variant="premium"
                    size="sm"
                    className="h-8 py-0 px-3 bg-white text-amber-600 hover:bg-white/90 text-[10px] font-black uppercase tracking-widest shadow-sm flex-shrink-0"
                    onClick={stopImpersonating}
                >
                    <LogOut className="w-3 h-3 mr-2" /> Stop Session
                </Button>
            </motion.div>
        </AnimatePresence>
    );
}
