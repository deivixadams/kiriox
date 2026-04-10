DO $$
DECLARE
  r record;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'structural_risk') THEN
    RAISE NOTICE 'Schema structural_risk does not exist. Nothing to move.';
    RETURN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'core') THEN
    EXECUTE 'CREATE SCHEMA core';
  END IF;

  FOR r IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'structural_risk'
      AND c.relkind IN ('r','p')
  LOOP
    EXECUTE format('ALTER TABLE %I.%I SET SCHEMA core', 'structural_risk', r.relname);
  END LOOP;

  FOR r IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'structural_risk'
      AND c.relkind = 'v'
  LOOP
    EXECUTE format('ALTER VIEW %I.%I SET SCHEMA core', 'structural_risk', r.relname);
  END LOOP;

  FOR r IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'structural_risk'
      AND c.relkind = 'm'
  LOOP
    EXECUTE format('ALTER MATERIALIZED VIEW %I.%I SET SCHEMA core', 'structural_risk', r.relname);
  END LOOP;

  FOR r IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'structural_risk'
      AND c.relkind = 'S'
  LOOP
    EXECUTE format('ALTER SEQUENCE %I.%I SET SCHEMA core', 'structural_risk', r.relname);
  END LOOP;

  FOR r IN
    SELECT p.oid, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'structural_risk'
  LOOP
    EXECUTE format(
      'ALTER ROUTINE %I.%I(%s) SET SCHEMA core',
      'structural_risk',
      r.proname,
      r.args
    );
  END LOOP;

  FOR r IN
    SELECT t.typname
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'structural_risk'
      AND t.typtype IN ('e','d','c')
  LOOP
    EXECUTE format('ALTER TYPE %I.%I SET SCHEMA core', 'structural_risk', r.typname);
  END LOOP;
END $$;
