-- Create the broadcasts table
CREATE TABLE IF NOT EXISTS public.broadcasts (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('podcast', 'news', 'story')),
    title TEXT NOT NULL,
    description TEXT,
    media_url TEXT,
    thumbnail_url TEXT,
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- Row Level Security
ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view broadcasts in their organization"
    ON public.broadcasts
    FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM public.users WHERE id = auth.uid()
    ));

CREATE POLICY "Platform and program admins can insert broadcasts"
    ON public.broadcasts
    FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM public.users 
            WHERE id = auth.uid() AND role IN ('platform_admin', 'program_admin', 'system_admin')
        )
    );

CREATE POLICY "Platform and program admins can update broadcasts"
    ON public.broadcasts
    FOR UPDATE
    USING (
        organization_id IN (
            SELECT organization_id FROM public.users 
            WHERE id = auth.uid() AND role IN ('platform_admin', 'program_admin', 'system_admin')
        )
    );

CREATE POLICY "Platform and program admins can delete broadcasts"
    ON public.broadcasts
    FOR DELETE
    USING (
        organization_id IN (
            SELECT organization_id FROM public.users 
            WHERE id = auth.uid() AND role IN ('platform_admin', 'program_admin', 'system_admin')
        )
    );

-- Create a storage bucket for broadcast media if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('broadcasts', 'broadcasts', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Broadcast media is publicly accessible"
    ON storage.objects FOR SELECT
    USING ( bucket_id = 'broadcasts' );

CREATE POLICY "Admins can upload broadcast media"
    ON storage.objects FOR INSERT
    WITH CHECK ( bucket_id = 'broadcasts' AND auth.role() = 'authenticated' );

CREATE POLICY "Admins can update broadcast media"
    ON storage.objects FOR UPDATE
    USING ( bucket_id = 'broadcasts' AND auth.role() = 'authenticated' );

CREATE POLICY "Admins can delete broadcast media"
    ON storage.objects FOR DELETE
    USING ( bucket_id = 'broadcasts' AND auth.role() = 'authenticated' );
