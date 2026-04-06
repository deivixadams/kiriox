import prisma from '@/infrastructure/db/prisma/client';

export interface SimulationGraphNode {
  node_id: string;
  node_type: 'ELEMENT' | 'RISK' | 'CONTROL';
  node_code: string;
  node_name: string;
  description?: string;
  failure_impact_score: number;
  total_degree: number;
  weighted_total_degree: number;
  redundancy_class?: string;
  single_point_of_failure_flag: boolean;
  low_redundancy_flag: boolean;
  is_hard_gate: boolean;
  is_dependency_root: boolean;
  structural_weight: number;
}

export interface SimulationGraphEdge {
  edge_id: string;
  edge_type: string;
  src_node_id: string;
  dst_node_id: string;
  src_node_type: string;
  dst_node_type: string;
  edge_weight: number;
  propagation_multiplier: number;
  is_primary: boolean;
}

export class PrismaSimulationGraphRepository {
  /**
   * Reconstructs the 3D simulation topology using the Real Graph Pipeline:
   * 1. Seed: Top 50 Elements by failure_impact_score.
   * 2. Expansion: Relate Risks and Controls (ELEMENT_HAS_RISK, ELEMENT_HAS_CONTROL).
   * 3. Integration: Add Risk-Mitigation and Element Dependencies.
   * 4. Trimming: Ensure sub-graph integrity and limit to target sizes.
   */
  async getSimulationTopology(reinoCode: string): Promise<{ nodes: SimulationGraphNode[], edges: SimulationGraphEdge[] }> {
    // 1. Resolve Reino ID from Code
    const reinoRows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT id FROM core.reino WHERE code = $1 LIMIT 1`,
      reinoCode
    );

    if (!reinoRows.length) {
      throw new Error(`Reino with code '${reinoCode}' not found.`);
    }

    const reinoId = reinoRows[0].id;

    // 2. Fetch Seeds (Top 50 Elements)
    // We use the failure_impact view specifically for ELEMENTS
    const seedNodes = await prisma.$queryRawUnsafe<any[]>(
      `SELECT 
        failed_node_id as node_id, 
        failure_impact_score
      FROM "views-schema"._v_graph_failure_impact
      WHERE reino_id = $1::uuid 
        AND (failed_node_type = 'ELEMENT' OR failed_node_type = 'OBLIGATION')
      ORDER BY failure_impact_score DESC NULLS LAST
      LIMIT 50`,
      reinoId
    );

    if (!seedNodes.length) return { nodes: [], edges: [] };

    const seedIds = seedNodes.map(n => n.node_id);

    // 3. Relational Expansion via Core Mapping Tables
    // This is the source of truth for Kiriox relationships
    const graphData = await prisma.$queryRawUnsafe<any>(
      `
      WITH seeds AS (
        SELECT id as node_id FROM (SELECT unnest($2::uuid[]) as id) s
      ),
      -- 1. Get Risks from Elements
      risk_links AS (
        SELECT 
          m.element_id as src_node_id, 
          m.risk_id as dst_node_id, 
          'ELEMENT_HAS_RISK'::text as edge_type,
          gen_random_uuid() as edge_id
        FROM core.map_elements_risk m
        WHERE m.element_id IN (SELECT node_id FROM seeds)
      ),
      -- 2. Get Controls from Risks
      risk_control_links AS (
        SELECT 
          m.risk_id as src_node_id, 
          m.control_id as dst_node_id, 
          'RISK_MITIGATED_BY_CONTROL'::text as edge_type,
          gen_random_uuid() as edge_id
        FROM core.map_risk_control m
        WHERE m.risk_id IN (SELECT dst_node_id FROM risk_links)
      ),
      -- 3. Get Direct Controls from Elements
      element_control_links AS (
        SELECT 
          m.element_id as src_node_id, 
          m.control_id as dst_node_id, 
          'ELEMENT_HAS_CONTROL'::text as edge_type,
          gen_random_uuid() as edge_id
        FROM core.map_elements_control m
        WHERE m.element_id IN (SELECT node_id FROM seeds)
      ),
      all_edges AS (
        SELECT * FROM risk_links
        UNION ALL
        SELECT * FROM risk_control_links
        UNION ALL
        SELECT * FROM element_control_links
      ),
      all_node_ids AS (
        SELECT node_id as id FROM seeds
        UNION
        SELECT src_node_id FROM all_edges
        UNION
        SELECT dst_node_id FROM all_edges
      ),
      final_nodes AS (
        SELECT 
          n.node_id,
          n.node_type,
          n.node_code,
          n.node_name,
          COALESCE(f.failure_impact_score, 0) as failure_impact_score,
          COALESCE(d.total_degree, 0) as total_degree,
          n.is_hard_gate,
          n.structural_weight
        FROM "views-schema"._v_graph_nodes_master n
        LEFT JOIN "views-schema"._v_graph_failure_impact f ON f.failed_node_id = n.node_id AND f.reino_id = $1::uuid
        LEFT JOIN "views-schema"._v_graph_node_degree d ON d.node_id = n.node_id
        WHERE n.node_id IN (SELECT id FROM all_node_ids)
          AND n.node_type IN ('ELEMENT', 'RISK', 'CONTROL', 'OBLIGATION')
      )
      SELECT 
        (SELECT json_agg(final_nodes.*) FROM final_nodes) as nodes,
        (SELECT json_agg(all_edges.*) FROM all_edges) as edges
      `,
      reinoId,
      seedIds
    );

    const result = graphData[0] || { nodes: [], edges: [] };
    
    console.log(`[Simulation API] Success. Nodes: ${result.nodes?.length || 0}, Edges: ${result.edges?.length || 0}`);

    return {
      nodes: (result.nodes || []).map((n: any) => ({
        ...n,
        node_type: n.node_type === 'OBLIGATION' ? 'ELEMENT' : n.node_type,
        failure_impact_score: parseFloat(n.failure_impact_score || 0),
        structural_weight: parseFloat(n.structural_weight || 0)
      })),
      edges: (result.edges || []).map((e: any) => ({
        ...e,
        edge_weight: parseFloat(e.edge_weight || 1),
        propagation_multiplier: parseFloat(e.propagation_multiplier || 1)
      }))
    };
  }
}
