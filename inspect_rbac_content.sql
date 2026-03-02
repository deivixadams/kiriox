DO $$
DECLARE
    cnt INT;
    r RECORD;
    msg TEXT := '';
BEGIN
    SELECT COUNT(*) INTO cnt FROM corpus.security_rbac;
    msg := 'Total rows: ' || cnt || ' | ';
    
    FOR r IN (SELECT id, role_code FROM corpus.security_rbac LIMIT 5) LOOP
        msg := msg || 'Row: (' || r.id || ', ' || r.role_code || ') | ';
    END LOOP;
    
    RAISE EXCEPTION 'RBAC_CONTENT: %', msg;
END
$$;
