import pg from 'pg';

const connectionString = 'postgresql://postgres.fdivyxnqodzobrlnpsvk:Bethatman123!@aws-1-eu-west-1.pooler.supabase.com:6543/postgres';

async function checkTriggers() {
    const client = new pg.Client({
        connectionString,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        
        console.log('--- enrollments triggers ---');
        const res = await client.query("SELECT trigger_name, event_manipulation, event_object_table, action_statement FROM information_schema.triggers WHERE event_object_table = 'enrollments'");
        console.log(res.rows);

    } catch (err) {
        console.error('CHECK ERROR:', err);
    } finally {
        await client.end();
    }
}

checkTriggers();
