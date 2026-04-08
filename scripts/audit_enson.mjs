import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: './mobile/.env' });
const client = new pg.Client({ connectionString: process.env.SUPABASE_DB_URL });

async function auditEnson() {
    await client.connect();
    try {
        const ensonId = '6711c07f-9b81-4f75-a202-d5abbd067a0a';
        console.log('--- ENROLLMENTS ---');
        const enrollments = await client.query('SELECT * FROM enrollments WHERE user_id = $1', [ensonId]);
        console.log(JSON.stringify(enrollments.rows, null, 2));
        console.log('\n--- ATTENDANCE ---');
        const attendance = await client.query('SELECT * FROM attendance_records WHERE user_id = $1', [ensonId]);
        console.log(JSON.stringify(attendance.rows, null, 2));
        console.log('\n--- SESSIONS ---');
        const programIds = enrollments.rows.map(e => e.program_id);
        if (programIds.length > 0) {
            const sessions = await client.query('SELECT * FROM sessions WHERE program_id = ANY($1)', [programIds]);
            console.log(JSON.stringify(sessions.rows, null, 2));
        }
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}
auditEnson();
