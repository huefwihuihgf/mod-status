create table if not exists public.shopping_list_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  item_key text not null check (char_length(btrim(item_key)) > 0),
  name text not null check (char_length(btrim(name)) > 0),
  amount numeric check (amount is null or amount >= 0),
  unit text,
  done boolean not null default false,
  source text not null default 'manual' check (source in ('manual', 'recipe')),
  created_at timestamptz not null default now(),
  unique (user_id, item_key, source)
);

alter table public.shopping_list_items enable row level security;

drop policy if exists "Users can view their own shopping items"
  on public.shopping_list_items;
create policy "Users can view their own shopping items"
  on public.shopping_list_items for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can add their own shopping items"
  on public.shopping_list_items;
create policy "Users can add their own shopping items"
  on public.shopping_list_items for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own shopping items"
  on public.shopping_list_items;
create policy "Users can update their own shopping items"
  on public.shopping_list_items for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own shopping items"
  on public.shopping_list_items;
create policy "Users can delete their own shopping items"
  on public.shopping_list_items for delete
  to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete
  on public.shopping_list_items to authenticated;

create or replace function public.replace_recipe_shopping_items(p_items jsonb)
returns setof public.shopping_list_items
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Anmeldung erforderlich';
  end if;

  if pg_catalog.jsonb_typeof(p_items) is distinct from 'array' then
    raise exception 'Die Zutatenliste muss ein JSON-Array sein';
  end if;

  if exists (
    select 1
    from pg_catalog.jsonb_array_elements(p_items) as ingredient(item)
    where nullif(ingredient.item ->> 'item_key', '') is null
      or nullif(ingredient.item ->> 'name', '') is null
  ) then
    raise exception 'Jede Zutat benötigt einen Namen und Schlüssel';
  end if;

  delete from public.shopping_list_items as saved
  where saved.user_id = current_user_id
    and saved.source = 'recipe'
    and saved.item_key not in (
      select ingredient.item ->> 'item_key'
      from pg_catalog.jsonb_array_elements(p_items) as ingredient(item)
    );

  return query
  insert into public.shopping_list_items (
    user_id,
    item_key,
    name,
    amount,
    unit,
    source
  )
  select
    current_user_id,
    ingredient.item ->> 'item_key',
    ingredient.item ->> 'name',
    nullif(ingredient.item ->> 'amount', '')::numeric,
    nullif(ingredient.item ->> 'unit', ''),
    'recipe'
  from pg_catalog.jsonb_array_elements(p_items) as ingredient(item)
  on conflict (user_id, item_key, source)
  do update set
    name = excluded.name,
    amount = excluded.amount,
    unit = excluded.unit
  returning *;
end;
$$;

revoke all on function public.replace_recipe_shopping_items(jsonb) from public;
grant execute on function public.replace_recipe_shopping_items(jsonb) to authenticated;
