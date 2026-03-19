import pg from 'pg';

const connectionString = 'postgresql://postgres.fdivyxnqodzobrlnpsvk:Bethatman123!@aws-1-eu-west-1.pooler.supabase.com:6543/postgres';

async function diagnoseVisibility() {
    const client = new pg.Client({
        connectionString,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        
        // 1. Find Org by Join Code
        const orgRes = await client.query("SELECT id, name, slug FROM organizations WHERE join_code = 'QDR3LG';");
        if (orgRes.rows.length === 0) {
            console.log('No organization found for code QDR3LG');
            return;
        }
        const org = orgRes.rows[0];
        console.log('Found Organization:', org);

        // 2. Count Programs for this Org
        const progCount = await client.query("SELECT count(*) FROM programs WHERE organization_id = $1;", [org.id]);
        console.log(`Found ${progCount.rows[0].count} programs for this organization.`);

        // 3. List Programs for this Org
        const progs = await client.query("SELECT id, name, is_active FROM programs WHERE organization_id = $1;", [org.id]);
        console.log('Programs:', progs.rows);

        // 4. Check for any "Global" programs (if applicable, though unlikely)
        // (Just a sanity check)

    } catch (err) {
        console.error('Error diagnosing visibility:', err);
    } finally {
        await client.end();
    }
}

diagnoseVisibility();
