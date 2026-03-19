import pg from 'pg';

const connectionString = 'postgresql://postgres.fdivyxnqodzobrlnpsvk:Bethatman123!@aws-1-eu-west-1.pooler.supabase.com:6543/postgres';

async function getFullID() {
    const client = new pg.Client({
        connectionString,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        
        const res = await client.query("SELECT id, name FROM organizations WHERE name = 'ETZ Organization'");
        console.log('ETZ ORG ID:', res.rows[0].id);

    } catch (err) {
        console.error('Error fetching org:', err);
    } finally {
        await client.end();
    }
}

getFullID();
