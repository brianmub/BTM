import pg from 'pg';

const connectionString = 'postgresql://postgres.fdivyxnqodzobrlnpsvk:Bethatman123!@aws-1-eu-west-1.pooler.supabase.com:6543/postgres';

async function listOrgs() {
    const client = new pg.Client({
        connectionString,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        
        const res = await client.query("SELECT id, name, join_code FROM organizations");
        console.log('ORGS_START');
        res.rows.forEach(r => console.log(JSON.stringify(r)));
        console.log('ORGS_END');

    } catch (err) {
        console.error('Error listing orgs:', err);
    } finally {
        await client.end();
    }
}

listOrgs();
