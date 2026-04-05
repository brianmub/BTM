import 'dotenv/config';
import { supabase } from './lib/supabase';

async function backfillAssignments() {
  console.log('Starting assignment organization_id backfill...');

  // Get all sessions with their program's organization_id
  const { data: sessions, error: sessErr } = await supabase
    .from('sessions')
    .select('id, program_id, programs(organization_id)');

  if (sessErr) {
    console.error('Failed to fetch sessions:', sessErr.message);
    process.exit(1);
  }

  if (!sessions || sessions.length === 0) {
    console.log('No sessions found.');
    return;
  }

  let updated = 0;
  let skipped = 0;

  for (const sess of sessions) {
    const orgId = (sess.programs as any)?.organization_id;
    if (!orgId) { skipped++; continue; }

    const { error } = await supabase
      .from('assignments')
      .update({ organization_id: orgId })
      .eq('session_id', sess.id)
      .is('organization_id', null);

    if (error) {
      console.error(`  Error on session ${sess.id}:`, error.message);
    } else {
      updated++;
    }
  }

  console.log(`Done. Sessions processed: ${updated}, skipped (no org): ${skipped}`);
}

backfillAssignments().catch(console.error);
