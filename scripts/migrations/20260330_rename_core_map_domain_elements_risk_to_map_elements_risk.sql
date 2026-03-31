begin;

do $$
begin
  if to_regclass('core.map_domain_elements_risk') is not null
     and to_regclass('core.map_elements_risk') is null then
    execute 'alter table core.map_domain_elements_risk rename to map_elements_risk';
  end if;
end $$;

do $$
declare
  r record;
  v_new_name text;
begin
  if to_regclass('core.map_elements_risk') is null then
    return;
  end if;

  for r in
    select conname
    from pg_constraint
    where conrelid = 'core.map_elements_risk'::regclass
      and conname like '%map_domain_elements_risk%'
  loop
    v_new_name := replace(r.conname, 'map_domain_elements_risk', 'map_elements_risk');
    execute format(
      'alter table core.map_elements_risk rename constraint %I to %I',
      r.conname,
      v_new_name
    );
  end loop;
end $$;

do $$
declare
  r record;
  v_def text;
begin
  for r in
    select schemaname, viewname, definition
    from pg_views
    where schemaname not in ('pg_catalog', 'information_schema')
      and definition like '%core.map_domain_elements_risk%'
  loop
    v_def := replace(r.definition, 'core.map_domain_elements_risk', 'core.map_elements_risk');
    execute format('create or replace view %I.%I as %s', r.schemaname, r.viewname, v_def);
  end loop;
end $$;

do $$
declare
  v_remaining int;
begin
  select count(*)
    into v_remaining
  from pg_views
  where schemaname not in ('pg_catalog', 'information_schema')
    and definition like '%core.map_domain_elements_risk%';

  if v_remaining > 0 then
    raise exception 'Persisten % vistas con referencia a map_domain_elements_risk', v_remaining;
  end if;
end $$;

commit;

