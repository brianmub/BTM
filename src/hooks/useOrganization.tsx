import { useContext } from 'react';
import { TenantContext } from '@/context/TenantContextObject';

export { TenantProvider } from '@/context/TenantContext';

export const useOrganization = () => {
    const context = useContext(TenantContext);
    if (context === undefined) {
        throw new Error('useOrganization must be used within a TenantProvider');
    }
    return context;
};
