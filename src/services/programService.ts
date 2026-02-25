import { supabase } from './supabase';
import { Program } from '@/types';

export const programService = {
    async getPrograms(organizationId: string) {
        const { data, error } = await supabase
            .from('programs')
            .select('*')
            .eq('organization_id', organizationId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as Program[];
    },

    async getProgramById(id: string) {
        const { data, error } = await supabase
            .from('programs')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as Program;
    },

    async createProgram(program: Partial<Program>) {
        const { data, error } = await supabase
            .from('programs')
            .insert([program])
            .select()
            .single();

        if (error) throw error;
        return data as Program;
    },

    async updateProgram(id: string, updates: Partial<Program>) {
        const { data, error } = await supabase
            .from('programs')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Program;
    },

    async deleteProgram(id: string) {
        const { error } = await supabase
            .from('programs')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async enrollInProgram(programId: string, userId: string, organizationId: string, paymentStatus: 'paid' | 'pending' = 'paid') {
        // Step 1: Insert with 'pending' — the only value the DB constraint allows on initial insert
        const { data, error } = await supabase
            .from('enrollments')
            .insert([{
                program_id: programId,
                user_id: userId,
                organization_id: organizationId,
                status: 'pending',
                payment_status: paymentStatus,
                enrolled_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) throw error;

        // Step 2: Immediately promote to 'active'
        await supabase
            .from('enrollments')
            .update({ status: 'active' })
            .eq('id', data.id);

        // Auto-award 'first_step' badge if this is their first enrollment
        await programService.awardBadgeIfNeeded(userId, 'first_step', organizationId);

        return data;
    },

    /**
     * Awards a badge to a user — idempotent (safe to call multiple times).
     * Silently ignores duplicate errors.
     */
    async awardBadgeIfNeeded(userId: string, badgeId: string, organizationId: string) {
        try {
            // Check if user already has this badge
            const { data: existing } = await supabase
                .from('user_badges')
                .select('id')
                .eq('user_id', userId)
                .eq('badge_id', badgeId)
                .maybeSingle();

            if (existing) return; // Already awarded

            await supabase.from('user_badges').insert([{
                user_id: userId,
                badge_id: badgeId,
                organization_id: organizationId,
                awarded_at: new Date().toISOString()
            }]);
        } catch (err) {
            // Silently ignore — badge table may not exist yet, graceful degradation
            console.warn('Badge award skipped (table may not exist):', err);
        }
    },

    /**
     * Returns a list of badge IDs earned by the user.
     */
    async getUserBadges(userId: string): Promise<string[]> {
        try {
            const { data } = await supabase
                .from('user_badges')
                .select('badge_id')
                .eq('user_id', userId);
            return (data || []).map((b: any) => b.badge_id);
        } catch {
            return [];
        }
    },

    /**
     * Computes Faith XP for a user from enrollments + badges.
     */
    async getUserXP(userId: string): Promise<number> {
        try {
            const [{ count: enrollCount }, badges] = await Promise.all([
                supabase.from('enrollments').select('id', { count: 'exact', head: true }).eq('user_id', userId),
                programService.getUserBadges(userId)
            ]);
            return ((enrollCount || 0) * 50) + (badges.length * 25);
        } catch {
            return 0;
        }
    }
};
