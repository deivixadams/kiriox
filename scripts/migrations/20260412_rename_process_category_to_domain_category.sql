-- Rename core.process_category -> core.domain_category
-- Keep core.domain.domain_category FK aligned to the renamed table.

DO $$
BEGIN
  IF to_regclass('core.process_category') IS NOT NULL
     AND to_regclass('core.domain_category') IS NULL THEN
    ALTER TABLE core.process_category
      RENAME TO domain_category;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_core_domain_domain_category'
      AND conrelid = 'core.domain'::regclass
  ) THEN
    ALTER TABLE core.domain
      DROP CONSTRAINT fk_core_domain_domain_category;
  END IF;

  IF to_regclass('core.domain_category') IS NOT NULL THEN
    ALTER TABLE core.domain
      ADD CONSTRAINT fk_core_domain_domain_category
      FOREIGN KEY (domain_category)
      REFERENCES core.domain_category(id)
      ON UPDATE CASCADE
      ON DELETE SET NULL;
  END IF;
END $$;

