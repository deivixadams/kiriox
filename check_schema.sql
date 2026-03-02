SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'security_users' AND table_schema = 'corpus';
SELECT id, role_code, role_name, description FROM corpus.security_rbac;
