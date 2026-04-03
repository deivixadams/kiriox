-- 20260402_significant_activity_id_uuid_safe_reset.sql
-- Objetivo: migrar linear_risk.significant_activity.significant_activity_id de bigint a uuid
-- Estrategia: segura de estructura + limpieza de datos dependientes

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA linear_risk;

LOCK TABLE linear_risk.significant_activity IN ACCESS EXCLUSIVE MODE;
LOCK TABLE linear_risk.risk_assessment_draft_item IN ACCESS EXCLUSIVE MODE;
LOCK TABLE linear_risk.risk_assessment_final_item IN ACCESS EXCLUSIVE MODE;

-- Limpieza de datos dependientes (segun decision funcional)
TRUNCATE TABLE
  linear_risk.risk_assessment_draft_item,
  linear_risk.risk_assessment_final_item
RESTART IDENTITY CASCADE;

-- Soltar FKs hacia significant_activity
ALTER TABLE IF EXISTS linear_risk.risk_assessment_draft_item
  DROP CONSTRAINT IF EXISTS risk_assessment_draft_item_significant_activity_id_fkey;

ALTER TABLE IF EXISTS linear_risk.risk_assessment_final_item
  DROP CONSTRAINT IF EXISTS risk_assessment_final_item_significant_activity_id_fkey;

-- Reconfigurar PK de significant_activity a UUID
ALTER TABLE linear_risk.significant_activity
  DROP CONSTRAINT IF EXISTS significant_activity_pkey;

ALTER TABLE linear_risk.significant_activity
  DROP COLUMN IF EXISTS significant_activity_id;

ALTER TABLE linear_risk.significant_activity
  ADD COLUMN significant_activity_id uuid NOT NULL DEFAULT gen_random_uuid();

ALTER TABLE linear_risk.significant_activity
  ADD CONSTRAINT significant_activity_pkey PRIMARY KEY (significant_activity_id);

-- Ajustar tipos de columnas hijas a UUID
ALTER TABLE linear_risk.risk_assessment_draft_item
  ALTER COLUMN significant_activity_id TYPE uuid USING NULL::uuid;

ALTER TABLE linear_risk.risk_assessment_final_item
  ALTER COLUMN significant_activity_id TYPE uuid USING NULL::uuid;

-- Recrear relaciones FK
ALTER TABLE linear_risk.risk_assessment_draft_item
  ADD CONSTRAINT risk_assessment_draft_item_significant_activity_id_fkey
  FOREIGN KEY (significant_activity_id)
  REFERENCES linear_risk.significant_activity(significant_activity_id)
  ON UPDATE CASCADE
  ON DELETE RESTRICT;

ALTER TABLE linear_risk.risk_assessment_final_item
  ADD CONSTRAINT risk_assessment_final_item_significant_activity_id_fkey
  FOREIGN KEY (significant_activity_id)
  REFERENCES linear_risk.significant_activity(significant_activity_id)
  ON UPDATE CASCADE
  ON DELETE RESTRICT;

COMMIT;
