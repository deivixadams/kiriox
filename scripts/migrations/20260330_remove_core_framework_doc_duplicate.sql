begin;

create or replace view views.framework_doc_view as
select
  object_schema,
  object_name,
  object_type,
  object_subtype,
  parent_schema,
  parent_name,
  parent_type,
  column_name,
  ordinal_position,
  data_type,
  is_nullable,
  column_default,
  object_description,
  refreshed_at
from views.framework_doc
order by
  object_schema,
  coalesce(parent_name, object_name),
  case
    when object_type in ('TABLE', 'VIEW', 'MATERIALIZED VIEW') then 0
    else 1
  end,
  ordinal_position nulls first,
  column_name nulls first;

drop table if exists core.framework_doc;

commit;

