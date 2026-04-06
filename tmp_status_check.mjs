import pg from 'pg';

const connectionString = 'postgresql://postgres.fdivyxnqodzobrlnpsvk:Bethatman123!@aws-1-eu-west-1.pooler.supabase.com:6543/postgres';

async function checkEnrollments() {
    const client = new pg.Client({
        connectionString,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        
        console.log('--- enrollments with status ---');
        const res = await client.query('SELECT id, status, organization_id, user_id, program_id FROM enrollments');
        console.log(res.rows);

        const res2 = await client.query('SELECT * FROM organizations');
        console.log('--- organizations ---');
        console.log(res2.rows);

    } catch (err) {
        console.error('ERROR:', err);
    } finally {
        await client.end();
    }
}

checkEnrollments();
