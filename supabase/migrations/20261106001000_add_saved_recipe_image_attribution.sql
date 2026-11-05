alter table public.shopping_list_recipes
  add column if not exists image_credit text not null default '',
  add column if not exists image_source_url text not null default '',
  add column if not exists image_license text not null default '',
  add column if not exists image_license_url text not null default '';

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
    image_credit,
    image_source_url,
    image_license,
    image_license_url,
    servings,
    instructions
  )
  values (
    current_user_id,
    p_recipe ->> 'recipe_key',
    p_recipe ->> 'name',
    coalesce(p_recipe ->> 'description', ''),
    coalesce(p_recipe ->> 'image_url', ''),
    coalesce(p_recipe ->> 'image_credit', ''),
    coalesce(p_recipe ->> 'image_source_url', ''),
    coalesce(p_recipe ->> 'image_license', ''),
    coalesce(p_recipe ->> 'image_license_url', ''),
    greatest(coalesce(nullif(p_recipe ->> 'servings', '')::integer, 1), 1),
    p_recipe -> 'instructions'
  )
  on conflict (user_id, recipe_key)
  do update set
    name = excluded.name,
    description = excluded.description,
    image_url = excluded.image_url,
    image_credit = excluded.image_credit,
    image_source_url = excluded.image_source_url,
    image_license = excluded.image_license,
    image_license_url = excluded.image_license_url,
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
