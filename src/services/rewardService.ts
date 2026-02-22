import { supabase } from './supabase';

export const rewardService = {
    async getBadges(organizationId: string) {
        const { data, error } = await supabase
            .from('badges')
            .select('*')
            .eq('organization_id', organizationId)
            .order('sort_order', { ascending: true });

        if (error) throw error;
        return data as any[];
    },

    async getRewardsStats(organizationId: string) {
        const [earners, totalBadges] = await Promise.all([
            supabase.from('user_badges').select('user_id', { count: 'exact', head: true }).eq('organization_id', organizationId),
            supabase.from('user_badges').select('*', { count: 'exact', head: true }).eq('organization_id', organizationId)
        ]);

        return {
            activeEarners: earners.count || 0,
            totalBadgesAwarded: totalBadges.count || 0,
            protocolAdherence: 94
        };
    },

    async createBadge(badge: any) {
        const { data, error } = await supabase
            .from('badges')
            .insert([badge])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async getUserBadges(userId: string) {
        const { data, error } = await supabase
            .from('user_badges')
            .select(`
                *,
                badges (*)
            `)
            .eq('user_id', userId);

        if (error) throw error;
        return data;
    },

    async getCertificates(userId: string) {
        const { data, error } = await supabase
            .from('certificates')
            .select(`
                *,
                programs (name)
            `)
            .eq('user_id', userId);

        if (error) throw error;
        return data;
    },

    async awardBadge(userId: string, badgeId: string) {
        // Check if already earned
        const { data: existing } = await supabase
            .from('user_badges')
            .select('*')
            .eq('user_id', userId)
            .eq('badge_id', badgeId)
            .single();

        if (existing) return existing;

        const { data, error } = await supabase
            .from('user_badges')
            .insert([{ user_id: userId, badge_id: badgeId }])
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};
