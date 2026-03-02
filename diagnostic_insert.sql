DO $$
BEGIN
    INSERT INTO corpus.security_rbac (role_code, role_name, is_active)
    SELECT DISTINCT role_code, role_code, true 
    FROM corpus.security_users 
    WHERE role_code IS NOT NULL;
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'INSERT_FAILED: %, SQLSTATE: %, Detail: %', SQLERRM, SQLSTATE, 'Check constraints or indexes';
END
$$;
