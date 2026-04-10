-- scripts/migrations/20260410_move_company_to_score.sql

DO $$
BEGIN
    -- Create score schema if missing
    IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'score') THEN
        CREATE SCHEMA score;
    END IF;

    -- Move table from core to score if core exists and score doesnt
    -- This handles the migration once
    IF to_regclass('core.company') IS NOT NULL AND to_regclass('score.company') IS NULL THEN
        EXECUTE 'ALTER TABLE core.company SET SCHEMA score';
    END IF;

    -- Update constraints if needed (Prisma usually handles this by mapping, 
    -- but manually check index/key names if they had 'core' prefix)
    -- The pkey was 'corpus_company_pkey' which was preserved in the core move.
END $$;
