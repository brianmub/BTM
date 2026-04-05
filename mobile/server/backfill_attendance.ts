import { supabase } from './lib/supabase';

async function backfill() {
  console.log("Starting backfill of organization_id for attendance_records...");
  
  const { data: records, error: fetchError } = await supabase
    .from('attendance_records')
    .select('id, user_id')
    .is('organization_id', null);

  if (fetchError) {
    console.error("Error fetching records:", fetchError);
    return;
  }

  console.log(`Found ${records?.length || 0} records missing organization_id.`);

  if (!records || records.length === 0) return;

  for (const record of records) {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', record.user_id)
      .single();

    if (userError || !user?.organization_id) {
      console.warn(`Could not find organization_id for user ${record.user_id}`);
      continue;
    }

    const { error: updateError } = await supabase
      .from('attendance_records')
      .update({ organization_id: user.organization_id })
      .eq('id', record.id);

    if (updateError) {
      console.error(`Failed to update record ${record.id}:`, updateError);
    } else {
      console.log(`Updated record ${record.id} with org ${user.organization_id}`);
    }
  }

  console.log("Backfill complete.");
}

backfill();
