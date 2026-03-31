begin;

create schema if not exists core;

create or replace function core.refresh_framework_doc()
returns void
language sql
as $$
  select views.refresh_framework_doc();
$$;

commit;

