import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Calendar,
    QrCode,
    Trophy,
    Settings,
    LogOut,
    Bell,
    Search,
    TrendingUp,
    Sparkles,
    User,
    Users,
    Banknote,
    FileText
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { cn } from '@/components/ui/Button';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { organization, currentProfile } = useOrganization();
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        { name: 'Overview', icon: <LayoutDashboard className="w-5 h-5" />, path: '/dashboard', roles: ['system_admin', 'program_admin', 'facilitator'] },
        { name: 'Programs', icon: <Calendar className="w-5 h-5" />, path: '/dashboard/programs', roles: ['system_admin', 'program_admin', 'facilitator'] },
        { name: 'Assignments', icon: <FileText className="w-5 h-5" />, path: '/dashboard/assignments', roles: ['system_admin', 'program_admin', 'facilitator'] },
        { name: 'Enrollments', icon: <Users className="w-5 h-5" />, path: '/dashboard/enrollments', roles: ['system_admin', 'program_admin', 'facilitator'] },
        { name: 'Payments', icon: <Banknote className="w-5 h-5" />, path: '/dashboard/payments', roles: ['system_admin', 'program_admin', 'facilitator'] },
        { name: 'Analytics', icon: <TrendingUp className="w-5 h-5" />, path: '/dashboard/analytics', roles: ['system_admin', 'program_admin'] },
        { name: 'QR System', icon: <QrCode className="w-5 h-5" />, path: '/dashboard/qr', roles: ['system_admin', 'program_admin', 'facilitator'] },
        { name: 'Rewards', icon: <Trophy className="w-5 h-5" />, path: '/dashboard/rewards', roles: ['system_admin', 'program_admin'] },
        { name: 'Settings', icon: <Settings className="w-5 h-5" />, path: '/dashboard/settings', roles: ['system_admin', 'program_admin'] },
    ];

    const visibleMenuItems = menuItems.filter(item =>
        !item.roles || (currentProfile?.role && item.roles.includes(currentProfile.role))
    );

    return (
        <div className="flex h-screen bg-slate-950 text-slate-50 overflow-hidden font-sans">
            {/* Background Accents */}
            <div className="absolute top-0 right-0 w-[30%] h-[30%] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[30%] h-[30%] bg-pink-500/5 rounded-full blur-[120px] pointer-events-none"></div>

            {/* Sidebar */}
            <aside className="w-72 bg-slate-900/50 backdrop-blur-xl border-r border-white/5 flex flex-col z-30 relative">
                <div className="p-8 pb-10">
                    <div className="flex items-center space-x-3 mb-12 group cursor-pointer" onClick={() => navigate('/dashboard')}>
                        <div className="w-10 h-10 bg-gradient-premium rounded-xl flex items-center justify-center text-2xl shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
                            ⛪
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-white tracking-tight leading-none mb-1">
                                {organization?.name || 'CP Pro'}
                            </h2>
                            <p className="text-[9px] text-indigo-400 font-black uppercase tracking-[0.2em]">
                                Digital Ministry
                            </p>
                        </div>
                    </div>

                    <nav className="space-y-2">
                        {visibleMenuItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <button
                                    key={item.name}
                                    onClick={() => navigate(item.path)}
                                    className={cn(
                                        "w-full flex items-center space-x-4 px-5 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 relative group",
                                        isActive
                                            ? "text-white"
                                            : "text-slate-500 hover:text-slate-200 hover:bg-white/5"
                                    )}
                                >
                                    {isActive && (
                                        <div className="absolute left-0 w-1 h-6 bg-indigo-500 rounded-r-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                                    )}
                                    <span className={cn("transition-colors duration-300", isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300")}>
                                        {item.icon}
                                    </span>
                                    <span>{item.name}</span>
                                </button>
                            );
                        })}
                    </nav>
                </div>

                <div className="mt-auto p-8 border-t border-white/5 bg-slate-950/20">
                    <button
                        onClick={async () => {
                            try {
                                await signOut();
                                navigate('/login');
                            } catch (error) {
                                console.error('Logout failed:', error);
                                // Force navigation even if API fails
                                navigate('/login');
                            }
                        }}
                        className="w-full flex items-center space-x-4 px-5 py-4 text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-pink-400 hover:bg-pink-500/5 rounded-2xl transition-all duration-300"
                    >
                        <LogOut className="w-5 h-5" />
                        <span>Terminate Session</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden relative z-10">
                {/* Header */}
                <header className="h-24 bg-slate-950/20 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-10 grow-0 shrink-0">
                    <div className="relative w-full max-w-md group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 w-4 h-4 group-focus-within:text-indigo-400 transition-colors" />
                        <input
                            type="text"
                            placeholder="Universal Search..."
                            className="w-full pl-14 pr-6 py-4 bg-white/5 border border-transparent rounded-2xl text-xs font-bold text-white placeholder:text-slate-600 focus:bg-white/10 focus:border-white/10 focus:ring-0 transition-all outline-none"
                        />
                    </div>

                    <div className="flex items-center space-x-8">
                        <button className="relative p-3 text-slate-500 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-3 right-3 w-2 h-2 bg-pink-500 rounded-full border-2 border-slate-950"></span>
                        </button>

                        <div className="flex items-center space-x-4 border-l pl-8 border-white/5">
                            <div className="text-right hidden sm:block">
                                <p className="text-xs font-black text-white uppercase tracking-tight leading-none mb-1">
                                    {currentProfile?.first_name ? `${currentProfile.first_name} ${currentProfile.surname}` : 'Admin User'}
                                </p>
                                <div className="flex items-center justify-end space-x-1 text-[9px] text-indigo-400 font-black uppercase tracking-widest">
                                    <Sparkles className="w-2.5 h-2.5" />
                                    <span>{organization?.name || 'Digital Ministry'}</span>
                                </div>
                            </div>
                            <div
                                onClick={() => navigate('/dashboard/settings?tab=profile')}
                                className="w-12 h-12 rounded-2xl bg-gradient-premium p-[1px] shadow-2xl shadow-indigo-500/20 group cursor-pointer transition-transform hover:scale-105 active:scale-95"
                            >
                                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center overflow-hidden">
                                    <User className="w-6 h-6 text-white opacity-80" />
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                    <div className="max-w-7xl mx-auto h-full">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
