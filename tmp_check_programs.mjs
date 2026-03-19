import pg from 'pg';

const connectionString = 'postgresql://postgres.fdivyxnqodzobrlnpsvk:Bethatman123!@aws-1-eu-west-1.pooler.supabase.com:6543/postgres';

async function checkPrograms() {
    const client = new pg.Client({
        connectionString,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        
        // 1. Check table columns
        console.log('Checking programs table columns...');
        const columns = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'programs';
        `);
        console.log('Columns:', columns.rows.map(c => c.column_name).join(', '));

        // 2. Check total programs count
        const count = await client.query("SELECT count(*) FROM programs;");
        console.log('Total programs:', count.rows[0].count);

        // 3. Check sample data
        const samples = await client.query("SELECT id, name, organization_id FROM programs LIMIT 5;");
        console.log('Sample programs:', samples.rows);

        // 4. Check organizations
        const orgs = await client.query("SELECT id, name, slug FROM organizations;");
        console.log('Connectable organizations:', orgs.rows);

    } catch (err) {
        console.error('Error checking programs:', err);
    } finally {
        await client.end();
    }
}

checkPrograms();
