import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function seed() {
    console.log('Seeding Platform Administration Organization...');

    const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert([{
            name: 'Platform Global',
            slug: 'admin',
            contact_email: 'admin@kingdomconnect.app',
            primary_color: '#4F46E5',
            secondary_color: '#10B981',
            is_active: true
        }])
        .select()
        .single();

    if (orgError) {
        if (orgError.code === '23505') {
            console.log('Platform organization already exists.');
        } else {
            console.error('Error creating platform org:', orgError);
            return;
        }
    }

    console.log('Platform organization seeded successfully.');
}

seed();
