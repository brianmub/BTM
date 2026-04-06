import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: './mobile/.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function healAttendance() {
  console.log('Healing attendance records...');
  
  // Find all records where confirmed_by_leader is true but is_verified is false or null
  const { data, error } = await supabase
    .from('attendance_records')
    .update({ is_verified: true })
    .eq('confirmed_by_leader', true);

  if (error) {
    console.error('Error healing records:', error);
  } else {
    console.log(`Successfully ensured that all leader-confirmed records are also marked as verified.`);
  }

  // Also do the reverse for consistency
  const { data: data2, error: error2 } = await supabase
    .from('attendance_records')
    .update({ confirmed_by_leader: true })
    .eq('is_verified', true);

  if (error2) {
    console.error('Error healing records (reverse):', error2);
  } else {
    console.log(`Successfully ensured that all verified records are marked as confirmed by leader.`);
  }
}

healAttendance();
