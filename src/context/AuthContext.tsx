import React, { useState, useEffect, createContext } from 'react';
import { supabase } from '@/services/supabase';
import { User } from '@supabase/supabase-js';

export interface AuthContextType {
    user: User | null;
    profile: any | null;
    profiles: any[];
    loading: boolean;
    refreshProfile: () => Promise<void>;
    signOut: () => Promise<void>;
    impersonateUser: (profile: any) => void;
    stopImpersonating: () => void;
    isImpersonating: boolean;
    originalProfile: any | null;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<any | null>(null);
    const [profiles, setProfiles] = useState<any[]>([]);
    const [impersonatingProfile, setImpersonatingProfile] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async (userId: string) => {
        console.log('AuthContext: fetchProfile starting for', userId);
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .or(`auth_id.eq.${userId},id.eq.${userId}`);

            if (error) throw error;

            if (data && data.length > 0) {
                console.log('AuthContext: Profiles found:', data.length);
                setProfiles(data);
                setProfile(data[0]);
            } else {
                console.warn('AuthContext: No profiles for', userId);
                setProfiles([]);
                setProfile(null);
            }
        } catch (err) {
            console.error('AuthContext: fetchProfile exception:', err);
        }
    };

    useEffect(() => {
        let mounted = true;
        console.log('AuthContext: Provider mounted');

        const initializeAuth = async () => {
            // Fail-safe timeout
            const timer = setTimeout(() => {
                if (mounted && loading) {
                    console.warn('AuthContext: Init timeout hit, forcing unblock');
                    setLoading(false);
                }
            }, 8000);

            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!mounted) return;

                const u = session?.user ?? null;
                console.log('AuthContext: Initial session resolved:', u?.email || 'No Session');
                setUser(u);
                
                if (u) {
                    await fetchProfile(u.id);
                }
            } catch (err) {
                console.error('AuthContext: Init exception:', err);
            } finally {
                clearTimeout(timer);
                if (mounted) {
                    console.log('AuthContext: Init finished, unblocking');
                    setLoading(false);
                }
            }
        };

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('AuthContext: onAuthStateChange event:', event);
            if (!mounted) return;

            const u = session?.user ?? null;
            setUser(u);

            if (u) {
                await fetchProfile(u.id);
            } else {
                setProfile(null);
                setProfiles([]);
            }
            
            setLoading(false);
        });

        initializeAuth();

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        setProfiles([]);
    };

    const refreshProfile = async () => {
        if (user) await fetchProfile(user.id);
    };

    const impersonateUser = (targetProfile: any) => {
        setImpersonatingProfile(targetProfile);
    };

    const stopImpersonating = () => {
        setImpersonatingProfile(null);
    };

    return (
        <AuthContext.Provider value={{
            user,
            profile: impersonatingProfile || profile,
            profiles,
            loading,
            refreshProfile,
            signOut,
            impersonateUser,
            stopImpersonating,
            isImpersonating: !!impersonatingProfile,
            originalProfile: profile
        }}>
            {loading ? (
                <div className="fixed inset-0 bg-slate-950 flex items-center justify-center z-[100] text-white">
                    <div className="flex flex-col items-center gap-6">
                        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(99,102,241,0.3)]"></div>
                        <div className="flex flex-col items-center">
                            <h2 className="text-xl font-black uppercase tracking-tighter mb-2">Kingdom Connect</h2>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] animate-pulse">Initializing Security...</p>
                        </div>
                    </div>
                </div>
            ) : children}
        </AuthContext.Provider>
    );
}
