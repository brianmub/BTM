import pg from 'pg';

const connectionString = 'postgresql://postgres.fdivyxnqodzobrlnpsvk:Bethatman123!@aws-1-eu-west-1.pooler.supabase.com:6543/postgres';

async function fixEnrollmentSchema() {
    const client = new pg.Client({
        connectionString,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        
        console.log('Adding missing columns to enrollments table...');
        
        // 1. Add tracking columns
        await client.query("ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS sessions_attended INTEGER DEFAULT 0;");
        await client.query("ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS assignments_completed INTEGER DEFAULT 0;");
        
        // 2. Force refresh
        await client.query("NOTIFY pgrst, 'reload schema';");

        console.log('Enrollment schema fix completed!');

    } catch (err) {
        console.error('Error fixing enrollment schema:', err);
    } finally {
        await client.end();
    }
}

fixEnrollmentSchema();
