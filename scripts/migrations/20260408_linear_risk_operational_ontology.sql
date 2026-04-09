-- 20260408_linear_risk_operational_ontology.sql
-- Objetivo: crear ontologia operativa (objetivo, macro_proceso, proceso) y mapas con significant_activity/element.

BEGIN;

CREATE SCHEMA IF NOT EXISTS linear_risk;

-- Asegurar PK en core.domain_elements para permitir FK
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'core'
      AND t.relname = 'domain_elements'
      AND c.contype = 'p'
  ) THEN
    ALTER TABLE core.domain_elements
      ADD CONSTRAINT domain_elements_pkey PRIMARY KEY (id);
  END IF;
END $$;

-- Entidades operativas
CREATE TABLE IF NOT EXISTS linear_risk.objective (
  objective_id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  objective_code varchar(100) NOT NULL,
  objective_name varchar(255) NOT NULL,
  objective_description text NULL,
  rationale jsonb NULL,
  sequence_order integer NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT objective_pkey PRIMARY KEY (objective_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_objective_company_code
  ON linear_risk.objective (company_id, objective_code);

CREATE INDEX IF NOT EXISTS idx_objective_company
  ON linear_risk.objective (company_id);

CREATE TABLE IF NOT EXISTS linear_risk.macro_process (
  macro_process_id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  macro_process_code varchar(100) NOT NULL,
  macro_process_name varchar(255) NOT NULL,
  macro_process_description text NULL,
  rationale jsonb NULL,
  sequence_order integer NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT macro_process_pkey PRIMARY KEY (macro_process_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_macro_process_company_code
  ON linear_risk.macro_process (company_id, macro_process_code);

CREATE INDEX IF NOT EXISTS idx_macro_process_company
  ON linear_risk.macro_process (company_id);

CREATE TABLE IF NOT EXISTS linear_risk.process (
  process_id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  process_code varchar(100) NOT NULL,
  process_name varchar(255) NOT NULL,
  process_description text NULL,
  rationale jsonb NULL,
  sequence_order integer NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT process_pkey PRIMARY KEY (process_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_process_company_code
  ON linear_risk.process (company_id, process_code);

CREATE INDEX IF NOT EXISTS idx_process_company
  ON linear_risk.process (company_id);

-- Mapas
CREATE TABLE IF NOT EXISTS linear_risk.map_objective_macroprocess (
  map_objective_macroprocess_id uuid NOT NULL DEFAULT gen_random_uuid(),
  objective_id uuid NOT NULL,
  macro_process_id uuid NOT NULL,
  is_primary boolean NOT NULL DEFAULT true,
  link_strength numeric(5,4) NULL,
  rationale jsonb NULL,
  sequence_order integer NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT map_objective_macroprocess_pkey PRIMARY KEY (map_objective_macroprocess_id),
  CONSTRAINT map_objective_macroprocess_objective_id_fkey
    FOREIGN KEY (objective_id)
    REFERENCES linear_risk.objective(objective_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT map_objective_macroprocess_macro_process_id_fkey
    FOREIGN KEY (macro_process_id)
    REFERENCES linear_risk.macro_process(macro_process_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_map_objective_macroprocess_pair
  ON linear_risk.map_objective_macroprocess (objective_id, macro_process_id);

CREATE INDEX IF NOT EXISTS idx_map_objective_macroprocess_objective
  ON linear_risk.map_objective_macroprocess (objective_id);

CREATE INDEX IF NOT EXISTS idx_map_objective_macroprocess_macro_process
  ON linear_risk.map_objective_macroprocess (macro_process_id);

CREATE TABLE IF NOT EXISTS linear_risk.map_macroprocess_process (
  map_macroprocess_process_id uuid NOT NULL DEFAULT gen_random_uuid(),
  macro_process_id uuid NOT NULL,
  process_id uuid NOT NULL,
  is_primary boolean NOT NULL DEFAULT true,
  link_strength numeric(5,4) NULL,
  rationale jsonb NULL,
  sequence_order integer NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT map_macroprocess_process_pkey PRIMARY KEY (map_macroprocess_process_id),
  CONSTRAINT map_macroprocess_process_macro_process_id_fkey
    FOREIGN KEY (macro_process_id)
    REFERENCES linear_risk.macro_process(macro_process_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT map_macroprocess_process_process_id_fkey
    FOREIGN KEY (process_id)
    REFERENCES linear_risk.process(process_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_map_macroprocess_process_pair
  ON linear_risk.map_macroprocess_process (macro_process_id, process_id);

CREATE INDEX IF NOT EXISTS idx_map_macroprocess_process_macro_process
  ON linear_risk.map_macroprocess_process (macro_process_id);

CREATE INDEX IF NOT EXISTS idx_map_macroprocess_process_process
  ON linear_risk.map_macroprocess_process (process_id);

CREATE TABLE IF NOT EXISTS linear_risk.map_process_significant_activity (
  map_process_significant_activity_id uuid NOT NULL DEFAULT gen_random_uuid(),
  process_id uuid NOT NULL,
  significant_activity_id uuid NOT NULL,
  is_primary boolean NOT NULL DEFAULT true,
  link_strength numeric(5,4) NULL,
  rationale jsonb NULL,
  sequence_order integer NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT map_process_significant_activity_pkey PRIMARY KEY (map_process_significant_activity_id),
  CONSTRAINT map_process_significant_activity_process_id_fkey
    FOREIGN KEY (process_id)
    REFERENCES linear_risk.process(process_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT map_process_significant_activity_significant_activity_id_fkey
    FOREIGN KEY (significant_activity_id)
    REFERENCES linear_risk.significant_activity(significant_activity_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_map_process_significant_activity_pair
  ON linear_risk.map_process_significant_activity (process_id, significant_activity_id);

CREATE INDEX IF NOT EXISTS idx_map_process_significant_activity_process
  ON linear_risk.map_process_significant_activity (process_id);

CREATE INDEX IF NOT EXISTS idx_map_process_significant_activity_activity
  ON linear_risk.map_process_significant_activity (significant_activity_id);

CREATE TABLE IF NOT EXISTS linear_risk.map_significant_activity_element (
  map_significant_activity_element_id uuid NOT NULL DEFAULT gen_random_uuid(),
  significant_activity_id uuid NOT NULL,
  element_id uuid NOT NULL,
  is_primary boolean NOT NULL DEFAULT true,
  link_strength numeric(5,4) NULL,
  rationale jsonb NULL,
  sequence_order integer NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT map_significant_activity_element_pkey PRIMARY KEY (map_significant_activity_element_id),
  CONSTRAINT map_significant_activity_element_significant_activity_id_fkey
    FOREIGN KEY (significant_activity_id)
    REFERENCES linear_risk.significant_activity(significant_activity_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT map_significant_activity_element_element_id_fkey
    FOREIGN KEY (element_id)
    REFERENCES core.domain_elements(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_map_significant_activity_element_pair
  ON linear_risk.map_significant_activity_element (significant_activity_id, element_id);

CREATE INDEX IF NOT EXISTS idx_map_significant_activity_element_activity
  ON linear_risk.map_significant_activity_element (significant_activity_id);

CREATE INDEX IF NOT EXISTS idx_map_significant_activity_element_element
  ON linear_risk.map_significant_activity_element (element_id);

COMMIT;
