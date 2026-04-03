-- 20260402_risk_catalog_uuid_and_activity_fk.sql
-- Objetivo:
-- 1) Migrar linear_risk.risk_catalog.risk_catalog_id de bigint a uuid
-- 2) Agregar linear_risk.risk_catalog.significant_activity_id como FK a significant_activity
-- Estrategia: estructura segura + limpieza de datos dependientes

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA linear_risk;

LOCK TABLE linear_risk.risk_catalog IN ACCESS EXCLUSIVE MODE;
LOCK TABLE linear_risk.risk_assessment_draft_item_risk IN ACCESS EXCLUSIVE MODE;
LOCK TABLE linear_risk.risk_assessment_final_item_risk IN ACCESS EXCLUSIVE MODE;

-- Limpiar tablas dependientes y catalogo (pedido explicito de reset)
TRUNCATE TABLE
  linear_risk.risk_assessment_draft_item_risk,
  linear_risk.risk_assessment_final_item_risk,
  linear_risk.risk_catalog
RESTART IDENTITY CASCADE;

-- Soltar FKs hijas
ALTER TABLE IF EXISTS linear_risk.risk_assessment_draft_item_risk
  DROP CONSTRAINT IF EXISTS risk_assessment_draft_item_risk_risk_catalog_id_fkey;

ALTER TABLE IF EXISTS linear_risk.risk_assessment_final_item_risk
  DROP CONSTRAINT IF EXISTS risk_assessment_final_item_risk_risk_catalog_id_fkey;

-- Soltar FK de significant_activity si ya existe (idempotencia)
ALTER TABLE IF EXISTS linear_risk.risk_catalog
  DROP CONSTRAINT IF EXISTS risk_catalog_significant_activity_id_fkey;

-- Reconfigurar PK a UUID
ALTER TABLE linear_risk.risk_catalog
  DROP CONSTRAINT IF EXISTS risk_catalog_pkey;

ALTER TABLE linear_risk.risk_catalog
  DROP COLUMN IF EXISTS risk_catalog_id;

ALTER TABLE linear_risk.risk_catalog
  ADD COLUMN risk_catalog_id uuid NOT NULL DEFAULT gen_random_uuid();

ALTER TABLE linear_risk.risk_catalog
  ADD CONSTRAINT risk_catalog_pkey PRIMARY KEY (risk_catalog_id);

-- Nuevo campo de relacion con actividad significativa
ALTER TABLE linear_risk.risk_catalog
  ADD COLUMN IF NOT EXISTS significant_activity_id uuid;

ALTER TABLE linear_risk.risk_catalog
  ADD CONSTRAINT risk_catalog_significant_activity_id_fkey
  FOREIGN KEY (significant_activity_id)
  REFERENCES linear_risk.significant_activity(significant_activity_id)
  ON UPDATE CASCADE
  ON DELETE RESTRICT;

-- Tipar hijas como UUID
ALTER TABLE linear_risk.risk_assessment_draft_item_risk
  ALTER COLUMN risk_catalog_id TYPE uuid USING NULL::uuid;

ALTER TABLE linear_risk.risk_assessment_final_item_risk
  ALTER COLUMN risk_catalog_id TYPE uuid USING NULL::uuid;

-- Recrear FKs hijas
ALTER TABLE linear_risk.risk_assessment_draft_item_risk
  ADD CONSTRAINT risk_assessment_draft_item_risk_risk_catalog_id_fkey
  FOREIGN KEY (risk_catalog_id)
  REFERENCES linear_risk.risk_catalog(risk_catalog_id)
  ON UPDATE CASCADE
  ON DELETE RESTRICT;

ALTER TABLE linear_risk.risk_assessment_final_item_risk
  ADD CONSTRAINT risk_assessment_final_item_risk_risk_catalog_id_fkey
  FOREIGN KEY (risk_catalog_id)
  REFERENCES linear_risk.risk_catalog(risk_catalog_id)
  ON UPDATE CASCADE
  ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_risk_catalog_significant_activity
  ON linear_risk.risk_catalog(significant_activity_id);

COMMIT;

