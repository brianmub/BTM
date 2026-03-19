import pg from 'pg';

const connectionString = 'postgresql://postgres.fdivyxnqodzobrlnpsvk:Bethatman123!@aws-1-eu-west-1.pooler.supabase.com:6543/postgres';

async function checkLatest() {
    const client = new pg.Client({
        connectionString,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        
        console.log('--- LATEST ENROLLMENTS ---');
        const enrolls = await client.query('SELECT id, user_id, program_id, created_at FROM enrollments ORDER BY created_at DESC LIMIT 5');
        console.log(enrolls.rows);

        console.log('--- LATEST AUDIT LOGS (enrollment_created) ---');
        const audits = await client.query("SELECT id, action, timestamp FROM audit_logs WHERE action = 'enrollment_created' ORDER BY timestamp DESC LIMIT 5");
        console.log(audits.rows);

    } catch (err) {
        console.error('CHECK ERROR:', err);
    } finally {
        await client.end();
    }
}

checkLatest();
