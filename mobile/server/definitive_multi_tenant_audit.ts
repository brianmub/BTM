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
    'attendance_records', 'payment_records', 'audit_logs', 'user_badges'
  ];
  
  console.log('--- Multi-Tenancy Column Audit ---');
  for (const t of tables) {
    try {
      // Try to select the column specifically to see if it exists
      const { error } = await supabase.from(t).select('organization_id').limit(0);
      
      if (error) {
        if (error.message.includes('not found')) {
            console.log(`[X] ${t}: Table not found`);
            continue;
        }
        if (error.message.includes('column "organization_id" does not exist')) {
            console.log(`[ ] ${t}: Missing organization_id`);
            continue;
        }
        console.log(`[!] ${t}: ${error.message}`);
      } else {
        console.log(`[✓] ${t}: Has organization_id`);
      }
    } catch (err: any) {
      console.log(`[E] ${t}: ${err.message}`);
    }
  }
}

checkColumns();
