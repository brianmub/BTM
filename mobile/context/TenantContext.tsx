import React, { createContext, useState, useEffect } from 'react';
import { Organization } from '../lib/types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import * as SecureStore from 'expo-secure-store';

export interface TenantContextType {
    organization: Organization | null;
    currentProfile: any | null;
    loading: boolean;
    error: string | null;
    switchOrganization: (slug: string) => Promise<void>;
}

export const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: React.ReactNode }) {
    const { user, profiles, loading: authLoading } = useAuth();
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [currentProfile, setCurrentProfile] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (authLoading) return;
        fetchOrg();
    }, [authLoading, profiles]);

    const switchOrganization = async (newSlug: string) => {
        await SecureStore.setItemAsync('active_org_slug', newSlug);
        await fetchOrg(newSlug);
    };

    async function fetchOrg(slugOverride?: string | null) {
        setLoading(true);

        try {
            const savedSlug = await SecureStore.getItemAsync('active_org_slug');
            const effectiveSlug = slugOverride || savedSlug;

            let query = supabase.from('organizations').select('*');

            if (effectiveSlug) {
                query = query.eq('slug', effectiveSlug);
            } else if (profiles && profiles.length > 0) {
                query = query.eq('id', profiles[0].organization_id);
            } else {
                setLoading(false);
                return;
            }

            const { data, error } = await query.single();

            if (error) throw error;
            setOrganization(data);

            if (data && profiles && profiles.length > 0) {
                const match = profiles.find((p: any) => p.organization_id === data.id);
                if (match) {
                    setCurrentProfile(match);
                }
            }

            if (data?.slug) {
                await SecureStore.setItemAsync('active_org_slug', data.slug);
            }
        } catch (err: any) {
            console.error('TenantContext: Error fetching organization:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <TenantContext.Provider value={{ organization, currentProfile, loading, error, switchOrganization }}>
            {children}
        </TenantContext.Provider>
    );
}
