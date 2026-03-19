import pg from 'pg';

const connectionString = 'postgresql://postgres.fdivyxnqodzobrlnpsvk:Bethatman123!@aws-1-eu-west-1.pooler.supabase.com:6543/postgres';

async function getETZOrg() {
    const client = new pg.Client({
        connectionString,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        
        const res = await client.query("SELECT id, name FROM organizations WHERE name ILIKE '%ETZ%'");
        console.log('ETZ ORG:', res.rows[0]);

    } catch (err) {
        console.error('Error fetching org:', err);
    } finally {
        await client.end();
    }
}

getETZOrg();
