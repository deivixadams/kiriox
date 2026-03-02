-- Step 1: Add columns to security_rbac
ALTER TABLE corpus.security_rbac ADD COLUMN IF NOT EXISTS role_name VARCHAR(100);
ALTER TABLE corpus.security_rbac ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE corpus.security_rbac ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE corpus.security_rbac ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP;
