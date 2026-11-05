create or replace function public.add_recipe_shopping_items(p_items jsonb)
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

  return query
  insert into public.shopping_list_items as saved (
    user_id,
    item_key,
    name,
    amount,
    unit,
    done,
    source
  )
  select
    current_user_id,
    ingredient.item ->> 'item_key',
    ingredient.item ->> 'name',
    nullif(ingredient.item ->> 'amount', '')::numeric,
    nullif(ingredient.item ->> 'unit', ''),
    false,
    'recipe'
  from pg_catalog.jsonb_array_elements(p_items) as ingredient(item)
  on conflict (user_id, item_key, source)
  do update set
    name = excluded.name,
    amount = case
      when saved.amount is null and excluded.amount is null then null
      else coalesce(saved.amount, 0) + coalesce(excluded.amount, 0)
    end,
    done = false,
    unit = excluded.unit
  returning saved.*;
end;
$$;

revoke all on function public.add_recipe_shopping_items(jsonb) from public;
grant execute on function public.add_recipe_shopping_items(jsonb) to authenticated;
