import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const s = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkCols() {
  const tables = [
    'users', 'programs', 'sessions', 'enrollments', 
    'cell_groups', 'program_groups', 'cell_members', 
    'assignments', 'assignment_submissions', 'file_attachments', 
    'attendance_records', 'payment_records', 'audit_logs', 'user_badges'
  ];
  
  console.log('--- Multi-Tenancy Audit ---');
  for (const t of tables) {
    try {
      const { data, error } = await s.from(t).select('*').limit(1);
      if (error) {
        if (error.message.includes('not found')) continue;
        console.log(`Table ${t}: Error: ${error.message}`);
      } else {
        const hasOrgId = (data && data.length > 0) ? Object.keys(data[0]).includes('organization_id') : '? (Empty Table)';
        console.log(`Table ${t}: has organization_id: ${hasOrgId}`);
      }
    } catch (err) {
      console.log(`Table ${t}: Exception: ${err.message}`);
    }
  }
}
checkCols().catch(console.error);
