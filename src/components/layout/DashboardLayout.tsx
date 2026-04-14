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
    UsersRound,
    Banknote,
    FileText,
    ShieldAlert,
    Activity
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { cn } from '@/components/ui/Button';
import { ImpersonationBanner } from '@/components/admin/ImpersonationBanner';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { organization, currentProfile: tenantProfile } = useOrganization();
    const { user, profile: authProfile, signOut } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const currentProfile = tenantProfile || authProfile;

    const menuItems = [
        { name: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, path: '/dashboard', roles: ['system_admin', 'program_admin', 'facilitator'] },
        { name: 'Programs', icon: <Calendar className="w-5 h-5" />, path: '/dashboard/programs', roles: ['system_admin', 'program_admin', 'facilitator'] },
        { name: 'Enrollments', icon: <Users className="w-5 h-5" />, path: '/dashboard/enrollments', roles: ['system_admin', 'program_admin', 'facilitator'] },
        { name: 'Users', icon: <Users className="w-5 h-5" />, path: '/dashboard/users', roles: ['system_admin', 'program_admin'] },
        { name: 'Payments', icon: <Banknote className="w-5 h-5" />, path: '/dashboard/payments', roles: ['system_admin', 'program_admin', 'facilitator'] },
        { name: 'Statistics', icon: <TrendingUp className="w-5 h-5" />, path: '/dashboard/analytics', roles: ['system_admin', 'program_admin'] },
        { name: 'System Admin', icon: <ShieldAlert className="w-5 h-5" />, path: '/platform/admin', roles: ['platform_admin'] },
        { name: 'Attendance', icon: <Activity className="w-5 h-5" />, path: '/dashboard/attendance', roles: ['system_admin', 'program_admin', 'facilitator'] },
        { name: 'Cell Groups', icon: <UsersRound className="w-5 h-5" />, path: '/dashboard/cell-groups', roles: ['system_admin', 'program_admin', 'facilitator'] },
        { name: 'Settings', icon: <Settings className="w-5 h-5" />, path: '/dashboard/settings', roles: ['system_admin', 'program_admin'] },
    ];

    const visibleMenuItems = menuItems.filter(item =>
        !item.roles ||
        (currentProfile?.role && (item.roles.includes(currentProfile.role) || currentProfile.role === 'platform_admin'))
    );

    return (
        <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans flex-col">
            <ImpersonationBanner />
            <div className="flex flex-1 overflow-hidden relative">
                {/* Background Accents */}
                <div className="absolute top-0 right-0 w-[30%] h-[30%] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-[30%] h-[30%] bg-pink-500/5 rounded-full blur-[120px] pointer-events-none"></div>

                {/* Sidebar */}
                <aside className="w-72 bg-surface backdrop-blur-xl border-r border-surface-border flex flex-col z-30 relative min-h-full">
                    <div className="p-8 pb-10">
                        <div className="flex items-center space-x-3 mb-12 group cursor-pointer" onClick={() => navigate('/dashboard')}>
                            <div className="w-10 h-10 bg-gradient-premium rounded-xl flex items-center justify-center text-2xl shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
                                ⛪
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-foreground tracking-tight leading-none mb-1">
                                    {organization?.name || 'Kingdom Connect'}
                                </h2>
                                <p className="text-[9px] text-indigo-400 font-black uppercase tracking-[0.2em]">
                                    Ministry Portal
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
                                                ? "text-primary bg-primary/5"
                                                : "text-slate-500 hover:text-foreground hover:bg-surface"
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

                    <div className="mt-auto p-8 border-t border-surface-border bg-surface/20">
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
                            <span>Logout</span>
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 flex flex-col overflow-hidden relative z-10">
                    {/* Header */}
                    <header className="h-24 bg-surface backdrop-blur-md border-b border-surface-border flex items-center justify-between px-10 grow-0 shrink-0">
                        <div className="relative w-full max-w-md group">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 w-4 h-4 group-focus-within:text-indigo-400 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="w-full pl-14 pr-6 py-4 bg-surface border border-surface-border rounded-2xl text-xs font-bold text-foreground placeholder:text-slate-500 focus:bg-white focus:border-primary/30 focus:ring-0 transition-all outline-none"
                            />
                        </div>

                        <div className="flex items-center space-x-8">
                            <button className="relative p-3 text-slate-500 hover:text-foreground hover:bg-surface rounded-xl transition-all">
                                <Bell className="w-5 h-5" />
                                <span className="absolute top-3 right-3 w-2 h-2 bg-pink-500 rounded-full border-2 border-background"></span>
                            </button>

                            <div className="flex items-center space-x-4 border-l pl-8 border-surface-border">
                                <div className="text-right hidden sm:block">
                                    <p className="text-xs font-black text-foreground uppercase tracking-tight leading-none mb-1">
                                        {currentProfile?.first_name ? `${currentProfile.first_name} ${currentProfile.surname}` : 'User'}
                                    </p>
                                    <div className="flex items-center justify-end space-x-1 text-[9px] text-indigo-400 font-black uppercase tracking-widest">
                                        <Sparkles className="w-2.5 h-2.5" />
                                        <span>{organization?.name || 'Kingdom Connect'}</span>
                                    </div>
                                </div>
                                <div
                                    onClick={() => navigate('/dashboard/settings?tab=profile')}
                                    className="w-12 h-12 rounded-2xl bg-gradient-premium p-[1px] shadow-2xl shadow-indigo-500/10 group cursor-pointer transition-transform hover:scale-105 active:scale-95"
                                >
                                    <div className="w-full h-full bg-background rounded-[14px] flex items-center justify-center overflow-hidden">
                                        <User className="w-6 h-6 text-foreground opacity-80" />
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
        </div>
    );
}
