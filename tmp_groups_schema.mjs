import pg from 'pg';

const connectionString = 'postgresql://postgres.fdivyxnqodzobrlnpsvk:Bethatman123!@aws-1-eu-west-1.pooler.supabase.com:6543/postgres';

async function checkSchema() {
    const client = new pg.Client({
        connectionString,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        
        console.log('--- program_groups schema ---');
        const res = await client.query("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'program_groups'");
        console.log(res.rows);

    } catch (err) {
        console.error('ERROR:', err);
    } finally {
        await client.end();
    }
}

checkSchema();
