-- Simplified Migration Script
SET search_path TO corpus;

-- 1. Modify security_rbac
ALTER TABLE corpus.security_rbac ADD COLUMN IF NOT EXISTS role_name VARCHAR(100);
ALTER TABLE corpus.security_rbac ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE corpus.security_rbac ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE corpus.security_rbac ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP;

-- 2. Deduplicate
DELETE FROM corpus.security_rbac a
USING corpus.security_rbac b
WHERE a.id > b.id AND a.role_code = b.role_code;

-- 3. Unique Constraint
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'security_rbac_role_code_key') THEN
        ALTER TABLE corpus.security_rbac ADD CONSTRAINT security_rbac_role_code_key UNIQUE (role_code);
    END IF;
END $$;

-- 4. Initial Roles
INSERT INTO corpus.security_rbac (role_code, role_name, is_active)
SELECT DISTINCT role_code, role_code, true 
FROM corpus.security_users 
WHERE role_code IS NOT NULL
ON CONFLICT (role_code) DO NOTHING;

-- 5. User Migration
ALTER TABLE corpus.security_users ADD COLUMN IF NOT EXISTS role_id UUID;

UPDATE corpus.security_users u
SET role_id = r.id
FROM corpus.security_rbac r
WHERE u.role_code = r.role_code
AND u.role_id IS NULL;

-- 6. UserXRbac
CREATE TABLE IF NOT EXISTS corpus.user_x_rbac (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    role_id UUID NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT user_x_rbac_pkey PRIMARY KEY (id),
    CONSTRAINT user_x_rbac_user_role_unique UNIQUE (user_id, role_id)
);

INSERT INTO corpus.user_x_rbac (user_id, role_id)
SELECT id, role_id FROM corpus.security_users WHERE role_id IS NOT NULL
ON CONFLICT DO NOTHING;
