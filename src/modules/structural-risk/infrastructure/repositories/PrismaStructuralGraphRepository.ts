import { Prisma } from '@prisma/client';
import prisma from '@/infrastructure/db/prisma/client';
import type { StructuralGraphRepository } from '@/modules/structural-risk/domain/contracts/StructuralGraphRepository';
import type { FilterCountRow, GraphFilters, GraphViewRow } from '@/modules/structural-risk/domain/types/GraphTypes';

export class PrismaStructuralGraphRepository implements StructuralGraphRepository {
  async getGraphNodes(filters: GraphFilters): Promise<GraphViewRow[]> {
    const whereSql = this.buildNodeWhereSql(filters);

    return prisma.$queryRaw<GraphViewRow[]>(Prisma.sql`
      SELECT element_kind, element_key, element_data
      FROM views.cre_graph_view
      ${whereSql}
      ORDER BY element_key
    `);
  }

  async getGraphEdges(filters: GraphFilters): Promise<GraphViewRow[]> {
    const whereSql = this.buildEdgeWhereSql(filters);

    return prisma.$queryRaw<GraphViewRow[]>(Prisma.sql`
      SELECT element_kind, element_key, element_data
      FROM views.cre_graph_view
      ${whereSql}
      ORDER BY element_key
    `);
  }

  async getNodeTypeCounts(): Promise<FilterCountRow[]> {
    return prisma.$queryRaw<FilterCountRow[]>(Prisma.sql`
      SELECT element_data->>'type' AS value, COUNT(*)::int AS count
      FROM views.cre_graph_view
      WHERE element_kind = 'node'
      GROUP BY 1
      ORDER BY 1
    `);
  }

  async getEdgeTypeCounts(): Promise<FilterCountRow[]> {
    return prisma.$queryRaw<FilterCountRow[]>(Prisma.sql`
      SELECT element_data->>'edge_type' AS value, COUNT(*)::int AS count
      FROM views.cre_graph_view
      WHERE element_kind = 'edge'
      GROUP BY 1
      ORDER BY 1
    `);
  }

  async getNodeById(nodeId: string): Promise<GraphViewRow[]> {
    return prisma.$queryRaw<GraphViewRow[]>(Prisma.sql`
      SELECT element_kind, element_key, element_data
      FROM views.cre_graph_view
      WHERE element_kind = 'node'
        AND element_data->>'id' = ${nodeId}
    `);
  }

  async getEdgesByNodeId(nodeId: string): Promise<GraphViewRow[]> {
    return prisma.$queryRaw<GraphViewRow[]>(Prisma.sql`
      SELECT element_kind, element_key, element_data
      FROM views.cre_graph_view
      WHERE element_kind = 'edge'
        AND (
          element_data->>'source' = ${nodeId}
          OR element_data->>'target' = ${nodeId}
        )
      ORDER BY element_key
    `);
  }

  async getNodesByIds(nodeIds: string[]): Promise<GraphViewRow[]> {
    return prisma.$queryRaw<GraphViewRow[]>(Prisma.sql`
      SELECT element_kind, element_key, element_data
      FROM views.cre_graph_view
      WHERE element_kind = 'node'
        AND element_data->>'id' = ANY(${nodeIds}::text[])
      ORDER BY element_key
    `);
  }

  private buildNodeWhereSql(filters: GraphFilters): Prisma.Sql {
    const nodeFilters: Prisma.Sql[] = [Prisma.sql`element_kind = 'node'`];

    if (filters.nodeTypes.length > 0) {
      nodeFilters.push(Prisma.sql`element_data->>'type' = ANY(${filters.nodeTypes}::text[])`);
    }

    if (filters.statuses.length > 0) {
      nodeFilters.push(Prisma.sql`COALESCE(element_data->>'status', '') = ANY(${filters.statuses}::text[])`);
    }

    if (filters.onlyHardGate) {
      nodeFilters.push(Prisma.sql`COALESCE((element_data->>'is_hard_gate')::boolean, false) = true`);
    }

    if (filters.onlyDependencyRoot) {
      nodeFilters.push(Prisma.sql`COALESCE((element_data->>'is_dependency_root')::boolean, false) = true`);
    }

    if (filters.criticalityMin !== null) {
      nodeFilters.push(
        Prisma.sql`COALESCE(NULLIF(element_data->>'criticality', '')::int, 0) >= ${filters.criticalityMin}`
      );
    }

    if (filters.search) {
      const searchPattern = `%${filters.search}%`;
      nodeFilters.push(Prisma.sql`
        (
          COALESCE(element_data->>'code', '') ILIKE ${searchPattern}
          OR COALESCE(element_data->>'label', '') ILIKE ${searchPattern}
          OR COALESCE(element_data->>'title', '') ILIKE ${searchPattern}
          OR COALESCE(element_data->>'id', '') ILIKE ${searchPattern}
        )
      `);
    }

    return Prisma.sql`WHERE ${Prisma.join(nodeFilters, ' AND ')}`;
  }

  private buildEdgeWhereSql(filters: GraphFilters): Prisma.Sql {
    const edgeFilters: Prisma.Sql[] = [Prisma.sql`element_kind = 'edge'`];

    if (filters.edgeTypes.length > 0) {
      edgeFilters.push(Prisma.sql`element_data->>'edge_type' = ANY(${filters.edgeTypes}::text[])`);
    }

    if (filters.onlyPrimary) {
      edgeFilters.push(Prisma.sql`COALESCE((element_data->>'is_primary')::boolean, false) = true`);
    }

    if (filters.onlyMandatory) {
      edgeFilters.push(Prisma.sql`COALESCE((element_data->>'is_mandatory')::boolean, false) = true`);
    }

    if (filters.search) {
      const searchPattern = `%${filters.search}%`;
      edgeFilters.push(Prisma.sql`
        (
          COALESCE(element_data->>'code', '') ILIKE ${searchPattern}
          OR COALESCE(element_data->>'label', '') ILIKE ${searchPattern}
          OR COALESCE(element_data->>'title', '') ILIKE ${searchPattern}
          OR COALESCE(element_data->>'id', '') ILIKE ${searchPattern}
        )
      `);
    }

    return Prisma.sql`WHERE ${Prisma.join(edgeFilters, ' AND ')}`;
  }
}

