import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: './mobile/.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY // Use anon key to see if it even sees the table
);

async function checkSchema() {
  const tables = ['attendance_records', 'cell_meetings', 'cell_attendance'];
  for (const table of tables) {
    console.log(`\nChecking table: ${table}`);
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`Error on ${table}:`, error.message);
    } else {
      console.log(`Found ${table} with columns:`, Object.keys(data[0] || {}).join(', '));
    }
  }
}

checkSchema();
