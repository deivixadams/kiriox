-- Ensure all params tables have info column (text)
-- Schema: params

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'params'
      AND table_type = 'BASE TABLE'
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'params'
        AND table_name = r.table_name
        AND column_name = 'info'
    ) THEN
      EXECUTE format('ALTER TABLE params.%I ADD COLUMN info text', r.table_name);
    END IF;
  END LOOP;
END $$;
