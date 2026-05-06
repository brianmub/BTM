import { supabase } from '../lib/supabase';

export interface Broadcast {
    id: string;
    organization_id: string;
    type: 'podcast' | 'news' | 'story';
    title: string;
    description?: string;
    media_url?: string;
    thumbnail_url?: string;
    is_published: boolean;
    published_at?: string;
    created_at: string;
}

export const broadcastService = {
    async getPublishedBroadcasts(organizationId: string): Promise<Broadcast[]> {
        const { data, error } = await supabase
            .from('broadcasts')
            .select('*')
            .eq('organization_id', organizationId)
            .eq('is_published', true)
            .lte('published_at', new Date().toISOString())
            .order('published_at', { ascending: false });

        if (error) {
            console.error('Error fetching broadcasts:', error);
            throw error;
        }
        return data as Broadcast[];
    }
};
