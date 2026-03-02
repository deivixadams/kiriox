-- Step 2: Populate security_rbac
-- Deduplicate first
DELETE FROM corpus.security_rbac a
USING corpus.security_rbac b
WHERE a.id > b.id AND a.role_code = b.role_code;

-- Ensure unique constraint
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'security_rbac_role_code_key') THEN
        ALTER TABLE corpus.security_rbac ADD CONSTRAINT security_rbac_role_code_key UNIQUE (role_code);
    END IF;
END $$;

-- Insert roles
INSERT INTO corpus.security_rbac (role_code, role_name, is_active)
SELECT DISTINCT role_code, role_code, true 
FROM corpus.security_users 
WHERE role_code IS NOT NULL
ON CONFLICT (role_code) DO NOTHING;
