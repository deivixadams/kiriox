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
}

export interface EdgeData {
  id: string;
  source: string;
  target: string;
  active: boolean; // Transmite impacto o mitigación
}

export interface SystemMetrics {
  linearExposure: number;
  structuralFragility: number;
  activeRisksCount: number;
  failedControlsCount: number;
  criticalElementsCount: number;
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

  static recalculateState(nodes: Record<string, NodeData>): { updatedNodes: Record<string, NodeData>, metrics: SystemMetrics } {
    const nextNodes = JSON.parse(JSON.stringify(nodes)) as Record<string, NodeData>;
    
    let activeRisks = 0;
    let failedControls = 0;
    let criticalElements = 0;
    let totalStress = 0;

    Object.values(nextNodes).filter(n => n.type === 'risk').forEach(risk => {
      const mitigatingControls = Object.values(nextNodes).filter(c => c.type === 'control' && c.dependencies.includes(risk.id));
      const activeMitigations = mitigatingControls.filter(c => c.active).length;
      risk.active = activeMitigations < mitigatingControls.length;
      risk.stress = risk.active ? 1 : 0.2;
      if (risk.active) activeRisks++;
    });

    Object.values(nextNodes).filter(n => n.type === 'element').forEach(element => {
      const impactingRisks = Object.values(nextNodes).filter(r => r.type === 'risk' && r.dependencies.includes(element.id));
      const activeImpacts = impactingRisks.filter(r => r.active).length;
      element.stress = activeImpacts * 0.5;
      if (element.stress >= 1) criticalElements++;
      totalStress += element.stress;
    });

    failedControls = Object.values(nextNodes).filter(n => n.type === 'control' && !n.active).length;

    const metrics: SystemMetrics = {
      linearExposure: activeRisks * 1.5,
      structuralFragility: Math.min(100, (totalStress / CONFIG.counts.elements) * 100),
      activeRisksCount: activeRisks,
      failedControlsCount: failedControls,
      criticalElementsCount: criticalElements
    };

    return { updatedNodes: nextNodes, metrics };
  }
}
