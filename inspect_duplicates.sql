DO $$
DECLARE
    r RECORD;
    msg TEXT := '';
BEGIN
    FOR r IN (SELECT role_code, COUNT(*) as c FROM corpus.security_rbac GROUP BY role_code HAVING COUNT(*) > 1) LOOP
        msg := msg || 'Role: ' || r.role_code || ', Count: ' || r.c || ' | ';
    END LOOP;
    
    IF msg <> '' THEN
        RAISE EXCEPTION 'DUPLICATES_FOUND: %', msg;
    ELSE
        RAISE NOTICE 'No duplicates found.';
    END IF;
END
$$;
