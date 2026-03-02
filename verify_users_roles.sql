-- Check users and their current roles (joined)
SELECT 
    u.email, 
    u.name, 
    r.role_code, 
    r.is_active as role_is_active
FROM corpus.security_users u
LEFT JOIN corpus.security_rbac r ON u.role_id = r.id;

-- Check for any users with NULL roles or inactive roles
SELECT COUNT(*) as problem_users
FROM corpus.security_users
WHERE role_id IS NULL 
   OR role_id IN (SELECT id FROM corpus.security_rbac WHERE is_active = false);
