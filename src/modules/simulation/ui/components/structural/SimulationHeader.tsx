'use client';

import React from 'react';
import { Play, Save, Settings2, RefreshCw, ChevronRight } from 'lucide-react';
import styles from './SimulationHeader.module.css';

interface SimulationHeaderProps {
  status: 'IDLE' | 'LOADING' | 'EXECUTED' | 'ERROR';
  onRun: () => void;
  onSave: () => void;
}

export default function SimulationHeader({ status, onRun, onSave }: SimulationHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.nav}>
        <span className={styles.breadcrumb}>Simulación</span>
        <ChevronRight size={14} className={styles.separator} />
        <span className={styles.breadcrumbActive}>Fallas de controles</span>
      </div>

      <div className={styles.titleArea}>
        <div>
          <h1 className={styles.title}>Cabina de Análisis Estructural</h1>
          <p className={styles.subtitle}>Propagación de fallas y evaluación de fragilidad sistémica sobre el grafo vivo.</p>
        </div>

        <div className={styles.actions}>
          <div className={styles.scenarioSelect}>
            <Settings2 size={16} />
            <span>Escenario base (Default)</span>
          </div>

          <button 
            className={styles.saveButton}
            onClick={onSave}
          >
            <Save size={18} />
            <span>Guardar Escenario</span>
          </button>

          <button 
            className={styles.runButton}
            onClick={onRun}
            disabled={status === 'LOADING'}
          >
            {status === 'LOADING' ? (
              <RefreshCw size={18} className={styles.spinning} />
            ) : (
              <Play size={18} />
            )}
            <span>{status === 'LOADING' ? 'Ejecutando...' : 'Ejecutar Simulación'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
