// Seeds public.exercises from server/supabase/seeds/exercisedb.json
// using the Supabase service-role key. Idempotent: uses upsert on external_id.
//
// Run:
//   cd server
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-exercises.mjs
// (or load them from server/.env first)

import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SEED_PATH = resolve(__dirname, '../supabase/seeds/exercisedb.json');
const BATCH = 200;

const BEGINNER = new Set(['body weight', 'resistance band', 'band', 'assisted', 'rope']);
const ADVANCED = new Set([
  'barbell',
  'olympic barbell',
  'trap bar',
  'hammer',
  'leverage',
  'leverage machine',
  'sled',
  'sled machine',
]);

function difficulty(equipment) {
  const e = (equipment ?? '').toLowerCase();
  if (BEGINNER.has(e)) return 'beginner';
  if (ADVANCED.has(e)) return 'advanced';
  return 'intermediate';
}

function mapRecord(r) {
  return {
    external_id: r.exerciseId,
    name: r.name,
    body_part: r.bodyParts?.[0] ?? '',
    target_muscle: r.targetMuscles?.[0] ?? '',
    secondary_muscles: r.secondaryMuscles ?? [],
    equipment: r.equipments?.[0] ?? '',
    gif_url: r.gifUrl ?? null,
    instructions: r.instructions ?? [],
    difficulty: difficulty(r.equipments?.[0]),
  };
}

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env');
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log(`Reading ${SEED_PATH} …`);
  const raw = JSON.parse(await readFile(SEED_PATH, 'utf8'));
  const records = Array.isArray(raw) ? raw : raw.records ?? [];
  console.log(`Loaded ${records.length} records`);

  const rows = records.map(mapRecord);
  let inserted = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const slice = rows.slice(i, i + BATCH);
    const { error } = await supabase
      .from('exercises')
      .upsert(slice, { onConflict: 'external_id' });
    if (error) {
      console.error(`Batch ${i / BATCH + 1} failed:`, error);
      process.exit(1);
    }
    inserted += slice.length;
    console.log(`  upserted ${inserted}/${rows.length}`);
  }

  const { count, error: cErr } = await supabase
    .from('exercises')
    .select('*', { count: 'exact', head: true });
  if (cErr) throw cErr;
  console.log(`\nDone. exercises row count: ${count}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
