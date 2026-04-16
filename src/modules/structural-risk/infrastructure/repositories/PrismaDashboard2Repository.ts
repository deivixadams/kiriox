import { Prisma } from '@prisma/client';
import prisma from '@/infrastructure/db/prisma/client';
import type { OverviewEdge, OverviewNode, TopItem } from '@/modules/structural-risk/domain/types/Dashboard2Types';

export class PrismaDashboard2Repository {
  async getOverviewNodes(): Promise<OverviewNode[]> {
    const rows = await prisma.$queryRaw<OverviewNode[]>(Prisma.sql`
      WITH fi AS (
        SELECT failed_node_id, MAX(failure_impact_score) AS failure_impact_score
        FROM views._v_graph_failure_impact
        GROUP BY failed_node_id
      ),
      nd AS (
        SELECT node_id, MAX(weighted_total_degree) AS weighted_total_degree
        FROM views._v_graph_node_degree
        GROUP BY node_id
      )
      SELECT
        n.node_id,
        n.node_code,
        n.node_name,
        n.node_type,
        COALESCE(n.reino_id, er.reino_id, ec.reino_id) as reino_id,
        COALESCE(n.reino_code, er.reino_code, ec.reino_code) as reino_code,
        COALESCE(n.structural_weight::float, 0)       AS structural_weight,
        COALESCE(n.is_hard_gate, false)               AS is_hard_gate,
        COALESCE(n.is_dependency_root, false)         AS is_dependency_root,
        COALESCE(fi.failure_impact_score::float, 0)   AS failure_impact_score,
        COALESCE(nd.weighted_total_degree::float, 0)  AS total_degree
      FROM views._v_graph_nodes_master n
      -- Propagar reino desde elementos a riesgos
      LEFT JOIN (
        SELECT mer.risk_id, e.reino_id, e.reino_code
        FROM core.map_elements_risk mer
        JOIN views._v_graph_nodes_master e ON mer.element_id = e.node_id
      ) er ON n.node_id = er.risk_id
      -- Propagar reino desde riesgos a controles (o elementos a controles)
      LEFT JOIN (
        SELECT mrc.control_id, e.reino_id, e.reino_code
        FROM core.map_risk_control mrc
        JOIN core.map_elements_risk mer ON mrc.risk_id = mer.risk_id
        JOIN views._v_graph_nodes_master e ON mer.element_id = e.node_id
      ) ec ON n.node_id = ec.control_id
      LEFT JOIN fi ON fi.failed_node_id = n.node_id
      LEFT JOIN nd ON nd.node_id       = n.node_id
      ORDER BY
        COALESCE(fi.failure_impact_score, 0) +
        COALESCE(n.structural_weight, 0)     DESC
    `);

    // DEBUG: muestra los node_type distintos que llegan de la vista
    const types = [...new Set(rows.map((r) => r.node_type))];
    console.log('[Dashboard2] node_types en _v_graph_nodes_master:', types);

    return rows.map((r) => ({
      ...r,
      structural_weight:    Number(r.structural_weight ?? 0),
      is_hard_gate:         Boolean(r.is_hard_gate),
      is_dependency_root:   Boolean(r.is_dependency_root),
      failure_impact_score: Number(r.failure_impact_score ?? 0),
      total_degree:         Number(r.total_degree ?? 0),
    }));
  }

  async getOverviewEdges(nodeIds: string[]): Promise<OverviewEdge[]> {
    if (!nodeIds.length) return [];

    const rows = await prisma.$queryRawUnsafe<OverviewEdge[]>(`
      SELECT
        edge_id::text,
        src_node_id::text,
        dst_node_id::text,
        edge_type,
        COALESCE(edge_weight::float, 0.5) AS edge_weight
      FROM views._v_graph_edges_master
      WHERE COALESCE(is_active, true) = true

      UNION ALL

      -- Element -> Risk
      SELECT
        CONCAT('er_', element_id, '_', risk_id) as edge_id,
        element_id::text as src_node_id,
        risk_id::text as dst_node_id,
        'ELEMENT_HAS_RISK' as edge_type,
        0.8 as edge_weight
      FROM core.map_elements_risk

      UNION ALL

      -- Risk -> Control
      SELECT
        CONCAT('rc_', risk_id, '_', control_id) as edge_id,
        risk_id::text as src_node_id,
        control_id::text as dst_node_id,
        'RISK_HAS_CONTROL' as edge_type,
        0.8 as edge_weight
      FROM core.map_risk_control
    `);

    return rows.map((r) => ({
      ...r,
      edge_weight: Number(r.edge_weight ?? 0.5),
    }));
  }

  async getTopControls(): Promise<TopItem[]> {
    const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT * FROM views.dashboard_top10_controls LIMIT 10`
    );
    return rows.map((r) => ({
      id:    String(r.control_id ?? r.id ?? ''),
      code:  r.control_code != null ? String(r.control_code) : null,
      name:  String(r.control_name ?? r.control_description ?? r.description ?? r.name ?? r.nombre ?? ''),
      score: Number(r.structural_score ?? r.score ?? r.rank ?? 0),
      ...r,
    }));
  }

  async getUltraCritical(): Promise<TopItem[]> {
    const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT * FROM views.v_ultra_critical_controls LIMIT 10`
    );
    return rows.map((r) => ({
      id:    String(r.control_id ?? r.id ?? ''),
      code:  r.control_code != null ? String(r.control_code) : null,
      name:  String(r.control_name ?? r.control_description ?? r.description ?? r.name ?? r.nombre ?? ''),
      score: Number(r.structural_score ?? r.score ?? r.rank ?? 0),
      ...r,
    }));
  }

  async getFragileNodes(): Promise<TopItem[]> {
    const rows = await prisma.$queryRaw<{
      node_id: string;
      node_code: string | null;
      node_name: string | null;
      node_type: string | null;
      weighted_total_degree: unknown;
    }[]>(Prisma.sql`
      SELECT node_id, node_code, node_name, node_type, weighted_total_degree
      FROM views._v_graph_node_redundancy
      ORDER BY weighted_total_degree ASC NULLS LAST
      LIMIT 10
    `);
    return rows.map((r) => ({
      id:    r.node_id,
      code:  r.node_code,
      name:  r.node_name,
      score: Number(r.weighted_total_degree ?? 0),
      type:  r.node_type,
    }));
  }
}
