import pg from 'pg';

const connectionString = 'postgresql://postgres.fdivyxnqodzobrlnpsvk:Bethatman123!@aws-1-eu-west-1.pooler.supabase.com:6543/postgres';

async function checkAudit() {
    const client = new pg.Client({
        connectionString,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        
        console.log('--- audit_logs columns ---');
        const res = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'audit_logs'");
        console.log(res.rows);

    } catch (err) {
        console.error('CHECK ERROR:', err);
    } finally {
        await client.end();
    }
}

checkAudit();
