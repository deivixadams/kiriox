-- Check if role_code column exists in security_users
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'security_users' 
  AND table_schema = 'corpus' 
  AND column_name = 'role_code';

-- Check role metadata in security_rbac
SELECT role_code, role_name, description 
FROM corpus.security_rbac 
WHERE role_code IN ('ADMIN', 'OPERATOR', 'AUDITOR');
