import { createContext } from 'react';
import { Organization } from '@/types';

export interface TenantContextType {
    organization: Organization | null;
    currentProfile: any | null;
    loading: boolean;
    error: string | null;
    switchOrganization: (slug: string) => Promise<void>;
}

export const TenantContext = createContext<TenantContextType | undefined>(undefined);
