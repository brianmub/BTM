import React, { useState, useEffect, createContext } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

export interface AuthContextType {
    user: User | null;
    profile: any | null;
    profiles: any[];
    loading: boolean;
    refreshProfile: () => Promise<void>;
    signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<any | null>(null);
    const [profiles, setProfiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async (userId: string) => {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .or(`auth_id.eq.${userId},id.eq.${userId}`);

        if (error) {
            console.error('AuthContext: Error fetching profiles:', error);
        }

        if (data && data.length > 0) {
            setProfiles(data);
            setProfile(data[0]);
        } else {
            setProfile(null);
            setProfiles([]);
        }
    };

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            const u = session?.user ?? null;
            setUser(u);
            if (u) fetchProfile(u.id);
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            const u = session?.user ?? null;
            setUser(u);
            if (u) fetchProfile(u.id);
            else {
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

    return (
        <AuthContext.Provider value={{
            user,
            profile,
            profiles,
            loading,
            refreshProfile,
            signOut,
        }}>
            {children}
        </AuthContext.Provider>
    );
}
