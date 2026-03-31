import type { FilterCountRow, GraphFilters, GraphViewRow } from '../types/GraphTypes';

export interface StructuralGraphRepository {
  getGraphNodes(filters: GraphFilters): Promise<GraphViewRow[]>;
  getGraphEdges(filters: GraphFilters): Promise<GraphViewRow[]>;
  getNodeTypeCounts(): Promise<FilterCountRow[]>;
  getEdgeTypeCounts(): Promise<FilterCountRow[]>;
  getNodeById(nodeId: string): Promise<GraphViewRow[]>;
  getEdgesByNodeId(nodeId: string): Promise<GraphViewRow[]>;
  getNodesByIds(nodeIds: string[]): Promise<GraphViewRow[]>;
}
