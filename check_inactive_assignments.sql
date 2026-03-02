SELECT u.email, r.role_code 
FROM corpus.security_users u
JOIN corpus.security_rbac r ON u.role_id = r.id
WHERE r.is_active = false;
