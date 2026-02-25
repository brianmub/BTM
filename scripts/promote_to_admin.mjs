import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function promote(email) {
    if (!email) {
        console.error('Please provide an email: node scripts/promote_to_admin.mjs your@email.com');
        return;
    }

    console.log(`Promoting ${email} to Platform Admin...`);

    // 1. Find the user
    const { data: user, error: findError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

    if (findError || !user) {
        console.error('User not found. Please ensure the user has signed up first.');
        return;
    }

    // 2. Update role
    const { error: updateError } = await supabase
        .from('users')
        .update({ role: 'platform_admin' })
        .eq('id', user.id);

    if (updateError) {
        console.error('Update failed:', updateError);
        return;
    }

    console.log(`SUCCESS! ${email} is now a Platform Admin.`);
}

promote(process.argv[2]);
