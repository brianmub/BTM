import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from the root .env
dotenv.config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY in environment");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function backfill() {
  console.log("Starting full data backfill...");

  // 1. Backfill Attendance Records
  console.log("\n--- Backfilling Attendance Records ---");
  const { data: attRecords, error: attError } = await supabase
    .from('attendance_records')
    .select('id, user_id')
    .is('organization_id', null);

  if (attError) {
    console.error("Error fetching attendance records:", attError);
  } else {
    console.log(`Found ${attRecords?.length || 0} attendance records missing organization_id.`);
    for (const record of attRecords || []) {
      const { data: user } = await supabase.from('users').select('organization_id').eq('id', record.user_id).single();
      if (user?.organization_id) {
        await supabase.from('attendance_records').update({ organization_id: user.organization_id }).eq('id', record.id);
        console.log(`Updated attendance record ${record.id} with org ${user.organization_id}`);
      }
    }
  }

  // 2. Backfill Enrollments
  console.log("\n--- Backfilling Enrollments ---");
  const { data: enrollments, error: enrollError } = await supabase
    .from('enrollments')
    .select('id, user_id')
    .is('organization_id', null);

  if (enrollError) {
    console.error("Error fetching enrollments:", enrollError);
  } else {
    console.log(`Found ${enrollments?.length || 0} enrollments missing organization_id.`);
    for (const record of enrollments || []) {
      const { data: user } = await supabase.from('users').select('organization_id').eq('id', record.user_id).single();
      if (user?.organization_id) {
        await supabase.from('enrollments').update({ organization_id: user.organization_id }).eq('id', record.id);
        console.log(`Updated enrollment ${record.id} with org ${user.organization_id}`);
      }
    }
  }

  // 3. Backfill Sessions QR Data
  console.log("\n--- Backfilling Sessions QR Data ---");
  const { data: sessions, error: sessError } = await supabase
    .from('sessions')
    .select('id, name')
    .is('qr_code_data', null);

  if (sessError) {
    console.error("Error fetching sessions:", sessError);
  } else {
    console.log(`Found ${sessions?.length || 0} sessions missing qr_code_data.`);
    for (const session of sessions || []) {
      const qrData = `session-${Math.random().toString(36).substring(2, 11)}`;
      await supabase.from('sessions').update({ qr_code_data: qrData }).eq('id', session.id);
      console.log(`Updated session ${session.id} (${session.name}) with QR data: ${qrData}`);
    }
  }

  // 4. Confirm all Attendance Records
  console.log("\n--- Confirming all Attendance Records ---");
  const { error: confError } = await supabase
    .from('attendance_records')
    .update({ confirmed_by_leader: true })
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Dummy condition to update all

  if (confError) {
    console.error("Error confirming attendance records:", confError);
  } else {
    console.log("All attendance records set to confirmed.");
  }

  console.log("\nFull backfill complete!");
}

backfill();
