import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: './mobile/.env' });
const client = new pg.Client({ connectionString: process.env.SUPABASE_DB_URL });

async function checkConstraint() {
    await client.connect();
    try {
        const res = await client.query("SELECT * FROM information_schema.table_constraints WHERE table_name = 'attendance_records' AND constraint_name = 'attendance_records_verified_by_fkey';");
        console.log('Constraint exists:', res.rows.length > 0);
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}
checkConstraint();
