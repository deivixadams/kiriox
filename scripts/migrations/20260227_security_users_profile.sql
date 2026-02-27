DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'corpus'
      AND table_name = 'security_users'
      AND column_name = 'full_name'
  ) THEN
    ALTER TABLE corpus.security_users RENAME COLUMN full_name TO name;
  END IF;
END $$;

ALTER TABLE corpus.security_users
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS whatsapp text;
