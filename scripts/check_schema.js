const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkColumns() {
    console.log('Checking organization table columns...');
    const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching org:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('Columns found:', Object.keys(data[0]));
    } else {
        console.log('No data in organizations table. Trying to insert a dummy to check schema...');
        const { error: insertError } = await supabase
            .from('organizations')
            .insert([{ name: 'Schema Check', slug: 'schema-check-' + Date.now(), contact_email: 'test@example.com' }]);

        if (insertError) {
            console.error('Insert failed (this might reveal missing columns):', insertError);
        } else {
            const { data: newData } = await supabase.from('organizations').select('*').limit(1);
            console.log('Columns found:', Object.keys(newData[0]));
            // Clean up
            await supabase.from('organizations').delete().eq('name', 'Schema Check');
        }
    }
}

checkColumns();
