'use client';

import React from 'react';
import styles from './ImpactSidebar.module.css';
import ScenarioSummaryCard from './ScenarioSummaryCard';
import DeltaPrincipalCard from './DeltaPrincipalCard';
import AffectedDomainsCard from './AffectedDomainsCard';
import EmergentCriticalNodesCard from './EmergentCriticalNodesCard';
import ExecutiveReadingCard from './ExecutiveReadingCard';
import { SimulationResults } from './StructuralSimulationPage';
import { Activity, AlertCircle } from 'lucide-react';

interface ImpactSidebarProps {
  results: SimulationResults | null;
  status: 'IDLE' | 'LOADING' | 'EXECUTED' | 'ERROR';
}

export default function ImpactSidebar({ results, status }: ImpactSidebarProps) {
  if (status === 'IDLE') {
    return (
      <div className={styles.empty}>
        <Activity size={48} className={styles.emptyIcon} />
        <h3>Listo para Simulación</h3>
        <p>Configure los parámetros en el panel izquierdo y presione "Ejecutar" para observar el impacto estructural en el sistema.</p>
      </div>
    );
  }

  if (status === 'LOADING') {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <h3>Calculando Impacto...</h3>
        <p>Propagando fallas causales y recalculando exposición sistémica.</p>
      </div>
    );
  }

  if (status === 'ERROR') {
    return (
      <div className={styles.error}>
        <AlertCircle size={48} />
        <h3>Error en Simulación</h3>
        <p>No se pudo completar el cálculo. Verifique los parámetros de red.</p>
      </div>
    );
  }

  return (
    <aside className={styles.sidebar}>
      <ScenarioSummaryCard />
      <DeltaPrincipalCard results={results} />
      <AffectedDomainsCard domains={results?.affectedDomains ?? []} />
      <EmergentCriticalNodesCard nodes={results?.criticalNodes ?? []} />
      <ExecutiveReadingCard results={results} />
    </aside>
  );
}
