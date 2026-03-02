DO $$
DECLARE
    idx RECORD;
    msg TEXT := '';
BEGIN
    FOR idx IN (SELECT indexname, indexdef FROM pg_indexes WHERE schemaname = 'corpus' AND tablename = 'security_rbac') LOOP
        msg := msg || 'Index: ' || idx.indexname || ' | Def: ' || idx.indexdef || ' || ';
    END LOOP;
    
    IF msg <> '' THEN
        RAISE EXCEPTION 'INDEXES_FOUND: %', msg;
    ELSE
        RAISE NOTICE 'No indexes found.';
    END IF;
END
$$;
