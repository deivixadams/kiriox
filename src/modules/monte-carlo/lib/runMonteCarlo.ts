import { 
  SimulationSubgraph, 
  MonteCarloIterationResult, 
  MonteCarloSummary, 
  SimulationNode 
} from '../domain/types';
import { RandomGenerator, getControlEffectiveness } from './sampleDistributions';

export function runMonteCarlo(
  subgraph: SimulationSubgraph, 
  iterations: number = 2000, 
  seed: string = 'kiriox-v1-default',
  options?: {
    reportEvery?: number;
    onProgress?: (payload: {
      iteration: number;
      total: number;
      active_controls: string[];
    }) => void;
  }
): { summary: MonteCarloSummary; iterations: MonteCarloIterationResult[] } {
  const rng = new RandomGenerator(seed);
  const results: MonteCarloIterationResult[] = [];
  const reportEvery = Math.max(1, options?.reportEvery ?? 200);
  
  const nodes = subgraph.nodes;
  const edges = subgraph.edges;

  const controlNodes = nodes.filter(n => n.type === 'CONTROL');
  const riskNodes = nodes.filter(n => n.type === 'RISK');
  const elementNodes = nodes.filter(n => n.type === 'ELEMENT');
  const hardGateNodes = nodes.filter(n => n.is_hard_gate);
  const elementImpactById = new Map(elementNodes.map(el => [el.id, el.failure_impact_score || 0]));
  const riskImpactById = new Map<string, number>();

  riskNodes.forEach(risk => {
    const linkedElements = edges
      .filter(e => e.type === 'ELEMENT_HAS_RISK' && e.dst === risk.id)
      .map(e => elementImpactById.get(e.src) || 0);
    const maxElementImpact = linkedElements.length > 0 ? Math.max(...linkedElements) : 0;
    const baseImpact = Math.max(risk.failure_impact_score || 0, maxElementImpact);
    riskImpactById.set(risk.id, baseImpact);
  });

  let lastActiveControls: string[] = [];

  for (let i = 0; i < iterations; i++) {
    const nodeResults: MonteCarloIterationResult['node_results'] = {};
    const activeControls: string[] = [];
    
    // 1. Sample Controls Uncertainty
    controlNodes.forEach(ctrl => {
      // Uncertainty on operating and evidence
      const opSampled = rng.beta(5, 2) * (ctrl.operating_score || 0.7);
      const evSampled = rng.beta(8, 2) * (ctrl.evidence_score || 0.8);
      const coverageSampled = rng.triangular(0.8, 1.0, 0.95);
      
      const effectiveness = getControlEffectiveness(
        ctrl.design_score || 1.0,
        1.0, // formalization
        opSampled,
        evSampled
      ) * coverageSampled;

      nodeResults[ctrl.id] = {
        simulated_score: opSampled,
        simulated_effectiveness: effectiveness,
        impacted: effectiveness < 0.6
      };

      if (effectiveness < 0.6) {
        activeControls.push(ctrl.id);
      }
    });

    // 2. Risk Mitigation & Residual Risk
    riskNodes.forEach(risk => {
      const mitigators = edges.filter(e => e.dst === risk.id && e.type === 'RISK_MITIGATED_BY_CONTROL');
      
      let mitigation_total = 0;
      if (mitigators.length > 0) {
        let mitigation_product = 1;
        mitigators.forEach(edge => {
          const ctrlId = edge.src;
          const ctrlEff = nodeResults[ctrlId]?.simulated_effectiveness || 0;
          const strength = edge.mitigation_strength || 0.6; // [0..1]
          mitigation_product *= (1 - (strength * ctrlEff));
        });
        mitigation_total = 1 - mitigation_product;
      }

      const baseImpact = riskImpactById.get(risk.id) || 0;
      const intrinsic_risk = 0.65 + Math.min(0.35, (baseImpact / 100) * 0.35);
      const residual_risk = intrinsic_risk * (1 - mitigation_total);

      nodeResults[risk.id] = {
        simulated_score: residual_risk,
        impacted: residual_risk > 0.8 // Trigger threshold for "High Exposure"
      };
    });

    // 3. Structural Fragility Aggregation
    // In V1, fragility is the weighted average of residual risks on top Elements
    let global_fragility_acc = 0;
    let critical_risks = 0;
    let triggers = 0;

    elementNodes.forEach(element => {
      const risksOfElement = edges.filter(e => e.src === element.id && e.type === 'ELEMENT_HAS_RISK');
      
      let element_exposure = 0;
      risksOfElement.forEach(e => {
        const riskScore = nodeResults[e.dst]?.simulated_score || 0;
        element_exposure = Math.max(element_exposure, riskScore);
      });

      nodeResults[element.id] = {
        simulated_score: element_exposure,
        impacted: element_exposure > 0.7
      };

      global_fragility_acc += element_exposure * (element.failure_impact_score / 100 + 1);
    });

    // 4. Critical Risks (direct count over risk nodes)
    riskNodes.forEach(risk => {
      const riskScore = nodeResults[risk.id]?.simulated_score || 0;
      if (riskScore > 0.7) critical_risks++;
    });

    // 5. Hard Gate Activation (type-aware)
    hardGateNodes.forEach(node => {
      if (node.type === 'CONTROL') {
        const eff = nodeResults[node.id]?.simulated_effectiveness ?? 1;
        if (eff < 0.6) triggers++;
      } else if (node.type === 'RISK') {
        const score = nodeResults[node.id]?.simulated_score ?? 0;
        if (score > 0.9) triggers++;
      } else if (node.type === 'ELEMENT') {
        const risksOfElement = edges.filter(e => e.src === node.id && e.type === 'ELEMENT_HAS_RISK');
        let element_exposure = 0;
        risksOfElement.forEach(e => {
          const riskScore = nodeResults[e.dst]?.simulated_score || 0;
          element_exposure = Math.max(element_exposure, riskScore);
        });
        if (element_exposure > 0.9) triggers++;
      }
    });

    results.push({
      iteration: i,
      global_fragility: global_fragility_acc / (elementNodes.length || 1),
      critical_risks_count: critical_risks,
      active_hard_gates_count: triggers,
      node_results: nodeResults
    });

    lastActiveControls = activeControls;

    if (options?.onProgress && (i + 1) % reportEvery === 0) {
      options.onProgress({
        iteration: i + 1,
        total: iterations,
        active_controls: lastActiveControls.slice(0, 20)
      });
    }
  }

  const summary = aggregateResults(results, subgraph);

  return { summary, iterations: results };
}

function aggregateResults(iterations: MonteCarloIterationResult[], subgraph: SimulationSubgraph): MonteCarloSummary {
  const fragilityValues = iterations.map(it => it.global_fragility).sort((a,b) => a-b);
  const len = fragilityValues.length;

  const mean_fragility = fragilityValues.reduce((a,b) => a+b, 0) / len;
  const p50 = fragilityValues[Math.floor(len * 0.5)];
  const p90 = fragilityValues[Math.floor(len * 0.9)];
  const p95 = fragilityValues[Math.floor(len * 0.95)];
  const p99 = fragilityValues[Math.floor(len * 0.99)];

  const trigger_sum = iterations.reduce((a,b) => a + (b.active_hard_gates_count > 0 ? 1 : 0), 0);
  const critical_risks_mean = iterations.reduce((a,b) => a + b.critical_risks_count, 0) / len;

  // Variance Analysis (Top Controls)
  const controls = subgraph.nodes.filter(n => n.type === 'CONTROL');
  const controlVarianceRaw = controls.map(ctrl => {
    let sum = 0;
    let sumSq = 0;
    let count = 0;
    for (const it of iterations) {
      const eff = it.node_results[ctrl.id]?.simulated_effectiveness;
      if (eff === undefined) continue;
      sum += eff;
      sumSq += eff * eff;
      count += 1;
    }
    const mean = count > 0 ? sum / count : 0;
    const variance = count > 0 ? (sumSq / count) - (mean * mean) : 0;
    return {
      node_id: ctrl.id,
      node_name: ctrl.name,
      variance
    };
  });

  const totalVariance = controlVarianceRaw.reduce((acc, v) => acc + v.variance, 0);
  const controlVariance = controlVarianceRaw.map(v => ({
    node_id: v.node_id,
    node_name: v.node_name,
    variance_contribution: totalVariance > 0 ? (v.variance / totalVariance) * 100 : 0
  })).sort((a,b) => b.variance_contribution - a.variance_contribution).slice(0, 10);

  const exposedElements = subgraph.nodes.filter(n => n.type === 'ELEMENT').map(el => {
    const hits = iterations.filter(it => (it.node_results[el.id]?.simulated_score || 0) > 0.7).length;
    return {
      node_id: el.id,
      node_name: el.name,
      exposure_frequency: hits / len
    };
  }).sort((a,b) => b.exposure_frequency - a.exposure_frequency).slice(0, 10);

  return {
    mean_fragility,
    p50_fragility: p50,
    p90_fragility: p90,
    p95_fragility: p95,
    p99_fragility: p99,
    trigger_probability: trigger_sum / len,
    hard_gate_activation_freq: iterations.reduce((a,b) => a + b.active_hard_gates_count, 0) / len,
    expected_critical_risks: critical_risks_mean,
    top_variance_controls: controlVariance,
    top_exposed_elements: exposedElements
  };
}
