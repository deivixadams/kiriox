begin;

create or replace function catalog.normalize_catalog_group_code(p_table_name text)
returns text
language sql
immutable
as $$
select case p_table_name
  when 'cat_ciber_risk_impact' then 'impact'
  when 'cat_ciber_risk_inherent_level' then 'inherent_level'
  when 'cat_ciber_risk_management_quality' then 'management_quality'
  when 'cat_ciber_risk_net_level' then 'net_level'
  when 'cat_ciber_risk_trend' then 'trend'
  else
    case
      when p_table_name ~ '^cat_[^_]+_' then regexp_replace(p_table_name, '^cat_[^_]+_', '')
      when p_table_name like 'corpus_catalog_%' then regexp_replace(p_table_name, '^corpus_catalog_', '')
      else p_table_name
    end
end
$$;

do $$
declare
  v_group_status_id bigint;
  v_group_legacy_id bigint;
begin
  insert into catalog.catalog_group (code, name, description, is_active)
  values ('status', 'Status', 'Canonical status catalog group', true)
  on conflict (code) do update
  set updated_at = now();

  select id into v_group_status_id
  from catalog.catalog_group
  where code = 'status'
  limit 1;

  select id into v_group_legacy_id
  from catalog.catalog_group
  where code = 'cat_ciber_status'
  limit 1;

  if v_group_legacy_id is not null then
    insert into catalog.catalog_item (
      catalog_group_id,
      realm_id,
      code,
      name,
      description,
      parent_id,
      status_code,
      sort_order,
      ordinal_value,
      numeric_value,
      direction_value,
      metadata,
      is_active,
      created_at,
      updated_at
    )
    select
      v_group_status_id,
      ci.realm_id,
      ci.code,
      ci.name,
      ci.description,
      ci.parent_id,
      ci.status_code,
      ci.sort_order,
      ci.ordinal_value,
      ci.numeric_value,
      ci.direction_value,
      ci.metadata,
      ci.is_active,
      ci.created_at,
      ci.updated_at
    from catalog.catalog_item ci
    where ci.catalog_group_id = v_group_legacy_id
    on conflict (catalog_group_id, realm_id, code) do update
    set
      name = excluded.name,
      description = excluded.description,
      status_code = excluded.status_code,
      sort_order = excluded.sort_order,
      ordinal_value = excluded.ordinal_value,
      numeric_value = excluded.numeric_value,
      direction_value = excluded.direction_value,
      metadata = catalog.catalog_item.metadata || excluded.metadata,
      is_active = excluded.is_active,
      updated_at = now();

    delete from catalog.catalog_item
    where catalog_group_id = v_group_legacy_id;

    delete from catalog.catalog_group
    where id = v_group_legacy_id;
  end if;
end $$;

commit;

