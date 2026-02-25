import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config();

async function migrate() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        console.log('Connected to database.');

        console.log('Running migration...');
        await client.query(`
            ALTER TABLE public.users DROP CONSTRAINT IF EXISTS valid_role;
            ALTER TABLE public.users ADD CONSTRAINT valid_role CHECK (role IN ('platform_admin', 'system_admin', 'program_admin', 'facilitator', 'participant'));
        `);
        console.log('Migration successful: platform_admin role added to valid_role constraint.');

        // Try to promote the user if provided
        const email = process.argv[2];
        if (email) {
            console.log(`Promoting ${email}...`);
            const res = await client.query('UPDATE public.users SET role = \'platform_admin\' WHERE email = $1', [email]);
            if (res.rowCount > 0) {
                console.log(`SUCCESS: ${email} is now a Platform Admin.`);
            } else {
                console.log(`User ${email} not found in database.`);
            }
        }

    } catch (err) {
        console.error('Migration failed:', err.message);
    } finally {
        await client.end();
    }
}

migrate();
