CREATE TABLE IF NOT EXISTS core.company_ontology_assignment (
  company_id uuid PRIMARY KEY
    REFERENCES core.company(id)
    ON DELETE CASCADE,
  ontology_id uuid NOT NULL
    REFERENCES core.company_ontology(id)
    ON DELETE RESTRICT,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid NULL
);

CREATE INDEX IF NOT EXISTS idx_company_ontology_assignment_ontology
  ON core.company_ontology_assignment (ontology_id);

CREATE INDEX IF NOT EXISTS idx_company_ontology_assignment_active
  ON core.company_ontology_assignment (is_active);
