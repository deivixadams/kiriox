-- Migration Script: Refactor RBAC
SET search_path TO corpus;

-- 1. Modify security_rbac to act as a Roles table
-- Add columns if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='corpus' AND table_name='security_rbac' AND column_name='role_name') THEN
        ALTER TABLE corpus.security_rbac ADD COLUMN role_name VARCHAR(100);
        ALTER TABLE corpus.security_rbac ADD COLUMN description TEXT;
        ALTER TABLE corpus.security_rbac ADD COLUMN is_active BOOLEAN DEFAULT true;
        ALTER TABLE corpus.security_rbac ADD COLUMN updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP;
    END IF;
END
$$;

-- DEDUPLICATE security_rbac before adding the unique constraint
-- We keep the first one (lowest ID) for each role_code
DELETE FROM corpus.security_rbac a
USING corpus.security_rbac b
WHERE a.id > b.id AND a.role_code = b.role_code;

-- Ensure unique role_code for the Roles table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'security_rbac_role_code_key') THEN
        ALTER TABLE corpus.security_rbac ADD CONSTRAINT security_rbac_role_code_key UNIQUE (role_code);
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not add unique constraint on role_code.';
END
$$;

-- 2. Add role_id to security_users
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='corpus' AND table_name='security_users' AND column_name='role_id') THEN
        ALTER TABLE corpus.security_users ADD COLUMN role_id UUID;
    END IF;
    
    -- Ensure the foreign key exists
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'security_users_role_id_fkey') THEN
        ALTER TABLE corpus.security_users ADD CONSTRAINT "security_users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES corpus.security_rbac("id");
    END IF;
END
$$;

-- 3. Populate security_rbac with roles from security_users (if any new ones)
INSERT INTO corpus.security_rbac (role_code, role_name, is_active)
SELECT DISTINCT role_code, role_code, true 
FROM corpus.security_users 
WHERE role_code IS NOT NULL
ON CONFLICT (role_code) DO NOTHING;

-- 4. Map users to roles by ID
UPDATE corpus.security_users u
SET role_id = r.id
FROM corpus.security_rbac r
WHERE u.role_code = r.role_code
AND u.role_id IS NULL;

-- 5. Create user_x_rbac junction table
CREATE TABLE IF NOT EXISTS corpus.user_x_rbac (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    role_id UUID NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT user_x_rbac_pkey PRIMARY KEY (id),
    CONSTRAINT user_x_rbac_userId_fkey FOREIGN KEY (user_id) REFERENCES corpus.security_users(id) ON DELETE CASCADE,
    CONSTRAINT user_x_rbac_roleId_fkey FOREIGN KEY (role_id) REFERENCES corpus.security_rbac(id) ON DELETE CASCADE,
    CONSTRAINT user_x_rbac_user_role_unique UNIQUE (user_id, role_id)
);

-- 6. Initial sync of user_x_rbac
INSERT INTO corpus.user_x_rbac (user_id, role_id)
SELECT id, role_id FROM corpus.security_users WHERE role_id IS NOT NULL
ON CONFLICT DO NOTHING;
