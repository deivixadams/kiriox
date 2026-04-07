'use client';

import React from 'react';
import { useMonteCarloStore } from '@/store/montecarloStore';
import styles from './MonteCarloKpis.module.css';

export default function MonteCarloKpis() {
  const { summary, isRunning } = useMonteCarloStore();

  const kpis = [
    { label: 'Fragilidad media', value: summary?.mean_fragility.toFixed(4) || '--', color: '#ffffff' },
    { label: 'P95 fragilidad', value: summary?.p95_fragility.toFixed(4) || '--', color: '#f87171' },
    { label: 'Prob. trigger', value: summary ? `${(summary.trigger_probability * 100).toFixed(2)}%` : '--', color: '#facc15' },
    { label: 'Hard gates activos', value: summary?.hard_gate_activation_freq.toFixed(2) || '--', color: '#60a5fa' },
    { label: 'Riesgos criticos', value: summary?.expected_critical_risks.toFixed(1) || '--', color: '#fb923c' },
  ];

  return (
    <section className={`glass-card ${styles.kpiGrid}`}>
      {kpis.map((kpi) => (
        <div key={kpi.label} className={styles.kpiCard}>
          <span className={styles.kpiLabel}>{kpi.label}</span>
          <span className={styles.kpiValue} style={{ color: kpi.color }}>
            {isRunning && !summary ? '...' : kpi.value}
          </span>
          {!summary && !isRunning && <span className={styles.kpiMeta}>Sin ejecucion</span>}
        </div>
      ))}
    </section>
  );
}
