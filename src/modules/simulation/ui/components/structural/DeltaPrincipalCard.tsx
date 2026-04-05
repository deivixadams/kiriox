'use client';

import React from 'react';
import styles from './DeltaPrincipalCard.module.css';
import { ArrowUpRight, Calculator } from 'lucide-react';
import { SimulationResults } from './StructuralSimulationPage';

interface DeltaPrincipalCardProps {
  results: SimulationResults | null;
}

export default function DeltaPrincipalCard({ results }: DeltaPrincipalCardProps) {
  if (!results) return null;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <Calculator size={16} className={styles.icon} />
        <span className={styles.eyebrow}>Exposición Estructural (Sistémica)</span>
      </div>

      <div className={styles.mainDelta}>
        <div className={styles.scoreRow}>
          <div className={styles.scoreItem}>
            <span>Inicial</span>
            <strong>{results.eTotalBefore.toFixed(1)}</strong>
          </div>
          <div className={styles.arrowBox}>
            <ArrowUpRight size={24} className={styles.arrow} />
          </div>
          <div className={styles.scoreItem}>
            <span>Simulado</span>
            <strong className={styles.activeScore}>{results.eTotalAfter.toFixed(1)}</strong>
          </div>
        </div>
        <div className={styles.deltaPct}>
          +{results.deltaPct.toFixed(1)}% de fragilidad detectada
        </div>
      </div>

      <div className={styles.decomposition}>
        <div className={styles.decompTitle}>Métrica E_total (Decomposición)</div>
        <div className={styles.decompGrid}>
          <div className={styles.decompItem}>
            <span>Base</span>
            <strong>+{results.decomposition.direct.toFixed(1)}</strong>
          </div>
          <div className={styles.decompItem}>
            <span>Concentración</span>
            <strong>+{results.decomposition.concentration.toFixed(1)}</strong>
          </div>
          <div className={styles.decompItem}>
            <span>Propagación</span>
            <strong>+{results.decomposition.propagation.toFixed(1)}</strong>
          </div>
          <div className={styles.decompItem}>
            <span>Gatillos</span>
            <strong>+{results.decomposition.triggers.toFixed(1)}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
