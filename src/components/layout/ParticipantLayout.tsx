import React from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Home, Compass, User, FileText, UsersRound, Banknote, Video } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { cn } from '@/components/ui/Button';

export function ParticipantLayout({ children }: { children: React.ReactNode }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { orgSlug } = useParams();
    const { organization, switchOrganization } = useOrganization();
    const { profile } = useAuth();

    // ── Force correct org based on URL slug ──────────────────────────────────
    React.useEffect(() => {
        if (orgSlug && organization?.slug !== orgSlug) {
            switchOrganization(orgSlug);
        }
    }, [orgSlug]);
    // ─────────────────────────────────────────────────────────────────────────

    const isFacilitator = profile?.role === 'facilitator';

    // Bottom Navigation Items
    const navItems = [
        { name: 'Home', icon: <Home className="w-6 h-6" />, path: `/portal/${orgSlug}/dashboard` },
        { name: 'Media', icon: <Video className="w-6 h-6" />, path: `/portal/${orgSlug}/dashboard/media` },
        { name: 'Discover', icon: <Compass className="w-6 h-6" />, path: `/portal/${orgSlug}/dashboard/browse` },
        { name: 'Payments', icon: <Banknote className="w-6 h-6" />, path: `/portal/${orgSlug}/dashboard/payments` },
        ...(isFacilitator ? [{ name: 'Groups', icon: <UsersRound className="w-6 h-6" />, path: `/portal/${orgSlug}/dashboard/cell-groups` }] : []),
        { name: 'Profile', icon: <User className="w-6 h-6" />, path: `/portal/${orgSlug}/dashboard/profile` },
    ];

    return (
        <div className="flex flex-col h-screen bg-background text-foreground font-sans overflow-hidden relative">
            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto pb-24 custom-scrollbar relative z-10">
                <div className="max-w-md mx-auto min-h-full bg-background shadow-2xl min-[450px]:border-x min-[450px]:border-surface-border">
                    {children}
                </div>
            </main>

            {/* ── UNITED-STYLE BOTTOM NAV ── */}
            <div className="fixed bottom-0 left-0 w-full z-50">
                <div className="max-w-md mx-auto">
                    <div className="bg-foreground/95 backdrop-blur-xl border-t border-white/10 flex justify-around items-center h-20 px-2">
                        {navItems.map((item) => {
                            const isActive = location.pathname === item.path ||
                                (item.path !== `/portal/${orgSlug}/dashboard` && location.pathname.startsWith(item.path));
                            return (
                                <button
                                    key={item.name}
                                    onClick={() => navigate(item.path)}
                                    className={cn(
                                        "flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-300 relative",
                                        isActive ? "text-primary" : "text-slate-500 hover:text-slate-200"
                                    )}
                                >
                                    {isActive && (
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-b-full" />
                                    )}
                                    <div className={cn(
                                        "p-1.5 rounded-xl transition-all duration-300",
                                        isActive && "bg-primary/10"
                                    )}>
                                        {item.icon}
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-widest">{item.name}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
