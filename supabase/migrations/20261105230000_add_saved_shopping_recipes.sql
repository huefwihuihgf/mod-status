create table if not exists public.shopping_list_recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  recipe_key text not null check (char_length(btrim(recipe_key)) > 0),
  name text not null check (char_length(btrim(name)) > 0),
  description text not null default '',
  image_url text not null default '',
  servings integer not null default 1 check (servings > 0),
  instructions jsonb not null default '[]'::jsonb
    check (jsonb_typeof(instructions) = 'array'),
  created_at timestamptz not null default now(),
  unique (user_id, recipe_key)
);

create table if not exists public.shopping_list_recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.shopping_list_recipes (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  position integer not null check (position >= 0),
  name text not null check (char_length(btrim(name)) > 0),
  amount numeric check (amount is null or amount >= 0),
  unit text,
  done boolean not null default false,
  unique (recipe_id, position)
);

alter table public.shopping_list_recipes enable row level security;
alter table public.shopping_list_recipe_ingredients enable row level security;

drop policy if exists "Users can view their own saved shopping recipes"
  on public.shopping_list_recipes;
create policy "Users can view their own saved shopping recipes"
  on public.shopping_list_recipes for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can add their own saved shopping recipes"
  on public.shopping_list_recipes;
create policy "Users can add their own saved shopping recipes"
  on public.shopping_list_recipes for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own saved shopping recipes"
  on public.shopping_list_recipes;
create policy "Users can update their own saved shopping recipes"
  on public.shopping_list_recipes for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own saved shopping recipes"
  on public.shopping_list_recipes;
create policy "Users can delete their own saved shopping recipes"
  on public.shopping_list_recipes for delete
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can view ingredients of their saved recipes"
  on public.shopping_list_recipe_ingredients;
create policy "Users can view ingredients of their saved recipes"
  on public.shopping_list_recipe_ingredients for select
  to authenticated
  using (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.shopping_list_recipes as recipe
      where recipe.id = recipe_id
        and recipe.user_id = (select auth.uid())
    )
  );

drop policy if exists "Users can add ingredients to their saved recipes"
  on public.shopping_list_recipe_ingredients;
create policy "Users can add ingredients to their saved recipes"
  on public.shopping_list_recipe_ingredients for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.shopping_list_recipes as recipe
      where recipe.id = recipe_id
        and recipe.user_id = (select auth.uid())
    )
  );

drop policy if exists "Users can update ingredients of their saved recipes"
  on public.shopping_list_recipe_ingredients;
create policy "Users can update ingredients of their saved recipes"
  on public.shopping_list_recipe_ingredients for update
  to authenticated
  using (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.shopping_list_recipes as recipe
      where recipe.id = recipe_id
        and recipe.user_id = (select auth.uid())
    )
  )
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.shopping_list_recipes as recipe
      where recipe.id = recipe_id
        and recipe.user_id = (select auth.uid())
    )
  );

drop policy if exists "Users can delete ingredients of their saved recipes"
  on public.shopping_list_recipe_ingredients;
create policy "Users can delete ingredients of their saved recipes"
  on public.shopping_list_recipe_ingredients for delete
  to authenticated
  using (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.shopping_list_recipes as recipe
      where recipe.id = recipe_id
        and recipe.user_id = (select auth.uid())
    )
  );

grant select, insert, update, delete
  on public.shopping_list_recipes to authenticated;
grant select, insert, update, delete
  on public.shopping_list_recipe_ingredients to authenticated;

create or replace function public.save_shopping_list_recipe(p_recipe jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  saved_recipe_id uuid;
  recipe_ingredients jsonb;
begin
  if current_user_id is null then
    raise exception 'Anmeldung erforderlich';
  end if;

  if pg_catalog.jsonb_typeof(p_recipe) is distinct from 'object'
    or nullif(p_recipe ->> 'recipe_key', '') is null
    or nullif(p_recipe ->> 'name', '') is null
    or pg_catalog.jsonb_typeof(p_recipe -> 'ingredients') is distinct from 'array'
    or pg_catalog.jsonb_typeof(p_recipe -> 'instructions') is distinct from 'array'
  then
    raise exception 'Die Rezeptdaten sind unvollständig';
  end if;

  recipe_ingredients := p_recipe -> 'ingredients';

  if pg_catalog.jsonb_array_length(recipe_ingredients) = 0 then
    raise exception 'Das Rezept benötigt mindestens eine Zutat';
  end if;

  if exists (
    select 1
    from pg_catalog.jsonb_array_elements(recipe_ingredients) as ingredient(item)
    where nullif(ingredient.item ->> 'name', '') is null
  ) then
    raise exception 'Jede Zutat benötigt einen Namen';
  end if;

  insert into public.shopping_list_recipes (
    user_id,
    recipe_key,
    name,
    description,
    image_url,
    servings,
    instructions
  )
  values (
    current_user_id,
    p_recipe ->> 'recipe_key',
    p_recipe ->> 'name',
    coalesce(p_recipe ->> 'description', ''),
    coalesce(p_recipe ->> 'image_url', ''),
    greatest(coalesce(nullif(p_recipe ->> 'servings', '')::integer, 1), 1),
    p_recipe -> 'instructions'
  )
  on conflict (user_id, recipe_key)
  do update set
    name = excluded.name,
    description = excluded.description,
    image_url = excluded.image_url,
    servings = excluded.servings,
    instructions = excluded.instructions
  returning id into saved_recipe_id;

  delete from public.shopping_list_recipe_ingredients as saved_ingredient
  where saved_ingredient.recipe_id = saved_recipe_id
    and saved_ingredient.user_id = current_user_id
    and saved_ingredient.position >= pg_catalog.jsonb_array_length(recipe_ingredients);

  insert into public.shopping_list_recipe_ingredients (
    recipe_id,
    user_id,
    position,
    name,
    amount,
    unit
  )
  select
    saved_recipe_id,
    current_user_id,
    ingredient.ordinality - 1,
    ingredient.item ->> 'name',
    nullif(ingredient.item ->> 'amount', '')::numeric,
    nullif(ingredient.item ->> 'unit', '')
  from pg_catalog.jsonb_array_elements(recipe_ingredients)
    with ordinality as ingredient(item, ordinality)
  on conflict (recipe_id, position)
  do update set
    name = excluded.name,
    amount = excluded.amount,
    unit = excluded.unit;

  return saved_recipe_id;
end;
$$;

revoke all on function public.save_shopping_list_recipe(jsonb) from public;
grant execute on function public.save_shopping_list_recipe(jsonb) to authenticated;
