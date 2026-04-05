import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectSchema() {
  const tables = [
    'users', 'programs', 'sessions', 'enrollments', 
    'cell_groups', 'cells', 'cell_members', 
    'assignments', 'assignment_submissions', 'file_attachments', 
    'attendance_records', 'payment_records', 'audit_logs'
  ];
  
  console.log('--- DB Multi-Tenancy Audit ---');
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        if (error.message.includes('not found')) {
           // Skip tables that don't exist
           continue;
        }
        console.log(`[X] ${table}: ${error.message}`);
      } else {
        const columns = data.length > 0 ? Object.keys(data[0]) : null;
        if (columns) {
          const hasOrgId = columns.includes('organization_id');
          console.log(`[${hasOrgId ? '✓' : ' '}] ${table}`);
        } else {
          console.log(`[?] ${table} (Empty)`);
        }
      }
    } catch (err: any) {
      console.log(`[X] ${table} catch: ${err.message}`);
    }
  }
}

inspectSchema();
