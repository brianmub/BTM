import pg from 'pg';

const connectionString = 'postgresql://postgres.fdivyxnqodzobrlnpsvk:Bethatman123!@aws-1-eu-west-1.pooler.supabase.com:6543/postgres';

async function auditSchema() {
    const client = new pg.Client({
        connectionString,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        
        const tables = [
            'organizations', 'users', 'programs', 'sessions', 'enrollments', 
            'cell_groups', 'cell_members', 'assignments', 'assignment_submissions', 
            'file_attachments', 'attendance', 'payments', 'audit_logs'
        ];

        console.log('--- FULL SCHEMA AUDIT ---');
        for (const table of tables) {
            const res = await client.query("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = $1", [table]);
            console.log(`\nTABLE: ${table}`);
            res.rows.forEach(r => console.log(`  - ${r.column_name} (${r.data_type})${r.is_nullable === 'NO' ? ' NOT NULL' : ''}`));
        }
        console.log('\n--- AUDIT COMPLETED ---');

    } catch (err) {
        console.error('AUDIT ERROR:', err);
    } finally {
        await client.end();
    }
}

auditSchema();
