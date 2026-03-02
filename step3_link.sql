-- Step 3: Link Users
ALTER TABLE corpus.security_users ADD COLUMN IF NOT EXISTS role_id UUID;

UPDATE corpus.security_users u
SET role_id = r.id
FROM corpus.security_rbac r
WHERE u.role_code = r.role_code
AND u.role_id IS NULL;

-- Step 4: Create junction table
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
ON CONFLICT (user_id, role_id) DO NOTHING;
