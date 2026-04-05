import { prisma } from '@/infrastructure/db/prisma/client';

type GraphElement = {
  element_kind: 'node' | 'edge';
  element_data: Record<string, any>;
};

export async function getFullQuestionGraphHandler(request: Request) {
  const { searchParams } = new URL(request.url);
  const reinoId = searchParams.get('reinoId');
  const types = ['ELEMENT', 'RISK', 'CONTROL'];

  const nodeParams: any[] = [types];
  let nodeWhere = `node_type = ANY($1::text[])`;
  if (reinoId) {
    nodeParams.push(reinoId);
    nodeWhere += ` AND reino_id = $${nodeParams.length}::uuid`;
  }

  const nodes = await prisma.$queryRawUnsafe<
    Array<{ node_id: string; node_type: string; node_code: string | null; node_name: string | null }>
  >(
    `SELECT node_id, node_type, node_code, node_name
     FROM "views-schema"._v_graph_nodes_master
     WHERE ${nodeWhere}`,
    ...nodeParams
  );

  const edgeParams: any[] = [types, types];
  let edgeWhere = `src_node_type = ANY($1::text[]) AND dst_node_type = ANY($2::text[])`;
  if (reinoId) {
    edgeParams.push(reinoId);
    edgeWhere += ` AND reino_id = $${edgeParams.length}::uuid`;
  }

  const edges = await prisma.$queryRawUnsafe<
    Array<{ edge_id: string; src_node_id: string; dst_node_id: string; edge_type: string | null }>
  >(
    `SELECT edge_id, src_node_id, dst_node_id, edge_type
     FROM "views-schema"._v_graph_edges_master
     WHERE ${edgeWhere}`,
    ...edgeParams
  );

  const sizeMap: Record<string, number> = {
    ELEMENT: 60,
    CONTROL: 52,
    RISK: 48,
  };

  const elements: GraphElement[] = [
    ...nodes.map((node) => ({
      element_kind: 'node' as const,
      element_data: {
        id: node.node_id,
        label: node.node_name || node.node_code || node.node_id,
        type: node.node_type,
        size: sizeMap[node.node_type] || 46,
      },
    })),
    ...edges.map((edge) => ({
      element_kind: 'edge' as const,
      element_data: {
        id: edge.edge_id,
        source: edge.src_node_id,
        target: edge.dst_node_id,
        label: edge.edge_type || 'EDGE',
      },
    })),
  ];

  return elements;
}
