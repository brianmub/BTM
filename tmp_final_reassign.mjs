import pg from 'pg';

const connectionString = 'postgresql://postgres.fdivyxnqodzobrlnpsvk:Bethatman123!@aws-1-eu-west-1.pooler.supabase.com:6543/postgres';

async function finalReassign() {
    const client = new pg.Client({
        connectionString,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        
        const orgId = '65ab463c-a3b7-4363-b883-9366e8555938'; 
        console.log(`Final reassignment for ALL programs to org ${orgId}...`);
        
        const res = await client.query('UPDATE programs SET organization_id = $1', [orgId]);
        console.log(`Updated ${res.rowCount} programs.`);

        await client.query("NOTIFY pgrst, 'reload schema';");

    } catch (err) {
        console.error('FINAL UPDATE ERROR:', err);
    } finally {
        await client.end();
    }
}

finalReassign();
