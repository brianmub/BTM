import { supabase } from './supabase';
import { Broadcast } from '../types';

export const broadcastService = {
    async getBroadcasts(organizationId: string): Promise<Broadcast[]> {
        const { data, error } = await supabase
            .from('broadcasts')
            .select('*')
            .eq('organization_id', organizationId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as Broadcast[];
    },

    async getPublishedBroadcasts(organizationId: string): Promise<Broadcast[]> {
        const { data, error } = await supabase
            .from('broadcasts')
            .select('*')
            .eq('organization_id', organizationId)
            .eq('is_published', true)
            .lte('published_at', new Date().toISOString())
            .order('published_at', { ascending: false });

        if (error) throw error;
        return data as Broadcast[];
    },

    async createBroadcast(broadcast: Partial<Broadcast>): Promise<Broadcast> {
        const { data, error } = await supabase
            .from('broadcasts')
            .insert([broadcast])
            .select()
            .single();

        if (error) throw error;
        return data as Broadcast;
    },

    async updateBroadcast(id: string, updates: Partial<Broadcast>): Promise<Broadcast> {
        const { data, error } = await supabase
            .from('broadcasts')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Broadcast;
    },

    async deleteBroadcast(id: string): Promise<void> {
        const { error } = await supabase
            .from('broadcasts')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async uploadMedia(file: File, path: string): Promise<string> {
        const { data, error } = await supabase.storage
            .from('broadcasts')
            .upload(path, file, { cacheControl: '3600', upsert: true });

        if (error) throw error;

        const { data: publicUrlData } = supabase.storage
            .from('broadcasts')
            .getPublicUrl(data.path);

        return publicUrlData.publicUrl;
    }
};
