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
        
        console.log('--- enrollments columns ---');
        const res = await client.query("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'enrollments'");
        console.log(res.rows);

        console.log('--- first 5 enrollments ---');
        const data = await client.query("SELECT * FROM enrollments LIMIT 5");
        console.log(data.rows);

    } catch (err) {
        console.error('CHECK ERROR:', err);
    } finally {
        await client.end();
    }
}

checkEnrollments();
