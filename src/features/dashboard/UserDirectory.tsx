import { UserRolesList } from '../settings/UserRolesList';
import { Users, Search, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';

export function UserDirectory() {
    return (
        <div className="space-y-12 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4 text-primary animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Organizational Identity</span>
                    </div>
                    <h1 className="text-4xl font-black text-foreground tracking-tight uppercase italic">
                        User Directory
                    </h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">
                        Global access control and profile management
                    </p>
                </motion.div>
                
                <div className="flex gap-4">
                    <Button variant="united" className="h-14 px-8 bg-surface border-surface-border text-slate-500" onClick={() => window.location.reload()}>
                        <RefreshCw className="w-4 h-4 mr-3" /> Sync Table
                    </Button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="bg-surface border border-surface-border rounded-[32px] p-8 shadow-2xl">
                <UserRolesList />
            </div>
        </div>
    );
}
