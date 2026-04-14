BEGIN;

DO $$
DECLARE
  v_graph_nodes_def text;
  v_graph_master_def text;
BEGIN
  -- Rewrite dependent views before dropping risk.status
  IF to_regclass('views.graph_nodes') IS NOT NULL THEN
    SELECT pg_get_viewdef('views.graph_nodes'::regclass, true) INTO v_graph_nodes_def;
    v_graph_nodes_def := replace(
      v_graph_nodes_def,
      'r.status,',
      'CASE WHEN COALESCE(r.is_active, true) THEN ''active''::text ELSE ''inactive''::text END AS status,'
    );
    EXECUTE 'CREATE OR REPLACE VIEW views.graph_nodes AS ' || v_graph_nodes_def;
  END IF;

  IF to_regclass('views.v_graph_nodes_master') IS NOT NULL THEN
    SELECT pg_get_viewdef('views.v_graph_nodes_master'::regclass, true) INTO v_graph_master_def;
    v_graph_master_def := replace(
      v_graph_master_def,
      'COALESCE(rk.status, ''active''::text)',
      'CASE WHEN COALESCE(rk.is_active, true) THEN ''active''::text ELSE ''inactive''::text END'
    );
    EXECUTE 'CREATE OR REPLACE VIEW views.v_graph_nodes_master AS ' || v_graph_master_def;
  END IF;

  IF to_regclass('core.risk') IS NOT NULL THEN
    ALTER TABLE core.risk DROP COLUMN IF EXISTS status;
  END IF;

  IF to_regclass('corpus.risk') IS NOT NULL THEN
    ALTER TABLE corpus.risk DROP COLUMN IF EXISTS status;
  END IF;
END $$;

COMMIT;
