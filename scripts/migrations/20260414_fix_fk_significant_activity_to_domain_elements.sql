-- Fix FK de actividades significativas para evaluación lineal
-- Contexto: eliminar dependencia de tablas legacy _borrame-significant_activity

ALTER TABLE core.risk_assessment_draft_item
  DROP CONSTRAINT IF EXISTS risk_assessment_draft_item_significant_activity_id_fkey;

ALTER TABLE core.risk_assessment_draft_item
  ADD CONSTRAINT risk_assessment_draft_item_significant_activity_id_fkey
  FOREIGN KEY (significant_activity_id)
  REFERENCES core.domain_elements(id)
  ON UPDATE CASCADE
  ON DELETE RESTRICT
  NOT VALID;

ALTER TABLE core.risk_assessment_final_item
  DROP CONSTRAINT IF EXISTS risk_assessment_final_item_significant_activity_id_fkey;

ALTER TABLE core.risk_assessment_final_item
  ADD CONSTRAINT risk_assessment_final_item_significant_activity_id_fkey
  FOREIGN KEY (significant_activity_id)
  REFERENCES core.domain_elements(id)
  ON UPDATE CASCADE
  ON DELETE RESTRICT
  NOT VALID;
