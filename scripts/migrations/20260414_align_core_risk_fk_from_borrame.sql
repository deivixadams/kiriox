-- 20260414_align_core_risk_fk_from_borrame.sql
-- Objetivo: alinear FKs de riesgo lineal hacia core.risk(id), eliminando dependencia de borrame._borrame-risk_catalog.

BEGIN;

-- 0) Garantizar clave candidata en core.risk(id) para poder referenciar por FK.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'core.risk'::regclass
      AND conname = 'core_risk_id_unique'
  ) THEN
    ALTER TABLE core.risk
      ADD CONSTRAINT core_risk_id_unique UNIQUE (id);
  END IF;
END $$;

-- 1) Materializar en core.risk todos los risk IDs legacy referenciados por tablas core.
WITH legacy_refs AS (
  SELECT DISTINCT dir.risk_catalog_id AS risk_id
  FROM core.risk_assessment_draft_item_risk dir
  WHERE dir.risk_catalog_id IS NOT NULL

  UNION

  SELECT DISTINCT fir.risk_catalog_id AS risk_id
  FROM core.risk_assessment_final_item_risk fir
  WHERE fir.risk_catalog_id IS NOT NULL

  UNION

  SELECT DISTINCT m.catalog_lineal_risk_id AS risk_id
  FROM core.map_lineal_risk_risk_control m
  WHERE m.catalog_lineal_risk_id IS NOT NULL
)
INSERT INTO core.risk (
  id,
  code,
  name,
  risk_type,
  description,
  created_at,
  updated_at,
  risk_layer_id,
  risk_origen,
  is_active,
  catalog_impact_id,
  catalog_probability_id
)
SELECT
  lr.risk_id,
  COALESCE(NULLIF(brc.risk_code, ''), 'LEGACY-' || substring(lr.risk_id::text, 1, 8)) AS code,
  COALESCE(NULLIF(brc.risk_name, ''), 'Riesgo legado ' || substring(lr.risk_id::text, 1, 8)) AS name,
  COALESCE(NULLIF(brc.risk_category, ''), 'linear') AS risk_type,
  brc.risk_description,
  now(),
  now(),
  2,
  'LEGACY_MIGRATION',
  COALESCE(brc.is_active, true),
  NULL,
  NULL
FROM legacy_refs lr
LEFT JOIN borrame."_borrame-risk_catalog" brc
  ON brc.risk_catalog_id = lr.risk_id
WHERE NOT EXISTS (
  SELECT 1
  FROM core.risk r
  WHERE r.id = lr.risk_id
);

-- 2) Reconfigurar FK de draft item risk -> core.risk(id)
ALTER TABLE core.risk_assessment_draft_item_risk
  DROP CONSTRAINT IF EXISTS risk_assessment_draft_item_risk_risk_catalog_id_fkey;

ALTER TABLE core.risk_assessment_draft_item_risk
  ADD CONSTRAINT risk_assessment_draft_item_risk_risk_catalog_id_fkey
  FOREIGN KEY (risk_catalog_id)
  REFERENCES core.risk(id)
  ON UPDATE CASCADE
  ON DELETE RESTRICT;

-- 3) Reconfigurar FK de final item risk -> core.risk(id)
ALTER TABLE core.risk_assessment_final_item_risk
  DROP CONSTRAINT IF EXISTS risk_assessment_final_item_risk_risk_catalog_id_fkey;

ALTER TABLE core.risk_assessment_final_item_risk
  ADD CONSTRAINT risk_assessment_final_item_risk_risk_catalog_id_fkey
  FOREIGN KEY (risk_catalog_id)
  REFERENCES core.risk(id)
  ON UPDATE CASCADE
  ON DELETE RESTRICT;

-- 4) Reconfigurar FK legacy map_lineal_risk_risk_control -> core.risk(id)
ALTER TABLE core.map_lineal_risk_risk_control
  DROP CONSTRAINT IF EXISTS fk_map_lineal_risk_risk_control_risk;

ALTER TABLE core.map_lineal_risk_risk_control
  ADD CONSTRAINT fk_map_lineal_risk_risk_control_risk
  FOREIGN KEY (catalog_lineal_risk_id)
  REFERENCES core.risk(id)
  ON UPDATE CASCADE
  ON DELETE RESTRICT;

COMMIT;
