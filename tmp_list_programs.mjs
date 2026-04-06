import pg from 'pg';

const connectionString = 'postgresql://postgres.fdivyxnqodzobrlnpsvk:Bethatman123!@aws-1-eu-west-1.pooler.supabase.com:6543/postgres';

async function listPrograms() {
    const client = new pg.Client({
        connectionString,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        
        console.log('--- programs ---');
        const res = await client.query('SELECT id, name, organization_id FROM programs');
        console.log(res.rows);

    } catch (err) {
        console.error('ERROR:', err);
    } finally {
        await client.end();
    }
}

listPrograms();
