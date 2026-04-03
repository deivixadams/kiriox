-- 20260402_risk_catalog_drop_company_reorder.sql
-- Objetivo:
-- 1) Remover company_id de linear_risk.risk_catalog
-- 2) Reordenar columnas dejando risk_catalog_id y significant_activity_id al inicio
-- Nota: PostgreSQL requiere recrear tabla para reorden de columnas.

BEGIN;

LOCK TABLE linear_risk.risk_catalog IN ACCESS EXCLUSIVE MODE;
LOCK TABLE linear_risk.risk_assessment_draft_item_risk IN ACCESS EXCLUSIVE MODE;
LOCK TABLE linear_risk.risk_assessment_final_item_risk IN ACCESS EXCLUSIVE MODE;

DROP INDEX IF EXISTS linear_risk.idx_risk_catalog_significant_activity;
DROP INDEX IF EXISTS linear_risk.uq_risk_catalog_activity_code;
ALTER TABLE IF EXISTS linear_risk.risk_catalog
  DROP CONSTRAINT IF EXISTS uq_risk_catalog_company_code;

-- Soltar FKs hijas para poder recrear risk_catalog
ALTER TABLE IF EXISTS linear_risk.risk_assessment_draft_item_risk
  DROP CONSTRAINT IF EXISTS risk_assessment_draft_item_risk_risk_catalog_id_fkey;

ALTER TABLE IF EXISTS linear_risk.risk_assessment_final_item_risk
  DROP CONSTRAINT IF EXISTS risk_assessment_final_item_risk_risk_catalog_id_fkey;

-- Crear tabla nueva con orden de columnas solicitado
CREATE TABLE linear_risk.risk_catalog_new (
  risk_catalog_id uuid NOT NULL DEFAULT gen_random_uuid(),
  significant_activity_id uuid NULL,
  risk_code varchar(100) NOT NULL,
  risk_name varchar(255) NOT NULL,
  risk_description text NULL,
  risk_category varchar(100) NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT risk_catalog_new_pkey PRIMARY KEY (risk_catalog_id),
  CONSTRAINT risk_catalog_new_significant_activity_id_fkey
    FOREIGN KEY (significant_activity_id)
    REFERENCES linear_risk.significant_activity(significant_activity_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
);

-- Migrar datos existentes (sin company_id)
INSERT INTO linear_risk.risk_catalog_new (
  risk_catalog_id,
  significant_activity_id,
  risk_code,
  risk_name,
  risk_description,
  risk_category,
  is_active,
  created_at,
  updated_at
)
SELECT
  risk_catalog_id,
  significant_activity_id,
  risk_code,
  risk_name,
  risk_description,
  risk_category,
  is_active,
  created_at,
  updated_at
FROM linear_risk.risk_catalog;

-- Índice único nuevo sin company_id
CREATE UNIQUE INDEX uq_risk_catalog_activity_code_new
  ON linear_risk.risk_catalog_new (significant_activity_id, risk_code);

CREATE INDEX idx_risk_catalog_significant_activity_new
  ON linear_risk.risk_catalog_new (significant_activity_id);

DROP TABLE linear_risk.risk_catalog;
ALTER TABLE linear_risk.risk_catalog_new RENAME TO risk_catalog;

ALTER INDEX linear_risk.risk_catalog_new_pkey RENAME TO risk_catalog_pkey;
ALTER INDEX linear_risk.uq_risk_catalog_activity_code_new RENAME TO uq_risk_catalog_activity_code;
ALTER INDEX linear_risk.idx_risk_catalog_significant_activity_new RENAME TO idx_risk_catalog_significant_activity;
ALTER TABLE linear_risk.risk_catalog
  RENAME CONSTRAINT risk_catalog_new_significant_activity_id_fkey TO risk_catalog_significant_activity_id_fkey;

-- Recrear FKs hijas al catálogo recreado
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

COMMIT;
