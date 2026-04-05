'use client';

import React, { useState, useCallback } from 'react';
import styles from './StructuralSimulationPage.module.css';
import SimulationHeader from './SimulationHeader';
import SimulationConfigSidebar from './SimulationConfigSidebar';
import ImpactSidebar from './ImpactSidebar';
import StructuralGraphCanvas from './StructuralGraphCanvas';
import PropagationTraceTable from './PropagationTraceTable';

export type SimulationType = 'ALEATORIA' | 'DIRIGIDA' | 'STRESS_TEST' | 'NODO_CRITICO' | 'DOMINIO';
export type SimulationScope = 'AML' | 'CIBER';

export interface SimulationConfig {
  type: SimulationType;
  scope: SimulationScope;
  selectedControls: string[];
  intensity: {
    controlsToFail: number;
    severity: number; // 0.1 to 1.0
    maxPropagation: number; // 1 to 4
  };
  rules: {
    includeCascade: boolean;
    includeConcentration: boolean;
    includeTriggers: boolean;
    recalculateCentrality: boolean;
    stopThreshold: boolean;
  };
}

export interface SimulationResults {
  eTotalBefore: number;
  eTotalAfter: number;
  deltaAbs: number;
  deltaPct: number;
  impactedNodes: number;
  activatedTriggers: number;
  maxPathReached: number;
  decomposition: {
    direct: number;
    concentration: number;
    propagation: number;
    triggers: number;
  };
  affectedDomains: Array<{
    name: string;
    before: number;
    after: number;
    delta: number;
  }>;
  criticalNodes: Array<{
    id: string;
    label: string;
    type: string;
    impactScore: number;
  }>;
  trace: Array<{
    step: number;
    origin: string;
    originType: string;
    target: string;
    targetType: string;
    relation: string;
    before: number;
    after: number;
    delta: number;
    reason: string;
  }>;
}

export default function StructuralSimulationPage() {
  const [config, setConfig] = useState<SimulationConfig>({
    type: 'DIRIGIDA',
    scope: 'AML',
    selectedControls: [],
    intensity: {
      controlsToFail: 5,
      severity: 0.5,
      maxPropagation: 2,
    },
    rules: {
      includeCascade: true,
      includeConcentration: true,
      includeTriggers: true,
      recalculateCentrality: false,
      stopThreshold: false,
    }
  });

  const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'EXECUTED' | 'ERROR'>('IDLE');
  const [results, setResults] = useState<SimulationResults | null>(null);

  const handleRun = useCallback(async () => {
    setStatus('LOADING');
    // Simulation logic will be implemented here
    // For now, we simulate a delay and some results
    setTimeout(() => {
      setResults({
        eTotalBefore: 42.5,
        eTotalAfter: 68.2,
        deltaAbs: 25.7,
        deltaPct: 60.4,
        impactedNodes: 124,
        activatedTriggers: 2,
        maxPathReached: 3,
        decomposition: {
          direct: 12.4,
          concentration: 5.2,
          propagation: 6.1,
          triggers: 2.0
        },
        affectedDomains: [
          { name: 'Prevención de Lavado', before: 12.0, after: 18.5, delta: 6.5 },
          { name: 'Debida Diligencia', before: 8.4, after: 14.1, delta: 5.7 }
        ],
        criticalNodes: [
          { id: 'C-001', label: 'Monitor de Transacciones', type: 'CONTROL', impactScore: 0.85 },
          { id: 'R-012', label: 'Riesgo de Concentración', type: 'RISK', impactScore: 0.72 }
        ],
        trace: [
          { step: 1, origin: 'C-001', originType: 'CONTROL', target: 'R-012', targetType: 'RISK', relation: 'MITIGATES', before: 0.12, after: 0.84, delta: 0.72, reason: 'Control failure' },
          { step: 2, origin: 'R-012', originType: 'RISK', target: 'O-044', targetType: 'ELEMENT', relation: 'EXPOSES', before: 0.05, after: 0.42, delta: 0.37, reason: 'Propagation from risk' }
        ]
      });
      setStatus('EXECUTED');
    }, 1500);
  }, [config]);

  const handleSave = useCallback(() => {
    console.log('Saving scenario...', config);
  }, [config]);

  return (
    <div className={styles.page}>
      <SimulationHeader 
        status={status} 
        onRun={handleRun} 
        onSave={handleSave} 
      />
      
      <main className={styles.container}>
        <div className={styles.leftSidebar}>
          <SimulationConfigSidebar config={config} onChange={setConfig} />
        </div>
        
        <div className={styles.centerCanvas}>
          <StructuralGraphCanvas 
            status={status} 
            results={results} 
            config={config}
          />
        </div>
        
        <div className={styles.rightSidebar}>
          <ImpactSidebar results={results} status={status} />
        </div>
      </main>

      <footer className={styles.bottomBench}>
        <PropagationTraceTable trace={results?.trace ?? []} />
      </footer>
    </div>
  );
}
