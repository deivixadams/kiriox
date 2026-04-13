BEGIN;

DO $$
DECLARE
  rec record;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'core'
      AND table_name = 'domain'
      AND column_name = 'company_id'
  ) THEN
    FOR rec IN
      SELECT conname
      FROM pg_constraint
      WHERE conrelid = 'core.domain'::regclass
        AND contype = 'f'
        AND conkey @> ARRAY[
          (
            SELECT attnum
            FROM pg_attribute
            WHERE attrelid = 'core.domain'::regclass
              AND attname = 'company_id'
              AND NOT attisdropped
            LIMIT 1
          )
        ]::smallint[]
    LOOP
      EXECUTE format('ALTER TABLE core.domain DROP CONSTRAINT IF EXISTS %I', rec.conname);
    END LOOP;

    EXECUTE 'ALTER TABLE core.domain DROP COLUMN IF EXISTS company_id';
  END IF;
END $$;

COMMIT;
