import React, { useState, useEffect, createContext } from 'react';
import { supabase } from '@/services/supabase';
import { User } from '@supabase/supabase-js';

export interface AuthContextType {
    user: User | null;
    profile: any | null;
    profiles: any[]; // Changed to array
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
        console.log('AuthContext: Fetching profiles for', userId);

        // Fetch ALL profiles where auth_id matches OR id matches (legacy)
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .or(`auth_id.eq.${userId},id.eq.${userId}`);

        if (error) {
            console.error('AuthContext: Error fetching profiles:', error);
        }

        if (data && data.length > 0) {
            console.log('AuthContext: Profiles loaded:', data);
            setProfiles(data);
            // Default to the first profile for compatibility, but TenantContext should override
            setProfile(data[0]);
        } else {
            console.warn('AuthContext: No profiles found for user', userId);
            setProfile(null);
            setProfiles([]);
        }
    };

    useEffect(() => {
        const initializeAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                const u = session?.user ?? null;
                console.log('AuthContext: Initial session user:', u);
                setUser(u);
                if (u) {
                    await fetchProfile(u.id);
                }
            } catch (err) {
                console.error('AuthContext: Initialization error:', err);
            } finally {
                setLoading(false);
            }
        };

        initializeAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
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

        return () => subscription.unsubscribe();
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
        console.log('AuthContext: Starting impersonation of', targetProfile.email);
        setImpersonatingProfile(targetProfile);
    };

    const stopImpersonating = () => {
        console.log('AuthContext: Stopping impersonation');
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
            {!loading && children}
        </AuthContext.Provider>
    );
}
