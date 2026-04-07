'use client';

import React, { useEffect, useMemo } from 'react';
import { useMonteCarloStore } from '@/store/montecarloStore';
import styles from './MonteCarloHeader.module.css';

export default function MonteCarloHeader() {
  const { 
    reino, 
    iterations, 
    seedLimit,
    setReino, 
    setIterations, 
    setSeedLimit,
    fetchSubgraph, 
    runSimulation, 
    isRunning, 
    isLoadingSubgraph, 
    error, 
    subgraph,
    runMetadata
  } = useMonteCarloStore();

  const isBusy = isRunning || isLoadingSubgraph;

  useEffect(() => {
    fetchSubgraph();
  }, [fetchSubgraph, reino, seedLimit]);

  const metaSummary = useMemo(() => {
    if (subgraph) {
      const sourceLabel = subgraph.score_source === 'baseline'
        ? 'Baseline estructural'
        : (subgraph.score_source === 'run_control' ? 'Score final' : 'Score draft');
      const seedLabel = subgraph.seed_limit ? `Top ${subgraph.seed_limit}` : `Top ${seedLimit}`;
      return `Subgrafo cargado: ${seedLabel} elementos · ${subgraph.nodes.length}N / ${subgraph.edges.length}E · ${sourceLabel}`;
    }
    return 'Subgrafo no cargado';
  }, [subgraph, seedLimit]);

  return (
    <header className={`glass-card ${styles.header}`}>
      <div className={styles.titleGroup}>
        <h1 className={styles.title}>KIRIOX.MONTECARLO.V1</h1>
        <p className={styles.subtitle}>Simulación probabilística sobre estructura fija del grafo real</p>
        <div className={styles.metaRow}>
          <span className={styles.metaBadge}>{metaSummary}</span>
          {runMetadata && (
            <span className={styles.metaBadge}>Ultima ejecucion: {new Date(runMetadata.timestamp).toLocaleString('es-BO')}</span>
          )}
          {isRunning && <span className={styles.statusPill}>Simulando</span>}
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.field}>
          <label className={styles.label}>Reino</label>
          <select 
            className={styles.select}
            value={reino}
            onChange={(e) => setReino(e.target.value)}
            disabled={isBusy}
          >
            <option value="AML">AML (Antilavado)</option>
            <option value="CYB">CYB (Ciberseguridad)</option>
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Iteraciones</label>
          <select 
            className={styles.select}
            value={iterations}
            onChange={(e) => setIterations(Number(e.target.value))}
            disabled={isBusy}
          >
            <option value={5000}>5,000</option>
            <option value={10000}>10,000</option>
            <option value={20000}>20,000</option>
            <option value={30000}>30,000</option>
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Top elementos</label>
          <select 
            className={styles.select}
            value={seedLimit}
            onChange={(e) => setSeedLimit(Number(e.target.value))}
            disabled={isBusy}
          >
            <option value={5}>Top 5</option>
            <option value={10}>Top 10</option>
            <option value={15}>Top 15</option>
            <option value={20}>Top 20</option>
            <option value={30}>Top 30</option>
            <option value={50}>Top 50</option>
          </select>
        </div>

        <div className={styles.buttonRow}>
          <button 
            className={`${styles.button} ${styles.primaryButton}`}
            onClick={() => runSimulation()}
            disabled={isBusy}
          >
            {isRunning ? 'Simulando...' : 'Ejecutar Simulación'}
          </button>
        </div>
      </div>

      {error && (
        <div className={styles.errorBanner}>
          <strong>Error:</strong> {error}
        </div>
      )}
    </header>
  );
}
