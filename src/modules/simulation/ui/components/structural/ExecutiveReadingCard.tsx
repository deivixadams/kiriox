'use client';

import React from 'react';
import styles from './ExecutiveReadingCard.module.css';
import { FileText, ChevronRight } from 'lucide-react';
import { SimulationResults } from './StructuralSimulationPage';

interface ExecutiveReadingCardProps {
  results: SimulationResults | null;
}

export default function ExecutiveReadingCard({ results }: ExecutiveReadingCardProps) {
  if (!results) return null;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <FileText size={16} className={styles.icon} />
        <span className={styles.eyebrow}>Lectura Ejecutiva</span>
      </div>

      <div className={styles.content}>
        <p className={styles.text}>
          La simulación de falla en <strong className={styles.highlight}>{results.impactedNodes} nodos</strong> genera un incremento del 
          <strong className={styles.danger}> {results.deltaPct.toFixed(1)}%</strong> en la exposición estructural. 
        </p>
        <p className={styles.text}>
          Se detectaron <strong className={styles.warning}>{results.activatedTriggers} gatillos de cascada</strong> que amplificaron el daño inicial 
          hacia los dominios de cumplimiento regulatorio.
        </p>
      </div>

      <button className={styles.footerBtn}>
        <span>Generar Reporte Completo</span>
        <ChevronRight size={14} />
      </button>
    </div>
  );
}
