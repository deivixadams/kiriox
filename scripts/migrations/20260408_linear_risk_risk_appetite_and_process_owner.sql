-- 20260408_linear_risk_risk_appetite_and_process_owner.sql
-- Objetivo: agregar tabla risk_appetite y process_owner_user_id en linear_risk.process

BEGIN;

-- Tabla de apetito de riesgo
CREATE TABLE IF NOT EXISTS linear_risk.risk_appetite (
  risk_appetite_id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  appetite_code varchar(100) NOT NULL,
  appetite_name varchar(255) NOT NULL,
  appetite_description text NULL,
  rationale jsonb NULL,
  sequence_order integer NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT risk_appetite_pkey PRIMARY KEY (risk_appetite_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_risk_appetite_company_code
  ON linear_risk.risk_appetite (company_id, appetite_code);

CREATE INDEX IF NOT EXISTS idx_risk_appetite_company
  ON linear_risk.risk_appetite (company_id);

-- Process owner
ALTER TABLE linear_risk.process
  ADD COLUMN IF NOT EXISTS process_owner_user_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'linear_risk'
      AND t.relname = 'process'
      AND c.conname = 'process_owner_user_id_fkey'
  ) THEN
    ALTER TABLE linear_risk.process
      ADD CONSTRAINT process_owner_user_id_fkey
      FOREIGN KEY (process_owner_user_id)
      REFERENCES security.security_users(id)
      ON UPDATE CASCADE
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_process_owner_user_id
  ON linear_risk.process (process_owner_user_id);

COMMIT;
