DO $$
BEGIN
  IF to_regclass('security.company') IS NOT NULL AND to_regclass('core.company') IS NULL THEN
    EXECUTE 'ALTER TABLE security.company SET SCHEMA core';
  END IF;
END $$;
