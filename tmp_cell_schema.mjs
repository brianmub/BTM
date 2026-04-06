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
        
        console.log('--- cell_groups schema ---');
        const res = await client.query("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'cell_groups'");
        console.log(res.rows);

        console.log('--- cell_group_members schema ---');
        const members = await client.query("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'cell_group_members'");
        console.log(members.rows);

    } catch (err) {
        console.error('ERROR:', err);
    } finally {
        await client.end();
    }
}

checkSchema();
