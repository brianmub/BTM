import pg from 'pg';

const connectionString = 'postgresql://postgres.fdivyxnqodzobrlnpsvk:Bethatman123!@aws-1-eu-west-1.pooler.supabase.com:6543/postgres';

async function checkOrphans() {
    const client = new pg.Client({
        connectionString,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        
        const res = await client.query('SELECT count(*) FROM enrollments WHERE organization_id IS NULL');
        console.log('Null Org Enrollments:', res.rows[0].count);

        const res2 = await client.query('SELECT count(*) FROM enrollments');
        console.log('Total Enrollments:', res2.rows[0].count);

        const res3 = await client.query(`
            SELECT e.id, e.organization_id, o.name as org_name
            FROM enrollments e
            LEFT JOIN organizations o ON e.organization_id = o.id
            LIMIT 10
        `);
        console.log('Sample joins:', res3.rows);

    } catch (err) {
        console.error('ERROR:', err);
    } finally {
        await client.end();
    }
}

checkOrphans();
