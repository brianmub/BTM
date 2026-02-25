import { supabase } from './supabase';

export const platformService = {
    /**
     * Fetch all organizations across the platform.
     * This bypasses the typical organization-level filters.
     */
    async getAllOrganizations() {
        const { data, error } = await supabase
            .from('organizations')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            console.error('PlatformService: Error fetching organizations:', error);
            throw error;
        }
        return data;
    },

    /**
     * Update an organization's status (active/suspended).
     */
    async updateOrganizationStatus(
        orgId: string,
        status: {
            is_active?: boolean;
            is_suspended?: boolean;
            suspended_reason?: string | null
        }
    ) {
        const updates: any = { ...status, updated_at: new Date().toISOString() };

        // If suspending, also deactivate
        if (status.is_suspended === true) {
            updates.is_active = false;
            updates.suspended_at = new Date().toISOString();
        } else if (status.is_suspended === false) {
            updates.is_active = true;
            updates.suspended_at = null;
            updates.suspended_reason = null;
        }

        const { data, error } = await supabase
            .from('organizations')
            .update(updates)
            .eq('id', orgId)
            .select()
            .single();

        if (error) {
            console.error('PlatformService: Error updating organization status:', error);
            throw error;
        }
        return data;
    },

    /**
     * Update an organization's details.
     */
    async updateOrganization(orgId: string, updates: Partial<Organization>) {
        const { data, error } = await supabase
            .from('organizations')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', orgId)
            .select()
            .single();

        if (error) {
            console.error('PlatformService: Error updating organization:', error);
            throw error;
        }
        return data;
    },

    /**
     * Delete an organization and all its data.
     * Note: This relies on CASCADE DELETE in the database schema.
     */
    async deleteOrganization(orgId: string) {
        const { error } = await supabase
            .from('organizations')
            .delete()
            .eq('id', orgId);

        if (error) {
            console.error('PlatformService: Error deleting organization:', error);
            throw error;
        }
    },

    /**
     * Fetch all administrators for a specific organization.
     * Useful for choosing an impersonation target.
     */
    async getOrgAdmins(orgId: string) {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('organization_id', orgId)
            .in('role', ['system_admin', 'program_admin']);

        if (error) {
            console.error('PlatformService: Error fetching organization admins:', error);
            throw error;
        }
        return data;
    },

    /**
     * Fetch platform-wide statistics for the dashboard.
     */
    async getPlatformStats() {
        const [orgs, users, programs] = await Promise.all([
            supabase.from('organizations').select('*', { count: 'exact', head: true }),
            supabase.from('users').select('*', { count: 'exact', head: true }),
            supabase.from('programs').select('*', { count: 'exact', head: true })
        ]);

        return {
            totalOrganizations: orgs.count || 0,
            totalUsers: users.count || 0,
            totalPrograms: programs.count || 0
        };
    }
};
