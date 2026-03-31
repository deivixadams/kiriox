begin;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'core.reino'::regclass
      and conname = 'reino_id_unique'
  ) then
    alter table core.reino
      add constraint reino_id_unique unique (id);
  end if;
end $$;

create table if not exists catalog.catalog_group (
  id bigint generated always as identity primary key,
  code varchar(100) not null unique,
  name varchar(150) not null,
  description text null,
  applies_to varchar(100) null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists catalog.catalog_item (
  id bigint generated always as identity primary key,
  catalog_group_id bigint not null references catalog.catalog_group(id) on delete cascade,
  realm_id uuid not null references core.reino(id),
  code varchar(100) not null,
  name varchar(150) null,
  description text null,
  parent_id bigint null references catalog.catalog_item(id),
  status_code varchar(30) not null default 'ACTIVE',
  sort_order integer not null default 0,
  ordinal_value integer null,
  numeric_value numeric(12,4) null,
  direction_value integer null,
  metadata jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_catalog_item_group_realm_code unique (catalog_group_id, realm_id, code)
);

create index if not exists idx_catalog_item_group on catalog.catalog_item(catalog_group_id);
create index if not exists idx_catalog_item_realm on catalog.catalog_item(realm_id);
create index if not exists idx_catalog_item_active on catalog.catalog_item(is_active);
create index if not exists idx_catalog_item_status_code on catalog.catalog_item(status_code);

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
      when p_table_name like 'cat_%\_%\_%' escape '\' then regexp_replace(p_table_name, '^cat_[^_]+_', '')
      when p_table_name like 'corpus_catalog_%' then regexp_replace(p_table_name, '^corpus_catalog_', '')
      else p_table_name
    end
end
$$;

create or replace function catalog.resolve_catalog_realm_code(p_table_name text)
returns text
language sql
immutable
as $$
select case
  when p_table_name like 'cat_ciber_%' then 'CYB'
  when p_table_name like 'cat_aml_%' then 'AML'
  else 'CYB'
end
$$;

insert into catalog.catalog_group (code, name, description, applies_to, is_active)
select
  g.group_code,
  initcap(replace(g.group_code, '_', ' ')) as name,
  format('Canonical group generated from source catalog tables (%s)', g.group_code) as description,
  null::varchar(100) as applies_to,
  true as is_active
from (
  select distinct catalog.normalize_catalog_group_code(t.table_name) as group_code
  from information_schema.tables t
  where t.table_schema = 'catalog'
    and t.table_type = 'BASE TABLE'
    and t.table_name not in ('catalog_group', 'catalog_item')
) g
on conflict (code) do update
set
  name = excluded.name,
  description = excluded.description,
  updated_at = now();

do $$
declare
  r record;
  v_group_code text;
  v_realm_code text;
  v_realm_id uuid;
  v_sql text;
begin
  for r in
    select t.table_name
    from information_schema.tables t
    where t.table_schema = 'catalog'
      and t.table_type = 'BASE TABLE'
      and t.table_name not in ('catalog_group', 'catalog_item')
    order by t.table_name
  loop
    v_group_code := catalog.normalize_catalog_group_code(r.table_name);
    v_realm_code := catalog.resolve_catalog_realm_code(r.table_name);

    select rr.id
      into v_realm_id
    from core.reino rr
    where rr.code = v_realm_code
      and rr.is_active = true
    order by rr.created_at asc
    limit 1;

    if v_realm_id is null then
      raise exception 'No se pudo resolver realm_id para tabla %, realm_code %', r.table_name, v_realm_code;
    end if;

    v_sql := format($f$
      with src as (
        select to_jsonb(t) as j
        from catalog.%I t
      ),
      normalized as (
        select
          upper(btrim(coalesce(nullif(j->>'code',''), nullif(j->>'name',''), j->>'id'))) as code,
          coalesce(nullif(j->>'name',''), nullif(j->>'code','')) as name,
          nullif(j->>'description','') as description,
          case
            when (j->>'status_id') ~* '^[0-9a-f-]{36}$' then (j->>'status_id')::uuid
            else null::uuid
          end as status_id_uuid,
          upper(nullif(j->>'status','')) as raw_status_code,
          case
            when lower(coalesce(j->>'is_active','')) in ('true','t','1','yes','y') then true
            when lower(coalesce(j->>'is_active','')) in ('false','f','0','no','n') then false
            else null::boolean
          end as raw_is_active,
          case when (j->>'sort_order') ~ '^-?\d+$' then (j->>'sort_order')::int else 0 end as sort_order,
          case when (j->>'ordinal_value') ~ '^-?\d+$' then (j->>'ordinal_value')::int else null::int end as ordinal_value,
          case when (j->>'numeric_value') ~ '^-?\d+(\.\d+)?$' then (j->>'numeric_value')::numeric(12,4) else null::numeric(12,4) end as numeric_value,
          case when (j->>'base_value') ~ '^-?\d+(\.\d+)?$' then (j->>'base_value')::numeric(12,4) else null::numeric(12,4) end as base_value,
          case when (j->>'direction_value') ~ '^-?\d+$' then (j->>'direction_value')::int else null::int end as direction_value,
          coalesce((j->>'created_at')::timestamptz, now()) as created_at,
          coalesce((j->>'updated_at')::timestamptz, coalesce((j->>'created_at')::timestamptz, now())) as updated_at,
          j
        from src
      )
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
        (select cg.id from catalog.catalog_group cg where cg.code = %L) as catalog_group_id,
        %L::uuid as realm_id,
        n.code,
        n.name,
        n.description,
        null::bigint as parent_id,
        coalesce(
          n.raw_status_code,
          upper(cs.code),
          case
            when n.raw_is_active is false then 'INACTIVE'
            else 'ACTIVE'
          end,
          'ACTIVE'
        ) as status_code,
        n.sort_order,
        n.ordinal_value,
        coalesce(n.numeric_value, n.base_value) as numeric_value,
        n.direction_value,
        jsonb_build_object(
          'source_schema', 'catalog',
          'source_table', %L,
          'source_row', n.j
        ) as metadata,
        coalesce(
          n.raw_is_active,
          case when coalesce(n.raw_status_code, upper(cs.code), 'ACTIVE') in ('INACTIVE','DISABLED','DEPRECATED') then false else true end
        ) as is_active,
        n.created_at,
        n.updated_at
      from normalized n
      left join catalog.cat_ciber_status cs
        on cs.id = n.status_id_uuid
      where n.code is not null
        and n.code <> ''
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
    $f$, r.table_name, v_group_code, v_realm_id::text, r.table_name);

    execute v_sql;
  end loop;
end $$;

commit;
