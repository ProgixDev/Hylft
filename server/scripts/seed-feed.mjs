// Seeds the `fil` feed with 5 demo users + posts so it's never empty.
//
// Creates 5 auth users (if missing) via the admin API, upgrades their
// `user_profiles` rows with stable usernames/avatars, downloads the demo
// Unsplash images into the `post-media` bucket, and inserts posts +
// post_media rows referencing them. Idempotent: reruns skip existing seeds.
//
// Run:
//   cd server
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-feed.mjs
// (or load them from server/.env first)

import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

const BUCKET = 'post-media';
const SEED_TAG = '[seed-feed]';

const SEEDS = [
  {
    email: 'alex_lifts@seed.hylift.app',
    username: 'alex_lifts',
    display_name: 'Alex',
    avatar_url: 'https://i.pravatar.cc/150?img=12',
    caption: 'New bench PR today! 💪 Hard work pays off.',
    image_urls: [
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1080',
    ],
    hours_ago: 2,
  },
  {
    email: 'sarah_fit@seed.hylift.app',
    username: 'sarah_fit',
    display_name: 'Sarah',
    avatar_url: 'https://i.pravatar.cc/150?img=47',
    caption: "Leg day done 🔥 Who's training with me tomorrow?",
    image_urls: [
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1080',
      'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=1080',
    ],
    hours_ago: 5,
  },
  {
    email: 'mike_beast@seed.hylift.app',
    username: 'mike_beast',
    display_name: 'Mike',
    avatar_url: 'https://i.pravatar.cc/150?img=33',
    caption: 'Full body workout complete. Feeling unstoppable.',
    image_urls: [],
    hours_ago: 8,
  },
  {
    email: 'emma_strong@seed.hylift.app',
    username: 'emma_strong',
    display_name: 'Emma',
    avatar_url: 'https://i.pravatar.cc/150?img=24',
    caption: 'Deadlift day! New personal best 🏆',
    image_urls: [
      'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1080',
    ],
    hours_ago: 24,
  },
  {
    email: 'chris_gains@seed.hylift.app',
    username: 'chris_gains',
    display_name: 'Chris',
    avatar_url: 'https://i.pravatar.cc/150?img=58',
    caption: "Morning pump hits different ☀️ Let's get it!",
    image_urls: [
      'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=1080',
      'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1080',
      'https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=1080',
    ],
    hours_ago: 48,
  },
];

async function ensureUser(seed) {
  // Look up existing user by email via admin API.
  const { data: list, error: listErr } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (listErr) throw listErr;
  let user = list.users.find((u) => u.email === seed.email);
  if (!user) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: seed.email,
      email_confirm: true,
      password: randomUUID(),
      user_metadata: { username: seed.username },
    });
    if (error) throw error;
    user = data.user;
    console.log(`${SEED_TAG} created auth user ${seed.email} (${user.id})`);
  } else {
    console.log(`${SEED_TAG} reuse auth user ${seed.email} (${user.id})`);
  }
  // Upsert profile fields — handle_new_user usually inserts the row, but
  // upsert guards against the trigger not firing or being removed.
  const { error: pErr } = await supabase
    .from('user_profiles')
    .upsert(
      {
        id: user.id,
        username: seed.username,
        display_name: seed.display_name,
        avatar_url: seed.avatar_url,
      },
      { onConflict: 'id' },
    );
  if (pErr) throw pErr;
  return user.id;
}

async function uploadImage(userId, url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch ${url} → ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const path = `${userId}/${Date.now()}-${randomUUID()}.jpg`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buf, { contentType: 'image/jpeg', upsert: false });
  if (error) throw error;
  return path;
}

async function hasSeedPost(userId, caption) {
  const { data, error } = await supabase
    .from('posts')
    .select('id')
    .eq('author_id', userId)
    .eq('caption', caption)
    .is('deleted_at', null)
    .limit(1);
  if (error) throw error;
  return (data ?? []).length > 0;
}

async function createPost(userId, seed) {
  if (await hasSeedPost(userId, seed.caption)) {
    console.log(`${SEED_TAG} skip (already seeded): ${seed.username}`);
    return;
  }
  const createdAt = new Date(
    Date.now() - seed.hours_ago * 60 * 60 * 1000,
  ).toISOString();
  const { data: post, error } = await supabase
    .from('posts')
    .insert({
      author_id: userId,
      kind: 'standard',
      caption: seed.caption,
      privacy: 'public',
      stats: null,
      created_at: createdAt,
      updated_at: createdAt,
    })
    .select('id')
    .single();
  if (error) throw error;

  if (seed.image_urls.length > 0) {
    const rows = [];
    for (let i = 0; i < seed.image_urls.length; i++) {
      const path = await uploadImage(userId, seed.image_urls[i]);
      rows.push({ post_id: post.id, position: i, storage_path: path });
    }
    const { error: mErr } = await supabase.from('post_media').insert(rows);
    if (mErr) throw mErr;
  }
  console.log(`${SEED_TAG} posted as ${seed.username}`);
}

async function main() {
  for (const seed of SEEDS) {
    const uid = await ensureUser(seed);
    await createPost(uid, seed);
  }
  console.log(`${SEED_TAG} done`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
