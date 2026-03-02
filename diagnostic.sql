SELECT 'USERS_COUNT' as label, count(*) FROM security.security_users;
SELECT 'ROLES_COUNT' as label, count(*) FROM security.security_rbac;
SELECT email, role_code FROM security.security_users u JOIN security.security_rbac r ON u.role_id = r.id LIMIT 5;
