-- Paso 6: permisos, licencias por modulo y activacion por empresa
-- Base de control de acceso multi-tenant:
-- auth + company membership + module enablement + permission grants.

BEGIN;

CREATE TABLE IF NOT EXISTS security.company_module (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES corpus.company(id) ON DELETE CASCADE,
  module_code text NOT NULL,
  is_enabled boolean NOT NULL DEFAULT true,
  license_status text NOT NULL DEFAULT 'active',
  starts_at timestamptz NULL,
  ends_at timestamptz NULL,
  metadata jsonb NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT company_module_unique_company_module UNIQUE (company_id, module_code)
);

CREATE INDEX IF NOT EXISTS idx_company_module_company
  ON security.company_module (company_id);

CREATE INDEX IF NOT EXISTS idx_company_module_enabled
  ON security.company_module (is_enabled, license_status);

CREATE TABLE IF NOT EXISTS security.role (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS security.permission (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  module_code text NOT NULL,
  action text NOT NULL,
  description text NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_permission_module
  ON security.permission (module_code, action);

CREATE TABLE IF NOT EXISTS security.role_permission (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL REFERENCES security.role(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES security.permission(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT role_permission_unique UNIQUE (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS security.company_user (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES corpus.company(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES security.security_users(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT company_user_unique UNIQUE (company_id, user_id)
);

CREATE TABLE IF NOT EXISTS security.user_role (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES security.security_users(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES corpus.company(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES security.role(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_role_unique UNIQUE (user_id, company_id, role_id)
);

-- Bootstrap membership using legacy tenant mapping
INSERT INTO security.company_user (company_id, user_id, is_active)
SELECT DISTINCT u.tenant_id, u.id, COALESCE(u.is_active, true)
FROM security.security_users u
LEFT JOIN security.company_user cu
  ON cu.company_id = u.tenant_id
 AND cu.user_id = u.id
WHERE u.tenant_id IS NOT NULL
  AND cu.id IS NULL;

-- Core modules always active by default for all companies
WITH base_modules AS (
  SELECT unnest(ARRAY['core', 'governance', 'security', 'benchmark']) AS module_code
)
INSERT INTO security.company_module (company_id, module_code, is_enabled, license_status)
SELECT c.id, m.module_code, true, 'active'
FROM corpus.company c
CROSS JOIN base_modules m
LEFT JOIN security.company_module cm
  ON cm.company_id = c.id
 AND cm.module_code = m.module_code
WHERE cm.id IS NULL;

COMMIT;

