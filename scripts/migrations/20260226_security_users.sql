-- 2026-02-26: Security user scope + activation fields

ALTER TABLE corpus.security_users
  ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_login_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS password_updated_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS activation_status text NOT NULL DEFAULT 'pending';

CREATE UNIQUE INDEX IF NOT EXISTS idx_security_users_email_unique
  ON corpus.security_users(email);

CREATE TABLE IF NOT EXISTS corpus.security_user_scope (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES corpus.security_users(id) ON DELETE CASCADE,
  jurisdiction_id uuid NULL REFERENCES corpus.jurisdiction(id),
  framework_version_id uuid NULL REFERENCES corpus.framework_version(id),
  domain_id uuid NULL REFERENCES corpus.domain(id),
  is_allowed boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_security_user_scope_unique
  ON corpus.security_user_scope(user_id, jurisdiction_id, framework_version_id, domain_id);

CREATE TABLE IF NOT EXISTS corpus.security_user_token (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES corpus.security_users(id) ON DELETE CASCADE,
  token_hash text NOT NULL,
  token_type text NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL
);

CREATE INDEX IF NOT EXISTS idx_security_user_token_user ON corpus.security_user_token(user_id);
CREATE INDEX IF NOT EXISTS idx_security_user_token_exp ON corpus.security_user_token(expires_at);
