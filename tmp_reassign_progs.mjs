import pg from 'pg';

const connectionString = 'postgresql://postgres.fdivyxnqodzobrlnpsvk:Bethatman123!@aws-1-eu-west-1.pooler.supabase.com:6543/postgres';

async function reassignPrograms() {
    const client = new pg.Client({
        connectionString,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        
        // Use the DEFINITIVE ID from the list
        const orgId = '65ab463c-a3b7-4363-b883-9366e8555938'; 
        console.log(`Reassigning all existing programs to organization ${orgId}...`);
        
        const res = await client.query('UPDATE programs SET organization_id = $1 WHERE organization_id IS NULL OR organization_id != $1', [orgId]);
        console.log(`Updated ${res.rowCount} programs.`);

        // Force reload
        await client.query("NOTIFY pgrst, 'reload schema';");
        console.log('Programs reassigned successfully!');

    } catch (err) {
        console.error('Error reassigning programs:', err);
    } finally {
        await client.end();
    }
}

reassignPrograms();
