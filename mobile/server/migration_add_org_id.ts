import 'dotenv/config';
import pg from 'pg';

const { Client } = pg;
const dbUrl = process.env.SUPABASE_DB_URL;

if (!dbUrl) {
  console.error('SUPABASE_DB_URL not found in .env');
  process.exit(1);
}

async function runMigration() {
  const client = new Client({ connectionString: dbUrl });
  await client.connect();
  
  console.log('--- Multi-Tenancy Schema Migration ---');

  const tables = [
    'audit_logs', 
    'cell_groups', 
    'cell_members', 
    'assignments', 
    'assignment_submissions', 
    'file_attachments', 
    'user_badges', 
    'program_groups'
  ];

  for (const table of tables) {
    try {
      // Check if table exists
      const res = await client.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1`, [table]);
      if (res.rowCount === 0) {
        console.log(`[X] Table ${table} not found.`);
        continue;
      }

      // Add organization_id column if it doesn't exist
      await client.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id)`);
      console.log(`[✓] Table ${table}: added organization_id column.`);
    } catch (err: any) {
      console.error(`[!] Table ${table} error:`, err.message);
    }
  }

  await client.end();
}

runMigration().catch(console.error);
