import pg from 'pg';

const connectionString = 'postgresql://postgres.fdivyxnqodzobrlnpsvk:Bethatman123!@aws-1-eu-west-1.pooler.supabase.com:6543/postgres';

async function forceRefresh() {
    const client = new pg.Client({
        connectionString,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        
        // 1. Double check the column
        const check = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'organizations' AND column_name = 'join_code';
        `);
        console.log('Column check:', check.rows);

        if (check.rows.length === 0) {
            console.log('Column missing! Adding it now...');
            await client.query(`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS join_code VARCHAR(10) UNIQUE;`);
        }

        // 2. Force refresh by changing a property
        console.log('Toggling table property to force PostgREST refresh...');
        await client.query("COMMENT ON TABLE organizations IS 'Organizations table with join_code support.';");
        
        // 3. Notify again
        await client.query("NOTIFY pgrst, 'reload schema';");

        console.log('Refresh command sent!');

    } catch (err) {
        console.error('Error forcing refresh:', err);
    } finally {
        await client.end();
    }
}

forceRefresh();
