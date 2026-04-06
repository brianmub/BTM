import pg from 'pg';

const connectionString = 'postgresql://postgres.fdivyxnqodzobrlnpsvk:Bethatman123!@aws-1-eu-west-1.pooler.supabase.com:6543/postgres';

async function checkData() {
    const client = new pg.Client({
        connectionString,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        
        console.log('--- organizations ---');
        const orgs = await client.query('SELECT id, name, slug FROM organizations');
        console.log(orgs.rows);

        console.log('--- enrollments counts by org ---');
        const res = await client.query('SELECT organization_id, count(*) FROM enrollments GROUP BY organization_id');
        console.log(res.rows);

        if (res.rows.length > 0) {
            console.log('--- first 5 enrollments with user data ---');
            const sample = await client.query(`
                SELECT e.id, e.organization_id, u.first_name, u.surname, p.name as program_name
                FROM enrollments e
                LEFT JOIN users u ON e.user_id = u.id
                LEFT JOIN programs p ON e.program_id = p.id
                LIMIT 5
            `);
            console.log(sample.rows);
        }

    } catch (err) {
        console.error('CHECK ERROR:', err);
    } finally {
        await client.end();
    }
}

checkData();
