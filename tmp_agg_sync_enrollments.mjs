import pg from 'pg';

const connectionString = 'postgresql://postgres.fdivyxnqodzobrlnpsvk:Bethatman123!@aws-1-eu-west-1.pooler.supabase.com:6543/postgres';

async function aggressiveEnrollmentSync() {
    const client = new pg.Client({
        connectionString,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        
        console.log('Aggressively refreshing schema cache for enrollments table...');
        
        // Toggle dummy column
        await client.query("ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS _temp_sync_enrollment BOOLEAN;");
        await client.query("ALTER TABLE enrollments DROP COLUMN IF EXISTS _temp_sync_enrollment;");
        
        // Notify
        await client.query("NOTIFY pgrst, 'reload schema';");

        console.log('Aggressive enrollment sync completed!');

    } catch (err) {
        console.error('Error in aggressive sync:', err);
    } finally {
        await client.end();
    }
}

aggressiveEnrollmentSync();
