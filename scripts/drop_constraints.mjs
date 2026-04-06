import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: './mobile/.env' });

const { Client } = pg;
const client = new Client({
  connectionString: process.env.SUPABASE_DB_URL,
});

async function dropConstraints() {
  await client.connect();
  console.log('Connected to DB.');
  
  try {
    console.log('Dropping potential conflicting constraints...');
    
    // Attempt to drop constraints from attendance_records
    await client.query('ALTER TABLE attendance_records DROP CONSTRAINT IF EXISTS attendance_records_verified_by_fkey;');
    await client.query('ALTER TABLE attendance_records DROP CONSTRAINT IF EXISTS attendence_records_verified_by_fkey;'); // Typo check
    
    // Also cell_attendance
    await client.query('ALTER TABLE cell_attendance DROP CONSTRAINT IF EXISTS cell_attendance_verified_by_fkey;');
    
    console.log('Constraints dropped successfully.');
  } catch (err) {
    console.error('Failed to drop constraints:', err);
  } finally {
    await client.end();
  }
}

dropConstraints();
