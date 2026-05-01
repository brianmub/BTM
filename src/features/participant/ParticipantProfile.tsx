
import { useAuth } from '@/hooks/useAuth';
import { GlassBox } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LogOut, User, Mail, Phone, Shield, Home, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function ParticipantProfile() {
    const { profile, signOut, deleteAccount } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await signOut();
        navigate('/')
    };

    const handleDeleteAccount = async () => {
        const confirmed = window.confirm(
            "Are you sure you want to delete your account? \n\n" +
            "This will permanently remove your profile and all your data. This action cannot be undone."
        );
        
        if (confirmed) {
            try {
                await deleteAccount();
                navigate('/');
            } catch (error: any) {
                alert(error.message || "Failed to delete account.");
            }
        }
    };

    return (
        <div className="p-6 space-y-8">
            <div className="space-y-1 pt-6 text-center">
                <div className="w-20 h-20 mx-auto bg-gradient-premium rounded-full flex items-center justify-center text-3xl shadow-xl shadow-primary/20 mb-4 text-white">
                    {profile?.first_name?.charAt(0)}
                </div>
                <h1 className="text-2xl font-black text-foreground uppercase tracking-tight">
                    {profile?.first_name} {profile?.surname}
                </h1>
                <p className="text-slate-500 text-sm font-medium">{profile?.email}</p>
                <div className="inline-block px-3 py-1 rounded-full bg-primary/5 border border-primary/20 text-[10px] font-black uppercase tracking-widest text-primary mt-2">
                    Participant
                </div>
            </div>

            <div className="space-y-4">
                <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Personal Information</h2>
                <GlassBox className="space-y-0 p-0 overflow-hidden bg-surface border-surface-border shadow-xl">
                    <div className="p-4 border-b border-surface-border flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center text-slate-400">
                                <User className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Full Name</p>
                                <p className="text-sm text-foreground font-medium">{profile?.first_name} {profile?.surname}</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 border-b border-surface-border flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center text-slate-400">
                                <Mail className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email Address</p>
                                <p className="text-sm text-foreground font-medium">{profile?.email}</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 border-b border-surface-border flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center text-slate-400">
                                <Phone className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Phone</p>
                                <p className="text-sm text-foreground font-medium">{profile?.phone_number || 'Not set'}</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 border-b border-surface-border flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center text-slate-400">
                                <Home className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Residential Address</p>
                                <p className="text-sm text-foreground font-medium">{profile?.residential_address || 'Not set'}</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 border-b border-surface-border flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center text-slate-400">
                                <Shield className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Church / Ministry</p>
                                <p className="text-sm text-foreground font-medium">{profile?.church_name || 'Not set'}</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 border-b border-surface-border flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center text-slate-400">
                                <Heart className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Marital Status</p>
                                <p className="text-sm text-foreground font-medium capitalize">{profile?.marital_status || 'Not set'}</p>
                            </div>
                        </div>
                    </div>
                </GlassBox>
            </div>

            <div className="space-y-4">
                <Button
                    variant="outline"
                    className="w-full border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300 h-14 font-black uppercase tracking-widest"
                    onClick={handleLogout}
                >
                    <LogOut className="w-4 h-4 mr-2" /> Log Out
                </Button>

                <button
                    onClick={handleDeleteAccount}
                    className="w-full text-center text-[10px] font-black uppercase tracking-[0.2em] text-red-500/60 hover:text-red-500 transition-colors py-2"
                >
                    Delete Account
                </button>
            </div>

            <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest pt-10">
                Version 1.0.0
            </p>
        </div>
    );
}
