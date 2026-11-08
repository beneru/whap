import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { createSeedDatabase } from '../src/lib/seed-data';
import { calculateClipEarningsCents, calculateCampaignBudgetSummary } from '../src/lib/payout-math';

async function runSeed() {
  const db = createSeedDatabase();

  // Verify seed invariants required by the spec
  const holders = db.profiles.filter((p) => p.role === 'account_holder' || p.role === 'both');
  const editors = db.profiles.filter((p) => p.role === 'editor' || p.role === 'both');
  const requiredStatuses = [
    'submitted',
    'revision_requested',
    'resubmitted',
    'selected',
    'posted',
    'paid',
    'rejected',
  ] as const;

  const presentStatuses = new Set(db.submissions.map((s) => s.status));
  const missingStatuses = requiredStatuses.filter((st) => !presentStatuses.has(st));

  if (missingStatuses.length > 0) {
    throw new Error(`Seed validation failed. Missing submission statuses: ${missingStatuses.join(', ')}`);
  }

  console.log('=== whap Seed Dataset Verification ===');
  console.log(`- Account Holders: ${holders.length} (${holders.map((h) => '@' + h.username).join(', ')})`);
  console.log(`- Editors: ${editors.length} (${editors.map((e) => '@' + e.username).join(', ')})`);
  console.log(`- Campaigns: ${db.campaigns.length}`);
  console.log(
    `- Submissions: ${db.submissions.length} covering all 7 statuses (${Array.from(presentStatuses).join(', ')})`
  );
  console.log(`- View Snapshots: ${db.view_snapshots.length}`);
  console.log(`- Disputes: ${db.disputes.length}`);
  console.log(`- Payout Requests: ${db.payout_requests.length}`);
  console.log(`- Ledger Entries: ${db.ledger_entries.length}`);
  console.log(`- Notifications: ${db.notifications.length}`);

  for (const camp of db.campaigns) {
    const budget = calculateCampaignBudgetSummary(camp, db.submissions);
    console.log(
      `  * Campaign [${camp.id}] "${camp.title}": accrued ${budget.accruedBudgetCents}c / ${budget.totalBudgetCapCents}c (${budget.percentUsed}% used, remaining ${budget.remainingBudgetCents}c)`
    );
  }

  // Write local JSON seed snapshot for instant local/preview persistence
  const dataDir = path.join(process.cwd(), 'data');
  fs.mkdirSync(dataDir, { recursive: true });
  const seedFile = path.join(dataDir, 'seed-snapshot.json');
  fs.writeFileSync(seedFile, JSON.stringify(db, null, 2), 'utf8');
  console.log(`Saved verified seed snapshot to ${seedFile}`);

  // If Supabase credentials are provided in env, also seed the live Supabase Postgres database
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceRoleKey && !supabaseUrl.includes('your-project-ref')) {
    console.log(`Seeding live Supabase project at ${supabaseUrl}...`);
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    await supabase.from('platform_settings').upsert(db.settings);
    await supabase.from('profiles').upsert(db.profiles);
    await supabase.from('campaigns').upsert(db.campaigns);
    await supabase.from('submissions').upsert(db.submissions);
    await supabase.from('view_snapshots').upsert(db.view_snapshots);
    await supabase.from('disputes').upsert(db.disputes);
    await supabase.from('payout_requests').upsert(db.payout_requests);
    await supabase.from('ledger_entries').upsert(db.ledger_entries);
    await supabase.from('notifications').upsert(db.notifications);

    console.log('Live Supabase database seeded.');
  } else {
    console.log(
      'Note: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set to a live remote instance; local seed snapshot is ready and active.'
    );
  }
}

runSeed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
