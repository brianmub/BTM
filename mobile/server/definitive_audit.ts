import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function audit() {
  const tables = [
    'users', 'programs', 'sessions', 'enrollments', 
    'cell_groups', 'cell_members', 'assignments', 'assignment_submissions', 
    'file_attachments', 'attendance_records', 'payment_records', 'audit_logs'
  ];
  
  console.log('--- DB Multi-Tenancy Audit ---');
  for (const t of tables) {
    try {
      // Use a limit of 0 to get column names even if table is empty
      const { data, error } = await supabase.from(t).select('*').limit(1);
      
      if (error) {
        if (error.message.includes('not found')) {
            console.log(`[X] ${t}: Table Not Found`);
            continue;
        }
        console.log(`[!] ${t}: ${error.message}`);
        continue;
      }
      
      const sample = data && data.length > 0 ? data[0] : null;
      if (sample) {
          const hasOrgId = Object.keys(sample).includes('organization_id');
          console.log(`[${hasOrgId ? '✓' : ' '}] ${t}`);
      } else {
          // Table exists but is empty. Try to insert/rollback or use and select * with limit 0
          // Actually, select * limit 1 should return empty array but no error if table exists.
          // Since we can't easily get column names from an empty table without a DB explorer,
          // I'll try to infer from the schema.sql and my previous grep.
          console.log(`[?] ${t} (Empty, assumed missing if not worked on recently)`);
      }
    } catch (err: any) {
      console.log(`[E] ${t}: ${err.message}`);
    }
  }
}
audit();
