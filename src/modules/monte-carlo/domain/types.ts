export type SimulationNodeType = 'ELEMENT' | 'RISK' | 'CONTROL';

export interface SimulationNode {
  id: string;
  type: SimulationNodeType;
  code: string;
  name: string;
  failure_impact_score: number;
  
  // Baseline scores for Controls
  design_score?: number;
  operating_score?: number;
  evidence_score?: number;
  test_score?: number;
  is_hard_gate?: boolean;
}

export interface SimulationEdge {
  id: string;
  src: string;
  dst: string;
  type: 'ELEMENT_DEPENDS_ON_ELEMENT' | 'ELEMENT_HAS_RISK' | 'ELEMENT_HAS_CONTROL' | 'RISK_MITIGATED_BY_CONTROL';
  
  // Baseline mitigation
  mitigation_strength?: number;
  propagation_multiplier?: number;
}

export interface SimulationSubgraph {
  nodes: SimulationNode[];
  edges: SimulationEdge[];
  reino: string;
  timestamp: string;
  score_source?: 'run_control' | 'run_control_draft' | 'baseline';
  score_count?: number;
  seed_limit?: number;
}

export interface MonteCarloIterationResult {
  iteration: number;
  global_fragility: number;
  critical_risks_count: number;
  active_hard_gates_count: number;
  
  // Per-node sampled/calculated values for sensitivity analysis
  node_results: Record<string, {
    simulated_score: number;
    simulated_effectiveness?: number;
    impacted: boolean;
  }>;
}

export interface MonteCarloSummary {
  mean_fragility: number;
  p50_fragility: number;
  p90_fragility: number;
  p95_fragility: number;
  p99_fragility: number;
  trigger_probability: number;
  hard_gate_activation_freq: number;
  expected_critical_risks: number;
  
  // Sensitivity: Control variance contribution
  top_variance_controls: Array<{
    node_id: string;
    node_name: string;
    variance_contribution: number;
  }>;
  
  // Sensitivity: Nodes most exposed
  top_exposed_elements: Array<{
    node_id: string;
    node_name: string;
    exposure_frequency: number;
  }>;
}

export interface SimulationRunMetadata {
  reino: string;
  iterations: number;
  seed: string;
  hash: string;
  timestamp: string;
}

export interface MonteCarloRunMetadata {
  reino: string;
  iterations: number;
  seed_limit: number;
  seed: string;
  timestamp: string;
  node_count: number;
  edge_count: number;
  score_source: 'run_control' | 'run_control_draft' | 'baseline';
  score_count: number;
}
