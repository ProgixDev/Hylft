-- Rebuild file 7/8 — see 20260314_rebuild_01_extensions_and_profiles.sql for context.
-- notifications (server/src/notifications/notifications.service.ts): the
-- join `user_profiles!notifications_actor_id_fkey` relies on the default
-- Postgres FK constraint name for the actor_id column — do not rename it.
-- Auto-notify triggers fire on follow/like/comment, matching the README's
-- documented hylft_0010 design; comment vs reply is distinguished by
-- comments.parent_id being null or not.

create table if not exists notifications (
  id            uuid primary key default gen_random_uuid(),
  recipient_id  uuid not null references user_profiles(id) on delete cascade,
  actor_id      uuid references user_profiles(id) on delete cascade,
  type          text not null check (type in ('follow','follow_request','like','comment','reply')),
  target_type   text,
  target_id     uuid,
  read_at       timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists notifications_recipient_idx on notifications (recipient_id, created_at desc);
create index if not exists notifications_recipient_unread_idx on notifications (recipient_id) where read_at is null;

alter table notifications enable row level security;

drop policy if exists "notifications_owner" on notifications;
create policy "notifications_owner" on notifications
  for all using (auth.uid() = recipient_id) with check (auth.uid() = recipient_id);

create or replace function public.notify_on_follow()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.notifications (recipient_id, actor_id, type, target_type, target_id)
  values (new.followee_id, new.follower_id, 'follow', 'user_profiles', new.follower_id);
  return new;
end;
$$;

drop trigger if exists follows_notify on follows;
create trigger follows_notify
  after insert on follows
  for each row execute function public.notify_on_follow();

create or replace function public.notify_on_post_like()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_author uuid;
begin
  select author_id into v_author from posts where id = new.post_id;
  if v_author is not null and v_author <> new.user_id then
    insert into public.notifications (recipient_id, actor_id, type, target_type, target_id)
    values (v_author, new.user_id, 'like', 'post', new.post_id);
  end if;
  return new;
end;
$$;

drop trigger if exists post_likes_notify on post_likes;
create trigger post_likes_notify
  after insert on post_likes
  for each row execute function public.notify_on_post_like();

create or replace function public.notify_on_comment()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_author uuid;
  v_parent_author uuid;
begin
  select author_id into v_author from posts where id = new.post_id;
  if v_author is not null and v_author <> new.author_id then
    insert into public.notifications (recipient_id, actor_id, type, target_type, target_id)
    values (v_author, new.author_id, 'comment', 'post', new.post_id);
  end if;

  if new.parent_id is not null then
    select author_id into v_parent_author from comments where id = new.parent_id;
    if v_parent_author is not null and v_parent_author <> new.author_id and v_parent_author <> v_author then
      insert into public.notifications (recipient_id, actor_id, type, target_type, target_id)
      values (v_parent_author, new.author_id, 'reply', 'comment', new.parent_id);
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists comments_notify on comments;
create trigger comments_notify
  after insert on comments
  for each row execute function public.notify_on_comment();
