
import React from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Home, Compass, User, RefreshCw, FileText } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { cn } from '@/components/ui/Button';

export function ParticipantLayout({ children }: { children: React.ReactNode }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { orgSlug } = useParams();
    const { organization } = useOrganization();

    // Bottom Navigation Items
    const navItems = [
        { name: 'Home', icon: <Home className="w-6 h-6" />, path: `/portal/${orgSlug}/dashboard` },
        { name: 'Discover', icon: <Compass className="w-6 h-6" />, path: `/portal/${orgSlug}/dashboard/browse` },
        { name: 'Tasks', icon: <FileText className="w-6 h-6" />, path: `/portal/${orgSlug}/dashboard/assignments` },
        { name: 'Profile', icon: <User className="w-6 h-6" />, path: `/portal/${orgSlug}/dashboard/profile` },
    ];

    return (
        <div className="flex flex-col h-screen bg-slate-950 text-slate-50 font-sans overflow-hidden relative">
            {/* Background Ambience */}
            <div className="absolute top-0 left-0 w-full h-[40%] bg-indigo-900/10 blur-[100px] pointer-events-none" />

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto pb-24 custom-scrollbar relative z-10">
                <div className="max-w-md mx-auto min-h-full bg-slate-950 shadow-2xl min-[450px]:border-x min-[450px]:border-white/5">
                    {children}
                </div>
            </main>

            {/* Bottom Navigation Bar */}
            <div className="fixed bottom-0 left-0 w-full z-50 bg-slate-950/80 backdrop-blur-xl border-t border-white/5">
                <div className="max-w-md mx-auto flex justify-around items-center h-20 px-2">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <button
                                key={item.name}
                                onClick={() => navigate(item.path)}
                                className={cn(
                                    "flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-300",
                                    isActive ? "text-indigo-400" : "text-slate-500 hover:text-slate-300"
                                )}
                            >
                                <div className={cn(
                                    "p-1.5 rounded-xl transition-all duration-300",
                                    isActive && "bg-indigo-500/10 transform -translate-y-1"
                                )}>
                                    {item.icon}
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-wider">{item.name}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
