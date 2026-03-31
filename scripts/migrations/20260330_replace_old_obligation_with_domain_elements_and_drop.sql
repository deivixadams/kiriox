begin;

do $$
begin
  if to_regclass('core."OLD-obligation"') is not null then
    execute 'drop table if exists xdata.backup_old_obligation_before_drop_20260330';
    execute 'create table xdata.backup_old_obligation_before_drop_20260330 as select * from core."OLD-obligation"';
  end if;
end $$;

create or replace view core.v_domain_elements_obligation_compat as
select
  de.id,
  mde.domain_id,
  de.code,
  de.title,
  de.statement,
  de.source_ref,
  de.rationale,
  coalesce(de.obligation_status, 'active') as status,
  de.created_at,
  de.updated_at,
  de.obligation_status_id as status_id,
  de.obligation_type_id,
  coalesce(de.is_hard_gate, false) as is_hard_gate,
  de.criticality,
  de.evidence_strength,
  de.criticality_id,
  de.evidence_strength_id
from core.domain_elements de
left join lateral (
  select m.domain_id
  from core.map_domain_element m
  where m.element_id = de.id
  order by m.is_primary desc, m.created_at asc, m.domain_id asc
  limit 1
) mde on true
where de.element_type = 'OBLIGATION';

do $$
declare
  r record;
  v_def text;
  v_replaced integer := 0;
begin
  for r in
    select schemaname, viewname, definition
    from pg_views
    where schemaname not in ('pg_catalog', 'information_schema')
      and definition like '%core."OLD-obligation"%'
  loop
    v_def := replace(r.definition, 'core."OLD-obligation"', 'core.v_domain_elements_obligation_compat');
    execute format('create or replace view %I.%I as %s', r.schemaname, r.viewname, v_def);
    v_replaced := v_replaced + 1;
  end loop;

  raise notice 'Vistas actualizadas desde OLD-obligation: %', v_replaced;
end $$;

do $$
declare
  v_remaining int;
begin
  select count(*)
    into v_remaining
  from pg_views
  where schemaname not in ('pg_catalog', 'information_schema')
    and definition like '%core."OLD-obligation"%';

  if v_remaining > 0 then
    raise exception 'Persisten % vistas con referencia textual a core."OLD-obligation"', v_remaining;
  end if;
end $$;

drop table if exists core."OLD-obligation";

commit;
