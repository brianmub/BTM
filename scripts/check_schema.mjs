import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: './mobile/.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAndAddColumn() {
  console.log('Checking for is_verified column in attendance_records...');
  
  try {
    // Attempt to select the column to see if it exists
    const { data, error } = await supabase
      .from('attendance_records')
      .select('is_verified')
      .limit(1);

    if (error && error.code === 'PGRST204') {
      console.log('Column is_verified is missing. Adding it...');
      
      // Use RPC if available, or just log instructions
      // If we don't have a direct "run SQL" RPC, we can't easily add it via client
      console.error('CRITICAL: is_verified column is missing from attendance_records table.');
      console.log('Please run this SQL in your Supabase Dashboard:');
      console.log('ALTER TABLE attendance_records ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;');
    } else if (error) {
       console.error('Error checking column:', error);
    } else {
      console.log('Column is_verified exists. Good!');
    }
  } catch (err) {
    console.error('Failed to check column:', err);
  }
}

checkAndAddColumn();
