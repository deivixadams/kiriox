-- Paso: License Management (solo admin)
-- Fecha: 2026-03-31

CREATE TABLE IF NOT EXISTS security.company_license (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  plan_code varchar(100) NOT NULL,
  plan_name varchar(150) NOT NULL,
  license_key text NULL,
  status text NOT NULL DEFAULT 'uploaded',
  issued_at timestamptz NULL,
  expires_at timestamptz NOT NULL,
  max_users integer NULL,
  max_runs_monthly integer NULL,
  max_storage_gb integer NULL,
  max_modules integer NULL,
  allowed_modules text[] NOT NULL DEFAULT ARRAY[]::text[],
  file_name text NULL,
  file_path text NULL,
  file_hash text NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid NULL,
  validated_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_company_license_company_created
  ON security.company_license (company_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_company_license_status_expiry
  ON security.company_license (status, expires_at);

CREATE TABLE IF NOT EXISTS security.company_license_event (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  license_id uuid NULL,
  event_type text NOT NULL,
  event_status text NOT NULL DEFAULT 'success',
  notes text NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  performed_by uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_company_license_event_company_created
  ON security.company_license_event (company_id, created_at DESC);
