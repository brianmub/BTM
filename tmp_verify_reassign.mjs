import pg from 'pg';

const connectionString = 'postgresql://postgres.fdivyxnqodzobrlnpsvk:Bethatman123!@aws-1-eu-west-1.pooler.supabase.com:6543/postgres';

async function verifyAndReassign() {
    const client = new pg.Client({
        connectionString,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        
        // 1. Find the REAL ID
        const orgs = await client.query("SELECT id, name FROM organizations");
        console.log('--- ORGANIZATIONS IN DB ---');
        for (const org of orgs.rows) {
            console.log(`ID: [${org.id}] NAME: [${org.name}]`);
            if (org.name === 'ETZ Organization') {
                const targetId = org.id;
                console.log(`FOUND TARGET ID: ${targetId}`);
                
                // 2. Try the update for just ONE program
                console.log('Attempting to update ONE program...');
                const updateRes = await client.query("UPDATE programs SET organization_id = $1 WHERE name = 'Foundation Course' RETURNING *", [targetId]);
                console.log('Update result:', updateRes.rows[0]);
            }
        }
        console.log('--- END ---');

    } catch (err) {
        console.error('VERIFICATION ERROR:', err);
    } finally {
        await client.end();
    }
}

verifyAndReassign();
