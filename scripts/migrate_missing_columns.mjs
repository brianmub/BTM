import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: './mobile/.env' });

const { Client } = pg;
const client = new Client({
  connectionString: process.env.SUPABASE_DB_URL,
});

async function migrate() {
  await client.connect();
  console.log('Connected to DB.');
  
  try {
    // 1. attendance_records: is_verified, verified_at, verified_by
    console.log('Migrating attendance_records with verified_at...');
    await client.query('ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;');
    await client.query('ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;');
    // Skipping UUID references to avoid relation errors if multiple schemas exist
    await client.query('ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS verified_by UUID;');
    
    // 2. cell_attendance: status, verified_at, verified_by?
    console.log('Migrating cell_attendance with verified_at...');
    await client.query("ALTER TABLE cell_attendance ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'present';");
    await client.query('ALTER TABLE cell_attendance ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;');
    await client.query('ALTER TABLE cell_attendance ADD COLUMN IF NOT EXISTS verified_by UUID;');
    
    // 3. cell_meetings: status
    console.log('Migrating cell_meetings...');
    await client.query("ALTER TABLE cell_meetings ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open';");
    
    console.log('Migration complete.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

migrate();
