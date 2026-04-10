import prisma from '@/infrastructure/db/prisma/client';
import { SimulationNode, SimulationEdge, SimulationSubgraph } from '../../domain/types';

export class PrismaMonteCarloRepository {
  async getSimulationSubgraph(reinoCode: string, seedLimit: number = 30): Promise<SimulationSubgraph> {
    const allowedSeedLimits = new Set([5, 10, 15, 20, 30, 50]);
    const safeSeedLimit = allowedSeedLimits.has(Number(seedLimit)) ? Number(seedLimit) : 30;
    // 1. Resolve Reino ID
    const reinoRows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT id FROM core.reino WHERE code = $1 LIMIT 1`,
      reinoCode
    );

    if (!reinoRows.length) {
      throw new Error(`Reino with code '${reinoCode}' not found.`);
    }

    const reinoId = reinoRows[0].id;

    // 2. Fetch Top N Elements (Seeds)
    const seedNodes = await prisma.$queryRawUnsafe<any[]>(
      `SELECT 
        failed_node_id as node_id, 
        failure_impact_score
      FROM views._v_graph_failure_impact
      WHERE reino_id = $1::uuid 
        AND (failed_node_type = 'ELEMENT' OR failed_node_type = 'OBLIGATION')
      ORDER BY failure_impact_score DESC NULLS LAST
      LIMIT ${safeSeedLimit}`,
      reinoId
    );

    if (!seedNodes.length) {
      return { nodes: [], edges: [], reino: reinoCode, timestamp: new Date().toISOString() };
    }

    const seedIds = seedNodes.map(n => n.node_id);

    const runControlTables = await prisma.$queryRawUnsafe<any[]>(
      `SELECT table_name 
       FROM information_schema.tables 
       WHERE table_schema = 'score' 
         AND table_name IN ('run_control', 'run_control_draft')`
    );
    const hasRunControl = runControlTables.some((t) => t.table_name === 'run_control');
    const hasRunControlDraft = runControlTables.some((t) => t.table_name === 'run_control_draft');

    let runControlCount = 0;
    let runControlDraftCount = 0;

    if (hasRunControl) {
      const rows = await prisma.$queryRawUnsafe<any[]>(
        `SELECT count(*)::int as cnt FROM score.run_control`
      );
      runControlCount = rows[0]?.cnt ?? 0;
    }

    if (hasRunControlDraft) {
      const rows = await prisma.$queryRawUnsafe<any[]>(
        `SELECT count(*)::int as cnt FROM score.run_control_draft`
      );
      runControlDraftCount = rows[0]?.cnt ?? 0;
    }

    const scoreSource: 'run_control' | 'run_control_draft' | 'baseline' =
      runControlCount > 0 ? 'run_control' : (runControlDraftCount > 0 ? 'run_control_draft' : 'baseline');

    const runControlTable = scoreSource === 'run_control' ? 'run_control' : 'run_control_draft';
    const runTable = scoreSource === 'run_control' ? 'run' : 'run_draft';

    // 3. Relational Expansion & Score Retrieval
    // We include current operating_score and evidence_score proxies
    const data = await prisma.$queryRawUnsafe<any>(
      scoreSource === 'baseline'
      ? `
      WITH seeds AS (
        SELECT id as node_id FROM (SELECT unnest($2::uuid[]) as id) s
      ),
      -- Relationships
      risk_links AS (
        SELECT m.element_id as src, m.risk_id as dst, 'ELEMENT_HAS_RISK'::text as type, gen_random_uuid() as id
        FROM core.map_elements_risk m WHERE m.element_id IN (SELECT node_id FROM seeds)
      ),
      risk_control_links AS (
        SELECT m.risk_id as src, m.control_id as dst, 'RISK_MITIGATED_BY_CONTROL'::text as type, gen_random_uuid() as id,
               m.mitigation_strength::float / 5.0 as mitigation_strength
        FROM core.map_risk_control m WHERE m.risk_id IN (SELECT dst FROM risk_links)
      ),
      element_control_links AS (
        SELECT m.element_id as src, m.control_id as dst, 'ELEMENT_HAS_CONTROL'::text as type, gen_random_uuid() as id
        FROM core.map_elements_control m WHERE m.element_id IN (SELECT node_id FROM seeds)
      ),
      element_deps AS (
        SELECT n_src.node_id as src, n_dst.node_id as dst, 'ELEMENT_DEPENDS_ON_ELEMENT'::text as type, gen_random_uuid() as id,
               m.propagation_multiplier::float as propagation_multiplier
        FROM core.obligation_graph m
        JOIN views._v_graph_nodes_master n_src ON n_src.node_code = m.parent_obligation_code
        JOIN views._v_graph_nodes_master n_dst ON n_dst.node_code = m.child_obligation_code
        WHERE n_src.node_id IN (SELECT node_id FROM seeds)
      ),
      -- Final Edges list
      all_edges_raw AS (
        SELECT id, src, dst, type, null::float as mitigation_strength, null::float as propagation_multiplier FROM risk_links
        UNION ALL
        SELECT id, src, dst, type, mitigation_strength, null::float as propagation_multiplier FROM risk_control_links
        UNION ALL
        SELECT id, src, dst, type, null::float as mitigation_strength, null::float as propagation_multiplier FROM element_control_links
        UNION ALL
        SELECT id, src, dst, type, null::float as mitigation_strength, propagation_multiplier FROM element_deps
      ),
      all_node_ids AS (
        SELECT node_id as id FROM seeds
        UNION SELECT src FROM all_edges_raw
        UNION SELECT dst FROM all_edges_raw
      ),
      final_nodes AS (
        SELECT 
          n.node_id as id, n.node_type as type, n.node_code as code, n.node_name as name,
          COALESCE(f.failure_impact_score, 0) as failure_impact_score,
          n.is_hard_gate,
          0.7::float as operating_score,
          0.8::float as evidence_score, -- Baseline cuando no hay score
          1.0::float as design_score
        FROM views._v_graph_nodes_master n
        LEFT JOIN views._v_graph_failure_impact f ON f.failed_node_id = n.node_id AND f.reino_id = $1::uuid
        WHERE n.node_id IN (SELECT id FROM all_node_ids)
          AND n.node_type IN ('ELEMENT', 'RISK', 'CONTROL', 'OBLIGATION')
      )
      SELECT 
        (SELECT json_agg(final_nodes.*) FROM final_nodes) as nodes,
        (SELECT json_agg(all_edges_raw.*) FROM all_edges_raw) as edges
      `
      : `
      WITH seeds AS (
        SELECT id as node_id FROM (SELECT unnest($2::uuid[]) as id) s
      ),
      -- Relationships
      risk_links AS (
        SELECT m.element_id as src, m.risk_id as dst, 'ELEMENT_HAS_RISK'::text as type, gen_random_uuid() as id
        FROM core.map_elements_risk m WHERE m.element_id IN (SELECT node_id FROM seeds)
      ),
      risk_control_links AS (
        SELECT m.risk_id as src, m.control_id as dst, 'RISK_MITIGATED_BY_CONTROL'::text as type, gen_random_uuid() as id,
               m.mitigation_strength::float / 5.0 as mitigation_strength
        FROM core.map_risk_control m WHERE m.risk_id IN (SELECT dst FROM risk_links)
      ),
      element_control_links AS (
        SELECT m.element_id as src, m.control_id as dst, 'ELEMENT_HAS_CONTROL'::text as type, gen_random_uuid() as id
        FROM core.map_elements_control m WHERE m.element_id IN (SELECT node_id FROM seeds)
      ),
      element_deps AS (
        SELECT n_src.node_id as src, n_dst.node_id as dst, 'ELEMENT_DEPENDS_ON_ELEMENT'::text as type, gen_random_uuid() as id,
               m.propagation_multiplier::float as propagation_multiplier
        FROM core.obligation_graph m
        JOIN views._v_graph_nodes_master n_src ON n_src.node_code = m.parent_obligation_code
        JOIN views._v_graph_nodes_master n_dst ON n_dst.node_code = m.child_obligation_code
        WHERE n_src.node_id IN (SELECT node_id FROM seeds)
      ),
      -- Final Edges list
      all_edges_raw AS (
        SELECT id, src, dst, type, null::float as mitigation_strength, null::float as propagation_multiplier FROM risk_links
        UNION ALL
        SELECT id, src, dst, type, mitigation_strength, null::float as propagation_multiplier FROM risk_control_links
        UNION ALL
        SELECT id, src, dst, type, null::float as mitigation_strength, null::float as propagation_multiplier FROM element_control_links
        UNION ALL
        SELECT id, src, dst, type, null::float as mitigation_strength, propagation_multiplier FROM element_deps
      ),
      all_node_ids AS (
        SELECT node_id as id FROM seeds
        UNION SELECT src FROM all_edges_raw
        UNION SELECT dst FROM all_edges_raw
      ),
      -- Latest Scores for Controls
      latest_scores AS (
        SELECT DISTINCT ON (rc.control_id) rc.control_id, rc.score
        FROM score.${runControlTable} rc
        JOIN score.${runTable} r ON r.id = rc.run_id
        ORDER BY rc.control_id, r.created_at DESC
      ),
      final_nodes AS (
        SELECT 
          n.node_id as id, n.node_type as type, n.node_code as code, n.node_name as name,
          COALESCE(f.failure_impact_score, 0) as failure_impact_score,
          n.is_hard_gate,
          COALESCE(NULLIF(ls.score, 0), 0.7)::float as operating_score,
          0.8::float as evidence_score, -- Placeholder for V1
          1.0::float as design_score
        FROM views._v_graph_nodes_master n
        LEFT JOIN views._v_graph_failure_impact f ON f.failed_node_id = n.node_id AND f.reino_id = $1::uuid
        LEFT JOIN latest_scores ls ON ls.control_id = n.node_id
        WHERE n.node_id IN (SELECT id FROM all_node_ids)
          AND n.node_type IN ('ELEMENT', 'RISK', 'CONTROL', 'OBLIGATION')
      )
      SELECT 
        (SELECT json_agg(final_nodes.*) FROM final_nodes) as nodes,
        (SELECT json_agg(all_edges_raw.*) FROM all_edges_raw) as edges
      `,
      reinoId,
      seedIds
    );

    const result = data[0] || { nodes: [], edges: [] };

    const scoreCount = scoreSource === 'run_control' ? runControlCount : (scoreSource === 'run_control_draft' ? runControlDraftCount : 0);

    return {
      nodes: (result.nodes || []).map((n: any) => ({
        ...n,
        type: n.type === 'OBLIGATION' ? 'ELEMENT' : n.type,
        failure_impact_score: parseFloat(n.failure_impact_score || 0),
        operating_score: parseFloat(n.operating_score || 0),
        evidence_score: parseFloat(n.evidence_score || 0),
        design_score: parseFloat(n.design_score || 0)
      })),
      edges: (result.edges || []).map((e: any) => ({
        ...e,
        mitigation_strength: e.mitigation_strength ? parseFloat(e.mitigation_strength) : undefined,
        propagation_multiplier: e.propagation_multiplier ? parseFloat(e.propagation_multiplier) : undefined
      })),
      reino: reinoCode,
      timestamp: new Date().toISOString(),
      score_source: scoreSource,
      score_count: scoreCount,
      seed_limit: safeSeedLimit
    };
  }
}

