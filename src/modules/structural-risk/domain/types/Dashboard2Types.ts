export type OverviewNode = {
  node_id: string;
  node_code: string | null;
  node_name: string | null;
  node_type: string;
  reino_id: string | null;
  reino_code: string | null;
  structural_weight: number;
  is_hard_gate: boolean;
  is_dependency_root: boolean;
  failure_impact_score: number;
  total_degree: number;
};

export type OverviewEdge = {
  edge_id: string;
  src_node_id: string;
  dst_node_id: string;
  edge_type: string | null;
  edge_weight: number;
};

export type OverviewResponse = {
  nodes: OverviewNode[];
  edges: OverviewEdge[];
  meta: {
    node_count: number;
    edge_count: number;
  };
};

export type TopItem = {
  id: string;
  code: string | null;
  name: string | null;
  score: number;
  [key: string]: unknown;
};

export type TopRankingsResponse = {
  top_controls: TopItem[];
  ultra_critical: TopItem[];
  fragile_nodes: TopItem[];
};
