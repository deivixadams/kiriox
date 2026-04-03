-- 20260402_control_catalog_drop_id_use_control_id_pk.sql
-- Objetivo: eliminar columna id de linear_risk.control_catalog y usar control_id como PK

BEGIN;

LOCK TABLE linear_risk.control_catalog IN ACCESS EXCLUSIVE MODE;

ALTER TABLE linear_risk.control_catalog
  DROP CONSTRAINT IF EXISTS catalog_lineal_control_pkey;

ALTER TABLE linear_risk.control_catalog
  ADD CONSTRAINT control_catalog_pkey PRIMARY KEY (control_id);

ALTER TABLE linear_risk.control_catalog
  DROP COLUMN IF EXISTS id;

COMMIT;

