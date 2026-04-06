import pg from 'pg';

const connectionString = 'postgresql://postgres.fdivyxnqodzobrlnpsvk:Bethatman123!@aws-1-eu-west-1.pooler.supabase.com:6543/postgres';

async function deepAudit() {
    const client = new pg.Client({
        connectionString,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        
        console.log('--- ENROLLMENTS ---');
        const res = await client.query(`
            SELECT e.id, e.status, e.organization_id, o.name as org_name, p.name as prog_name 
            FROM enrollments e 
            LEFT JOIN organizations o ON e.organization_id = o.id 
            LEFT JOIN programs p ON e.program_id = p.id
        `);
        console.log(res.rows);

    } catch (err) {
        console.error('ERROR:', err);
    } finally {
        await client.end();
    }
}

deepAudit();
