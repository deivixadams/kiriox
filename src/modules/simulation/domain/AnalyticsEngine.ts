import * as THREE from 'three';

export type NodeType = 'element' | 'risk' | 'control';

export interface NodeData {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  z: number;
  active: boolean;    // Controles: true = funcionando. Riesgos: true = materializado.
  stress: number;     // Nivel de impacto (0 a 1+)
  name?: string;      // Nombre humano para el nodo (especialmente para elementos de negocio)
  dependencies: string[]; // IDs de nodos conectados hacia abajo
  failure_impact_score?: number;
  is_hard_gate?: boolean;
}

export interface EdgeData {
  id: string;
  source: string;
  target: string;
  active: boolean; // Transmite impacto o mitigación
  edge_type?: string;
}

export interface SystemMetrics {
  linearExposure: number;
  structuralFragility: number;
  activeRisksCount: number;
  failedControlsCount: number;
  criticalElementsCount: number;
  cascadePercentage?: number;
}

export interface SimulationEvent {
  id: string;
  time: Date;
  controlId: string;
  risksMaterialized: string[];
  elementsAffected: string[];
}

export const CONFIG = {
  counts: { elements: 50, risks: 80, controls: 72 },
  layers: { elementsY: 0, risksY: 15, controlsY: 30 },
  colors: {
    element: new THREE.Color('#FBBF24'), // Amarillo
    elementStressed: new THREE.Color('#D97706'),
    risk: new THREE.Color('#EF4444'),    // Rojo
    riskMitigated: new THREE.Color('#7F1D1D'),
    control: new THREE.Color('#10B981'), // Verde
    controlFailed: new THREE.Color('#374151'), // Gris oscuro
    edgeMitigation: '#10B981',
    edgeImpact: '#EF4444',
    edgeIdle: '#4B5563',
  }
};

export class AnalyticsEngine {
  static generateTopology() {
    const nodes: Record<string, NodeData> = {};
    const edges: EdgeData[] = [];
    const elementNames = [
      "Core Banking", "Payment Gateway", "User Auth API", "SWIFT Node", "Ledger DB", 
      "Risk Engine", "Client Portal", "Audit Logs", "Treasury Hub", "KYC Service",
      "OAuth Provider", "Batch Processor", "Reporting Tool", "Backoffice UI", "API Gateway",
      "Mobile App", "Fraud Detector", "Settlement Engine", "Credit Scoring", "Loan Origination",
      "Fixed Income", "Asset Mgmt", "Stock Broker", "FX Liquidity", "Crypto Custody",
      "Insurance Portal", "Claims Service", "Policy Manager", "Pricing API", "Underwriting",
      "Compliance Hub", "AML Monitor", "Sanctions Check", "Watchlist DB", "Tax System",
      "GL Bridge", "SAP Connector", "Master Data", "Cache Cluster", "Message Bus",
      "Notification Svc", "Push Server", "Identity Store", "Token Vault", "HSM Cluster",
      "DNS Resolver", "Load Balancer", "CDN Edge", "WAF Node", "Firewall API"
    ];

    const createLayer = (count: number, type: NodeType, y: number, radius: number) => {
      const ids: string[] = [];
      for (let i = 0; i < count; i++) {
        // Distribución en espiral de Fibonacci
        const theta = i * Math.PI * (1 + Math.sqrt(5));
        const r = radius * Math.sqrt(i / count);
        const id = `${type}_${i}`;
        nodes[id] = {
          id, type,
          x: Math.cos(theta) * r,
          y: y + (Math.random() * 4 - 2), // Ligera variación en Y
          z: Math.sin(theta) * r,
          active: type === 'control' ? true : false,
          stress: 0,
          name: type === 'element' ? elementNames[i % elementNames.length] : undefined,
          dependencies: []
        };
        ids.push(id);
      }
      return ids;
    };

    const elementIds = createLayer(CONFIG.counts.elements, 'element', CONFIG.layers.elementsY, 25);
    const riskIds = createLayer(CONFIG.counts.risks, 'risk', CONFIG.layers.risksY, 30);
    const controlIds = createLayer(CONFIG.counts.controls, 'control', CONFIG.layers.controlsY, 35);

    // Conectar Riesgos -> Elementos
    riskIds.forEach(riskId => {
      const targetCount = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < targetCount; i++) {
        const targetId = elementIds[Math.floor(Math.random() * elementIds.length)];
        if (!nodes[riskId].dependencies.includes(targetId)) {
          nodes[riskId].dependencies.push(targetId);
          edges.push({ id: `e_${riskId}_${targetId}`, source: riskId, target: targetId, active: false });
        }
      }
    });

    // Conectar Controles -> Riesgos
    controlIds.forEach(controlId => {
      const targetCount = Math.floor(Math.random() * 4) + 1;
      for (let i = 0; i < targetCount; i++) {
        const targetId = riskIds[Math.floor(Math.random() * riskIds.length)];
        if (!nodes[controlId].dependencies.includes(targetId)) {
          nodes[controlId].dependencies.push(targetId);
          edges.push({ id: `e_${controlId}_${targetId}`, source: controlId, target: targetId, active: true });
        }
      }
    });

    return { nodes, edges };
  }

  static async fetchRealTopology(framework: string): Promise<{ nodes: Record<string, NodeData>, edges: EdgeData[] }> {
    console.log(`[AnalyticsEngine] Requesting real topology for framework: ${framework}`);
    const response = await fetch(`/api/simulation/topology?framework=${framework}`);
    if (!response.ok) throw new Error("API failed to return topology");
    
    const data = await response.json();
    const nodes: Record<string, NodeData> = {};
    const rawNodes = (data.nodes || []) as any[];
    const rawEdges = (data.edges || []) as any[];

    // Map DB nodes to 3D simulation nodes with layout
    const layerIndices: Record<string, number> = { element: 0, risk: 0, control: 0 };
    const counts: Record<string, number> = {
      element: rawNodes.filter((n) => n.node_type.toLowerCase() === 'element' || n.node_type.toLowerCase() === 'obligation').length,
      risk: rawNodes.filter((n) => n.node_type.toLowerCase() === 'risk').length,
      control: rawNodes.filter((n) => n.node_type.toLowerCase() === 'control').length,
    };

    rawNodes.forEach((dbNode: any) => {
      const typeStr = dbNode.node_type.toLowerCase();
      const type: NodeType = (typeStr === 'obligation' ? 'element' : typeStr) as NodeType;
      const i = layerIndices[type]++;
      const count = Math.max(1, counts[type]);
      const y = type === 'element' ? CONFIG.layers.elementsY : (type === 'risk' ? CONFIG.layers.risksY : CONFIG.layers.controlsY);
      
      // Radio intermedio para separación, pero acotado para entrar en malla
      const radius = type === 'element' ? 40 : (type === 'risk' ? 35 : 40);
      
      const theta = i * Math.PI * (1 + Math.sqrt(5));
      const r = radius * Math.sqrt(i / count);

      nodes[dbNode.node_id] = {
        id: dbNode.node_id,
        type,
        x: Math.cos(theta) * r,
        y: y + (Math.random() * 2 - 1),
        z: Math.sin(theta) * r,
        active: type === 'control' ? true : false,
        stress: 0,
        name: dbNode.node_name || dbNode.node_code,
        dependencies: rawEdges.filter(e => e.src_node_id === dbNode.node_id).map(e => e.dst_node_id),
        failure_impact_score: dbNode.failure_impact_score,
        is_hard_gate: dbNode.is_hard_gate
      };
    });

    const finalEdges = rawEdges.map(e => ({
      id: e.edge_id,
      source: e.src_node_id,
      target: e.dst_node_id,
      active: e.edge_type === 'ELEMENT_HAS_CONTROL' || 
              e.edge_type === 'OBLIGATION_HAS_CONTROL' || 
              e.edge_type === 'RISK_MITIGATED_BY_CONTROL'
    }));

    return { nodes, edges: finalEdges };
  }

  static recalculateState(nodes: Record<string, NodeData>): { updatedNodes: Record<string, NodeData>, metrics: SystemMetrics } {
    const nextNodes = JSON.parse(JSON.stringify(nodes)) as Record<string, NodeData>;
    
    let activeRisks = 0;
    let failedControls = 0;
    let criticalElements = 0;
    let totalStress = 0;

    const totalElements = Object.values(nextNodes).filter(n => n.type === 'element').length;
    const totalRisks = Object.values(nextNodes).filter(n => n.type === 'risk').length;

    Object.values(nextNodes).filter(n => n.type === 'risk').forEach(risk => {
      // Buscar controles conectados al riesgo sin importar la direccionalidad del grafo original
      const mitigatingControls = Object.values(nextNodes).filter(c => 
        c.type === 'control' && (c.dependencies.includes(risk.id) || risk.dependencies.includes(c.id))
      );
      const expected = mitigatingControls.length;
      const activeMitigations = mitigatingControls.filter(c => c.active).length;
      const exposure = expected === 0 ? 1 : 1 - (activeMitigations / expected);
      
      risk.active = exposure > 0;
      risk.stress = exposure; // Escala progresiva de vulnerabilidad del 0 al 1
      if (risk.active) activeRisks++;
    });

    Object.values(nextNodes).filter(n => n.type === 'element').forEach(element => {
      // Buscar riesgos que impacten el elemento sin importar la direccionalidad
      const impactingRisks = Object.values(nextNodes).filter(r => 
        r.type === 'risk' && (r.dependencies.includes(element.id) || element.dependencies.includes(r.id))
      );
      const activeImpacts = impactingRisks.filter(r => r.active).length;
      element.stress = activeImpacts * 0.5;
      if (element.stress > 0) criticalElements++; // Affected element
      totalStress += element.stress;
    });

    failedControls = Object.values(nextNodes).filter(n => n.type === 'control' && !n.active).length;

    const metrics: SystemMetrics = {
      linearExposure: activeRisks * 1.5,
      structuralFragility: Math.min(100, (totalStress / Math.max(totalElements, 1)) * 100),
      cascadePercentage: Math.min(100, (activeRisks / Math.max(totalRisks, 1)) * 100),
      activeRisksCount: activeRisks,
      failedControlsCount: failedControls,
      criticalElementsCount: criticalElements
    };

    return { updatedNodes: nextNodes, metrics };
  }
}
