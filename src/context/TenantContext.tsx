import React, { createContext, useState, useEffect } from 'react';
import { Organization } from '@/types';
import { supabase } from '@/services/supabase';

export interface TenantContextType {
    organization: Organization | null;
    currentProfile: any | null; // Profile for the current organization
    loading: boolean;
    error: string | null;
    switchOrganization: (slug: string) => Promise<void>;
}

export const TenantContext = createContext<TenantContextType | undefined>(undefined);

import { useAuth } from '@/hooks/useAuth';

export function TenantProvider({ children }: { children: React.ReactNode }) {
    const { user, profiles, loading: authLoading } = useAuth();
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [currentProfile, setCurrentProfile] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (authLoading) {
            console.log('TenantContext: Auth is loading...');
            return;
        }

        console.log('TenantContext: Auth loaded. Profiles:', profiles);

        // In a real production app, we would detect the slug from the subdomain
        // For local dev, we check the 'org_slug' query param or localStorage
        fetchOrg();
    }, [authLoading, profiles]); // Dependency on profiles instead of profile.organization_id

    const switchOrganization = async (newSlug: string) => {
        console.log('TenantContext: Switching organization to:', newSlug);
        localStorage.setItem('active_org_slug', newSlug);
        // Force fetch with new slug
        await fetchOrg(newSlug);
    };

    async function fetchOrg(slugOverride?: string | null) {
        setLoading(true);

        // Priority: 1. Slug Override, 2. URL Param, 3. Impersonated Org, 4. LocalStorage
        const effectiveSlug = slugOverride ||
            new URLSearchParams(window.location.search).get('org') ||
            (currentProfile?.organization_id ? null : localStorage.getItem('active_org_slug'));

        try {
            // Fetch all columns to satisfy the Organization interface
            let query = supabase.from('organizations').select('*');

            if (effectiveSlug) {
                console.log('TenantContext: Fetching by slug:', effectiveSlug);
                query = query.eq('slug', effectiveSlug);
            } else if (currentProfile?.organization_id) {
                // If we have an impersonated/switched profile, use its org ID directly
                console.log('TenantContext: Fetching by ID from currentProfile:', currentProfile.organization_id);
                query = query.eq('id', currentProfile.organization_id);
            } else if (profiles && profiles.length > 0) {
                console.log('TenantContext: Fetching by ID from first profile:', profiles[0].organization_id);
                query = query.eq('id', profiles[0].organization_id);
            } else {
                console.warn('TenantContext: No slug or organization_id found.');
                setLoading(false);
                return;
            }

            const { data, error } = await query.single();
            console.log('TenantContext: Fetch result:', data, error);

            if (error) throw error;
            setOrganization(data as Organization);

            // If we found the org and it doesn't match the current profile, we might need to sync
            if (data && currentProfile && currentProfile.organization_id !== data.id) {
                // During impersonation, currentProfile is already set by AuthContext
                // This block handles profile matching if needed
                console.log('TenantContext: Org sync with currentProfile');
            } else if (data && profiles && profiles.length > 0) {
                const match = profiles.find(p => p.organization_id === data.id);
                if (match) {
                    console.log('TenantContext: Set currentProfile:', match);
                    setCurrentProfile(match);
                }
            }

            if (data?.slug) {
                localStorage.setItem('active_org_slug', data.slug);
            }
        } catch (err: any) {
            console.error('TenantContext: Error fetching organization:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <TenantContext.Provider value={{ organization, currentProfile: currentProfile, loading, error, switchOrganization }}>
            {loading ? (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-[100]">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Syncing Organization...</p>
                    </div>
                </div>
            ) : (
                children
            )}
        </TenantContext.Provider>
    );
}
