import pg from 'pg';

const connectionString = 'postgresql://postgres.fdivyxnqodzobrlnpsvk:Bethatman123!@aws-1-eu-west-1.pooler.supabase.com:6543/postgres';

async function investigateFK() {
    const client = new pg.Client({
        connectionString,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        
        // 1. Check Organizations table structure
        console.log('--- organizations columns ---');
        const orgCols = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'organizations'");
        console.log(orgCols.rows);

        // 2. Check Programs table structure
        console.log('--- programs columns ---');
        const progCols = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'programs'");
        console.log(progCols.rows);

        // 3. Find ETZ Org exactly
        const etz = await client.query("SELECT * FROM organizations WHERE name = 'ETZ Organization'");
        console.log('ETZ ORG:', etz.rows[0]);

        // 4. Try UPDATE on just one program with hardcoded values
        if (etz.rows[0]) {
            console.log('Trying manual update...');
            const id = etz.rows[0].id;
            // Use EXPLAIN to see if anything weird is happening
            await client.query("EXPLAIN UPDATE programs SET organization_id = $1 LIMIT 1", [id]);
            console.log('Update experiment completed');
        }

    } catch (err) {
        console.error('INVESTIGATION ERROR:', err);
    } finally {
        await client.end();
    }
}

investigateFK();
