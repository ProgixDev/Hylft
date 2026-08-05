// Upload local exercise gifs from ../exercisedb/data/media_720 to Supabase
// Storage (bucket: exercise-gifs) and update public.exercises.gif_url to the
// self-hosted URL.
//
// - Uploads in alphabetical order until the cumulative size exceeds
//   MAX_TOTAL_BYTES (default 900 MB), leaving headroom in the free tier.
// - Idempotent: `upsert: true` on Storage, and a local state file lets the
//   script resume cleanly after a failure. Run again to pick up more files
//   later (after bumping MAX_TOTAL_BYTES or upgrading your plan).
//
// Usage (from server/):
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
//     node --env-file=.env scripts/upload-exercise-gifs.mjs
// (or: npm run upload:gifs)

import { readdirSync, statSync, readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '../..');
const GIF_DIR = resolve(REPO_ROOT, 'exercisedb/data/media_720');
const STATE_DIR = resolve(__dirname, '../supabase/seeds');
const STATE_FILE = resolve(STATE_DIR, '.uploaded-gifs.json');
const BUCKET = 'exercise-gifs';

const MAX_TOTAL_BYTES = Number(
  process.env.MAX_TOTAL_BYTES ?? 900 * 1024 * 1024, // 900 MB default
);
const CONCURRENCY = 4;

function loadState() {
  if (!existsSync(STATE_FILE)) return { uploaded: {}, totalBytes: 0 };
  try {
    return JSON.parse(readFileSync(STATE_FILE, 'utf8'));
  } catch {
    return { uploaded: {}, totalBytes: 0 };
  }
}
function saveState(state) {
  if (!existsSync(STATE_DIR)) mkdirSync(STATE_DIR, { recursive: true });
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function humanBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

async function uploadOne(supabase, filename, fullPath, projectRef) {
  const body = readFileSync(fullPath);
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filename, body, {
      contentType: 'image/gif',
      upsert: true,
      cacheControl: 'public, max-age=604800, immutable',
    });
  if (error) throw error;
  const publicUrl = `https://${projectRef}.supabase.co/storage/v1/object/public/${BUCKET}/${filename}`;
  const externalId = filename.replace(/\.gif$/i, '');
  const { error: uErr } = await supabase
    .from('exercises')
    .update({ gif_url: publicUrl, synced_at: new Date().toISOString() })
    .eq('external_id', externalId);
  if (uErr) throw uErr;
  return publicUrl;
}

async function runPool(tasks, size) {
  const results = [];
  let idx = 0;
  async function worker() {
    while (idx < tasks.length) {
      const i = idx++;
      try {
        results[i] = await tasks[i]();
      } catch (err) {
        results[i] = err;
      }
    }
  }
  await Promise.all(Array.from({ length: size }, worker));
  return results;
}

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in env');
    process.exit(1);
  }
  const projectRef = new URL(url).host.split('.')[0];

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (!existsSync(GIF_DIR)) {
    console.error(`Missing gif directory: ${GIF_DIR}`);
    process.exit(1);
  }

  const files = readdirSync(GIF_DIR)
    .filter((n) => n.toLowerCase().endsWith('.gif'))
    .sort();
  console.log(`Found ${files.length} local gifs in ${GIF_DIR}`);

  const state = loadState();
  console.log(
    `Prior state: ${Object.keys(state.uploaded).length} uploaded, ${humanBytes(state.totalBytes)} cumulative`,
  );
  console.log(`Ceiling: ${humanBytes(MAX_TOTAL_BYTES)}`);

  let cumulative = state.totalBytes;
  const todo = [];
  let skippedForSize = 0;

  for (const name of files) {
    if (state.uploaded[name]) continue;
    const fullPath = resolve(GIF_DIR, name);
    const size = statSync(fullPath).size;
    if (cumulative + size > MAX_TOTAL_BYTES) {
      skippedForSize += 1;
      continue;
    }
    cumulative += size;
    todo.push({ name, fullPath, size });
  }

  console.log(
    `Will upload ${todo.length} files (~${humanBytes(cumulative - state.totalBytes)} new, ${humanBytes(cumulative)} total after run). Skipping ${skippedForSize} for the size cap.`,
  );
  if (todo.length === 0) {
    console.log('Nothing to do.');
    return;
  }

  let done = 0;
  let failed = 0;
  const tasks = todo.map(({ name, fullPath, size }) => async () => {
    try {
      await uploadOne(supabase, name, fullPath, projectRef);
      state.uploaded[name] = { size, uploaded_at: new Date().toISOString() };
      state.totalBytes += size;
      done += 1;
      if (done % 10 === 0 || done === todo.length) {
        saveState(state);
        console.log(
          `  ${done}/${todo.length} uploaded (${humanBytes(state.totalBytes)} total)`,
        );
      }
    } catch (err) {
      failed += 1;
      console.error(`  FAILED ${name}:`, err.message || err);
    }
  });

  await runPool(tasks, CONCURRENCY);
  saveState(state);

  const { count } = await supabase
    .from('exercises')
    .select('*', { count: 'exact', head: true })
    .ilike('gif_url', `%/${BUCKET}/%`);

  console.log(
    `\nDone. Uploaded this run: ${done}. Failed: ${failed}. ` +
      `exercises.gif_url pointing at ${BUCKET}: ${count ?? '?'}.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
