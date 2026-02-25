
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

// We use the service role key if available for deletions, but the anon key might work if RLS is off or if we are using the service role key as the anon key (common in local dev).
// Since the .env probably has the anon key, we'll try that.
const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteOrganizations() {
    const args = process.argv.slice(2);
    const targetSlug = args[0];

    if (!targetSlug) {
        console.error('Usage: node scripts/delete_organization.js <slug> or node scripts/delete_organization.js --all');
        return;
    }

    if (targetSlug === '--all') {
        console.log('DELETING ALL ORGANIZATIONS...');
        // First get all IDs to show what we are deleting
        const { data: orgs } = await supabase.from('organizations').select('id, name');

        if (!orgs || orgs.length === 0) {
            console.log('No organizations found to delete.');
            return;
        }

        console.log(`Found ${orgs.length} organizations. Deleting...`);

        const { error } = await supabase
            .from('organizations')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete everything

        if (error) {
            console.error('Error deleting organizations:', error);
        } else {
            console.log('All organizations deleted successfully.');
        }
    } else {
        console.log(`Deleting organization with slug: ${targetSlug}...`);
        const { error } = await supabase
            .from('organizations')
            .delete()
            .eq('slug', targetSlug);

        if (error) {
            console.error('Error deleting organization:', error);
        } else {
            console.log(`Organization "${targetSlug}" deleted successfully.`);
        }
    }
}

deleteOrganizations();
