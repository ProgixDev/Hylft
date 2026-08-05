-- Catalog of selectable profile cover images hosted in the `covers` bucket.
-- Users pick from this catalog; they do not upload. Premium-tier rows are
-- gated by subscription (client-enforced for now, server-enforced later).

create table if not exists covers (
  id            bigserial primary key,
  storage_path  text not null unique,
  tier          text not null default 'free' check (tier in ('free','premium')),
  sort_order    int not null default 0,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

-- Make the covers bucket public so the stored public_url resolves without auth.
update storage.buckets set public = true where id = 'covers';

-- Everyone (even anon) can read covers bucket objects.
drop policy if exists "covers_read_public" on storage.objects;
create policy "covers_read_public" on storage.objects
  for select using (bucket_id = 'covers');

-- Seed from whatever is already in the bucket, sorted by name.
insert into covers (storage_path, tier, sort_order)
select o.name, 'free',
       row_number() over (order by o.name)
  from storage.objects o
 where o.bucket_id = 'covers'
on conflict (storage_path) do nothing;
