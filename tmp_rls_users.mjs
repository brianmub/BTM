import pg from 'pg';

const connectionString = 'postgresql://postgres.fdivyxnqodzobrlnpsvk:Bethatman123!@aws-1-eu-west-1.pooler.supabase.com:6543/postgres';

async function checkRLS() {
    const client = new pg.Client({
        connectionString,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        
        console.log('--- USERS (Profiles) RLS ---');
        const res = await client.query("SELECT * FROM pg_policies WHERE tablename = 'users'");
        console.log(res.rows);

        const resTab = await client.query("SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'users'");
        console.log(resTab.rows);

    } catch (err) {
        console.error('ERROR:', err);
    } finally {
        await client.end();
    }
}

checkRLS();
