BEGIN;

DO $$
DECLARE
  v_schema text;
  v_table text;
  v_constraint text;
BEGIN
  FOR v_schema IN SELECT unnest(ARRAY['core','corpus'])
  LOOP
    v_table := format('%I.risk', v_schema);

    IF to_regclass(v_table) IS NULL THEN
      CONTINUE;
    END IF;

    -- Drop FK(s) bound to risk.status_id (if any)
    FOR v_constraint IN
      EXECUTE format($q$
        SELECT c.conname
        FROM pg_constraint c
        JOIN pg_class t ON t.oid = c.conrelid
        JOIN pg_namespace n ON n.oid = t.relnamespace
        JOIN unnest(c.conkey) AS ck(attnum) ON true
        JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ck.attnum
        WHERE c.contype = 'f'
          AND n.nspname = %L
          AND t.relname = 'risk'
          AND a.attname = 'status_id'
      $q$, v_schema)
    LOOP
      EXECUTE format('ALTER TABLE %I.risk DROP CONSTRAINT IF EXISTS %I', v_schema, v_constraint);
    END LOOP;

    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = v_schema
        AND table_name = 'risk'
        AND column_name = 'status_id'
    ) THEN
      IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = v_schema
          AND table_name = 'risk'
          AND column_name = 'is_active'
      ) THEN
        EXECUTE format('ALTER TABLE %I.risk ADD COLUMN is_active boolean', v_schema);
      END IF;

      -- User requirement: initialize all records as active.
      EXECUTE format('UPDATE %I.risk SET is_active = true', v_schema);
      EXECUTE format('ALTER TABLE %I.risk ALTER COLUMN is_active SET DEFAULT true', v_schema);
      EXECUTE format('ALTER TABLE %I.risk ALTER COLUMN is_active SET NOT NULL', v_schema);
      EXECUTE format('ALTER TABLE %I.risk DROP COLUMN status_id', v_schema);
    ELSE
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = v_schema
          AND table_name = 'risk'
          AND column_name = 'is_active'
      ) THEN
        EXECUTE format('UPDATE %I.risk SET is_active = true WHERE is_active IS NULL', v_schema);
        EXECUTE format('ALTER TABLE %I.risk ALTER COLUMN is_active SET DEFAULT true', v_schema);
        EXECUTE format('ALTER TABLE %I.risk ALTER COLUMN is_active SET NOT NULL', v_schema);
      END IF;
    END IF;

    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I.risk (is_active)', 'idx_' || v_schema || '_risk_is_active', v_schema);
  END LOOP;
END $$;

COMMIT;
