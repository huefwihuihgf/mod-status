create table if not exists public.friend_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users (id) on delete cascade,
  recipient_id uuid not null references auth.users (id) on delete cascade,
  content text,
  recipe jsonb,
  created_at timestamptz not null default now(),
  constraint friend_messages_one_payload check (
    (
      content is not null
      and char_length(btrim(content)) > 0
      and char_length(content) <= 2000
      and recipe is null
    )
    or (
      content is null
      and recipe is not null
      and pg_catalog.jsonb_typeof(recipe) = 'object'
      and pg_catalog.pg_column_size(recipe) <= 65536
    )
  ),
  constraint friend_messages_no_self_message check (sender_id <> recipient_id)
);

create index if not exists friend_messages_sender_recipient_created_idx
  on public.friend_messages (sender_id, recipient_id, created_at);
create index if not exists friend_messages_recipient_sender_created_idx
  on public.friend_messages (recipient_id, sender_id, created_at);

create or replace function public.is_my_friend(target_user_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1
    from public.get_my_friends() as friend
    where (pg_catalog.to_jsonb(friend) ->> 'user_id')::uuid = target_user_id
  );
$$;

revoke all on function public.is_my_friend(uuid) from public;
grant execute on function public.is_my_friend(uuid) to authenticated;

alter table public.friend_messages enable row level security;

drop policy if exists "Friends can read their messages"
  on public.friend_messages;
create policy "Friends can read their messages"
  on public.friend_messages
  for select
  to authenticated
  using (
    (
      sender_id = (select auth.uid())
      and public.is_my_friend(recipient_id)
    )
    or (
      recipient_id = (select auth.uid())
      and public.is_my_friend(sender_id)
    )
  );

drop policy if exists "Users can message confirmed friends"
  on public.friend_messages;
create policy "Users can message confirmed friends"
  on public.friend_messages
  for insert
  to authenticated
  with check (
    sender_id = (select auth.uid())
    and recipient_id <> (select auth.uid())
    and public.is_my_friend(recipient_id)
  );

grant select, insert on public.friend_messages to authenticated;

do $$
begin
  if exists (
    select 1
    from pg_catalog.pg_publication
    where pubname = 'supabase_realtime'
  ) and not exists (
    select 1
    from pg_catalog.pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'friend_messages'
  ) then
    alter publication supabase_realtime add table public.friend_messages;
  end if;
end;
$$;
