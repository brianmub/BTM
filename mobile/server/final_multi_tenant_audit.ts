import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkColumns() {
  const tables = [
    'users', 'programs', 'sessions', 'enrollments', 
    'cell_groups', 'program_groups', 'cell_members', 
    'assignments', 'assignment_submissions', 'file_attachments', 
    'attendance_records', 'payment_records', 'audit_logs'
  ];
  
  console.log('--- Multi-Tenancy Audit ---');
  for (const t of tables) {
    try {
      // Query one row to see columns, or metadata if possible
      const { data, error } = await supabase.from(t).select('*').limit(1);
      
      if (error) {
        if (error.message.includes('not found')) {
          console.log(`[X] ${t}: Table not found`);
          continue;
        }
        console.log(`[!] ${t}: ${error.message}`);
        continue;
      }
      
      // If table is empty, data will be []. We can still check columns if we can find them 
      // but without a better DB explorer tool, let's try to fetch one row.
      if (data && data.length > 0) {
        const columns = Object.keys(data[0]);
        const hasOrgId = columns.includes('organization_id');
        console.log(`[${hasOrgId ? '✓' : ' '}] ${t}`);
      } else {
        console.log(`[?] ${t}: Empty table - cannot verify columns via select`);
      }
    } catch (err: any) {
      console.log(`[E] ${t}: ${err.message}`);
    }
  }
}

checkColumns();
