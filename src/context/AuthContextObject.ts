import { createContext } from 'react';
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
    deleteAccount: () => Promise<void>;
    isImpersonating: boolean;
    originalProfile: any | null;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
