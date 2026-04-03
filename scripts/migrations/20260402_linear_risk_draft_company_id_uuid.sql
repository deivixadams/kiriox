-- 20260402_linear_risk_draft_company_id_uuid.sql
-- Objetivo: migrar company_id a UUID en tablas linear_risk clave.

BEGIN;

ALTER TABLE linear_risk.risk_assessment_draft
  ALTER COLUMN company_id DROP NOT NULL;

ALTER TABLE linear_risk.risk_assessment_draft
  ADD COLUMN IF NOT EXISTS company_id_uuid uuid;

UPDATE linear_risk.risk_assessment_draft d
SET company_id_uuid = COALESCE(
  NULLIF((d.notes::jsonb #>> '{wizard,companyId}'), '')::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid
)
WHERE company_id_uuid IS NULL;

ALTER TABLE linear_risk.risk_assessment_draft
  DROP COLUMN company_id;

ALTER TABLE linear_risk.risk_assessment_draft
  RENAME COLUMN company_id_uuid TO company_id;

ALTER TABLE linear_risk.risk_assessment_draft
  ALTER COLUMN company_id SET DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  ALTER COLUMN company_id SET NOT NULL;

-- risk_assessment_final
ALTER TABLE linear_risk.risk_assessment_final
  ALTER COLUMN company_id DROP NOT NULL;

ALTER TABLE linear_risk.risk_assessment_final
  ADD COLUMN IF NOT EXISTS company_id_uuid uuid;

UPDATE linear_risk.risk_assessment_final f
SET company_id_uuid = COALESCE(
  (SELECT d.company_id
   FROM linear_risk.risk_assessment_draft d
   WHERE d.risk_assessment_draft_id = f.source_draft_id
   LIMIT 1),
  '00000000-0000-0000-0000-000000000000'::uuid
)
WHERE company_id_uuid IS NULL;

ALTER TABLE linear_risk.risk_assessment_final
  DROP COLUMN company_id;

ALTER TABLE linear_risk.risk_assessment_final
  RENAME COLUMN company_id_uuid TO company_id;

ALTER TABLE linear_risk.risk_assessment_final
  ALTER COLUMN company_id SET DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  ALTER COLUMN company_id SET NOT NULL;

-- risk_catalog
ALTER TABLE linear_risk.risk_catalog
  ALTER COLUMN company_id DROP NOT NULL;

ALTER TABLE linear_risk.risk_catalog
  ADD COLUMN IF NOT EXISTS company_id_uuid uuid;

UPDATE linear_risk.risk_catalog
SET company_id_uuid = '00000000-0000-0000-0000-000000000000'::uuid
WHERE company_id_uuid IS NULL;

ALTER TABLE linear_risk.risk_catalog
  DROP COLUMN company_id;

ALTER TABLE linear_risk.risk_catalog
  RENAME COLUMN company_id_uuid TO company_id;

ALTER TABLE linear_risk.risk_catalog
  ALTER COLUMN company_id SET DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  ALTER COLUMN company_id SET NOT NULL;

-- significant_activity
ALTER TABLE linear_risk.significant_activity
  ALTER COLUMN company_id DROP NOT NULL;

ALTER TABLE linear_risk.significant_activity
  ADD COLUMN IF NOT EXISTS company_id_uuid uuid;

UPDATE linear_risk.significant_activity
SET company_id_uuid = '00000000-0000-0000-0000-000000000000'::uuid
WHERE company_id_uuid IS NULL;

ALTER TABLE linear_risk.significant_activity
  DROP COLUMN company_id;

ALTER TABLE linear_risk.significant_activity
  RENAME COLUMN company_id_uuid TO company_id;

ALTER TABLE linear_risk.significant_activity
  ALTER COLUMN company_id SET DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  ALTER COLUMN company_id SET NOT NULL;

COMMIT;
