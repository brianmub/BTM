import 'dotenv/config';
import { supabase } from './lib/supabase';

async function backfillEnrollments() {
  console.log('Starting enrollment organization_id backfill...');

  // Get all enrollments with their program's organization_id
  const { data: enrollments, error: enrollErr } = await supabase
    .from('enrollments')
    .select('id, program_id, programs(organization_id)');

  if (enrollErr) {
    console.error('Failed to fetch enrollments:', enrollErr.message);
    process.exit(1);
  }

  if (!enrollments || enrollments.length === 0) {
    console.log('No enrollments found.');
    return;
  }

  let updated = 0;
  let skipped = 0;

  for (const enroll of enrollments) {
    const orgId = (enroll.programs as any)?.organization_id;
    if (!orgId) { skipped++; continue; }

    const { error } = await supabase
      .from('enrollments')
      .update({ organization_id: orgId })
      .eq('id', enroll.id)
      .is('organization_id', null);

    if (error) {
      console.error(`  Error on enrollment ${enroll.id}:`, error.message);
    } else {
      updated++;
    }
  }

  console.log(`Done. Enrollments processed: ${updated}, skipped (no org): ${skipped}`);
}

backfillEnrollments().catch(console.error);
