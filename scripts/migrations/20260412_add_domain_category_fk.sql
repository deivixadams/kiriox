-- Add domain_category in core.domain and bind it to core.domain_category(id)
-- Idempotent migration.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'core'
      AND table_name = 'domain'
      AND column_name = 'domain_category'
  ) THEN
    ALTER TABLE core.domain
      ADD COLUMN domain_category bigint NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_core_domain_domain_category'
      AND conrelid = 'core.domain'::regclass
  ) THEN
    ALTER TABLE core.domain
      ADD CONSTRAINT fk_core_domain_domain_category
      FOREIGN KEY (domain_category)
      REFERENCES core.domain_category(id)
      ON UPDATE CASCADE
      ON DELETE SET NULL;
  END IF;
END $$;
