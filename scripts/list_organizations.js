
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env file');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function listOrganizations() {
    console.log('Fetching organizations...');
    const { data, error } = await supabase
        .from('organizations')
        .select('id, name, slug, contact_email, created_at')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching organizations:', error);
    } else {
        console.log('Organizations in database:');
        console.table(data);
        console.log(`Total: ${data.length}`);
    }
}

listOrganizations();
