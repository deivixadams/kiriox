export type GraphViewRow = {
  element_kind: 'node' | 'edge';
  element_key: string;
  element_data: Record<string, unknown>;
};

export type FilterCountRow = {
  value: string | null;
  count: number;
};

export type GraphFilters = {
  nodeTypes: string[];
  edgeTypes: string[];
  statuses: string[];
  search: string;
  onlyHardGate: boolean;
  onlyDependencyRoot: boolean;
  onlyPrimary: boolean;
  onlyMandatory: boolean;
  criticalityMin: number | null;
};

export type GraphResponse = {
  elements: GraphViewRow[];
  meta: {
    counts: {
      nodes: number;
      edges: number;
      total: number;
    };
    availableFilters: {
      nodeTypes: { value: string; count: number }[];
      edgeTypes: { value: string; count: number }[];
    };
  };
};

export type GraphSubgraphResponse = {
  elements: GraphViewRow[];
  meta: {
    rootNodeId: string;
    counts: {
      nodes: number;
      edges: number;
      total: number;
    };
  };
};
