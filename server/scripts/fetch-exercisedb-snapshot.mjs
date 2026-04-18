// Snapshot the entire ExerciseDB v1 catalog to JSON for a one-shot Supabase seed.
// Run: `node scripts/fetch-exercisedb-snapshot.mjs` from server/.
//
// Writes:
//   server/supabase/seeds/exercisedb.json   (all exercises)
//   server/supabase/seeds/bodyparts.json    (lookup)
//   server/supabase/seeds/equipments.json   (lookup)
//
// Source: https://oss.exercisedb.dev (free, no auth)

import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SEEDS_DIR = resolve(__dirname, '../supabase/seeds');

const BASE = 'https://oss.exercisedb.dev';
const PAGE_LIMIT = 100;
const DELAY_MS = 1500;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchJson(url) {
  let backoff = 2000;
  for (let attempt = 1; attempt <= 6; attempt++) {
    const res = await fetch(url);
    if (res.status === 429) {
      console.warn(`  429 on ${url} — waiting ${backoff}ms (attempt ${attempt}/6)`);
      await sleep(backoff);
      backoff = Math.min(backoff * 2, 30000);
      continue;
    }
    if (!res.ok) throw new Error(`GET ${url} -> ${res.status} ${res.statusText}`);
    return res.json();
  }
  throw new Error(`Exhausted retries: ${url}`);
}

async function fetchAllExercises() {
  const stateFile = resolve(SEEDS_DIR, '.fetch-state.json');
  const out = [];
  const seen = new Set();
  let cursor = null;
  let page = 0;

  // Resume from prior run if a state file exists.
  if (existsSync(stateFile)) {
    try {
      const prior = JSON.parse(await readFile(stateFile, 'utf8'));
      if (Array.isArray(prior.items) && typeof prior.cursor === 'string') {
        for (const e of prior.items) {
          if (e?.exerciseId && !seen.has(e.exerciseId)) {
            seen.add(e.exerciseId);
            out.push(e);
          }
        }
        cursor = prior.cursor;
        page = prior.page ?? 0;
        console.log(
          `  resuming from state: ${out.length} cached items, cursor=${cursor}`,
        );
      }
    } catch {
      /* ignore */
    }
  }

  while (true) {
    page += 1;
    const params = new URLSearchParams({ limit: String(PAGE_LIMIT) });
    if (cursor) params.set('cursor', cursor);

    const url = `${BASE}/api/v1/exercises?${params}`;
    const body = await fetchJson(url);

    const rows = body?.data ?? [];
    let added = 0;
    for (const r of rows) {
      if (r?.exerciseId && !seen.has(r.exerciseId)) {
        seen.add(r.exerciseId);
        out.push(r);
        added += 1;
      }
    }

    const hasNext = body?.meta?.hasNextPage ?? rows.length === PAGE_LIMIT;
    const nextCursor = body?.meta?.nextCursor ?? null;

    console.log(
      `  page ${page}: +${added} new (${rows.length} raw, total ${out.length})` +
        (hasNext ? '' : ' — done'),
    );

    // Persist progress so we can resume on failure.
    await writeFile(
      stateFile,
      JSON.stringify({ cursor: nextCursor, page, items: out }),
    );

    if (!hasNext || !nextCursor) break;
    cursor = nextCursor;
    await sleep(DELAY_MS);

    if (page > 200) {
      console.warn('Safety cap hit at 200 pages; stopping');
      break;
    }
  }

  return out;
}

async function main() {
  await mkdir(SEEDS_DIR, { recursive: true });

  console.log('Fetching /api/v1/bodyparts …');
  const bodypartsRes = await fetchJson(`${BASE}/api/v1/bodyparts`);
  const bodyparts = (bodypartsRes?.data ?? []).map((x) => x.name);
  await writeFile(
    resolve(SEEDS_DIR, 'bodyparts.json'),
    JSON.stringify(bodyparts, null, 2),
  );
  console.log(`  wrote bodyparts.json (${bodyparts.length} entries)`);

  console.log('Fetching /api/v1/equipments …');
  const equipmentsRes = await fetchJson(`${BASE}/api/v1/equipments`);
  const equipments = (equipmentsRes?.data ?? []).map((x) => x.name);
  await writeFile(
    resolve(SEEDS_DIR, 'equipments.json'),
    JSON.stringify(equipments, null, 2),
  );
  console.log(`  wrote equipments.json (${equipments.length} entries)`);

  console.log('Fetching /api/v1/exercises (paged) …');
  const exercises = await fetchAllExercises();
  const compact = exercises.map((e) => ({
    exerciseId: e.exerciseId,
    name: e.name,
    gifUrl: e.gifUrl ?? null,
    bodyParts: e.bodyParts ?? [],
    targetMuscles: e.targetMuscles ?? [],
    secondaryMuscles: e.secondaryMuscles ?? [],
    equipments: e.equipments ?? [],
    instructions: e.instructions ?? [],
  }));

  await writeFile(
    resolve(SEEDS_DIR, 'exercisedb.json'),
    JSON.stringify(compact, null, 2),
  );
  console.log(`  wrote exercisedb.json (${compact.length} exercises)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
