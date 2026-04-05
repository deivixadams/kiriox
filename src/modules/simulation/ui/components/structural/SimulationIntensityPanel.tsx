'use client';

import React from 'react';
import styles from './SimulationIntensityPanel.module.css';

interface SimulationIntensityPanelProps {
  value: {
    controlsToFail: number;
    severity: number;
    maxPropagation: number;
  };
  onChange: (value: {
    controlsToFail: number;
    severity: number;
    maxPropagation: number;
  }) => void;
}

export default function SimulationIntensityPanel({ value, onChange }: SimulationIntensityPanelProps) {
  const update = (key: keyof typeof value, val: number) => {
    onChange({ ...value, [key]: val });
  };

  return (
    <div className={styles.container}>
      <div className={styles.row}>
        <div className={styles.labelArea}>
          <span className={styles.label}>Cantidad de Controles</span>
          <span className={styles.badge}>{value.controlsToFail}</span>
        </div>
        <input 
          type="range" 
          min="1" 
          max="50" 
          value={value.controlsToFail}
          className={styles.range}
          onChange={(e) => update('controlsToFail', parseInt(e.target.value))}
        />
        <div className={styles.meta}>
          <span>1</span>
          <span>50</span>
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.labelArea}>
          <span className={styles.label}>Efectividad de Falla (Severidad)</span>
          <span className={styles.badge}>{(value.severity * 100).toFixed(0)}%</span>
        </div>
        <input 
          type="range" 
          min="0.1" 
          max="1.0" 
          step="0.1"
          value={value.severity}
          className={styles.range}
          onChange={(e) => update('severity', parseFloat(e.target.value))}
        />
        <div className={styles.meta}>
          <span>10%</span>
          <span>100%</span>
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.labelArea}>
          <span className={styles.label}>Profundidad de Cascada</span>
          <span className={styles.badge}>{value.maxPropagation} saltos</span>
        </div>
        <input 
          type="range" 
          min="1" 
          max="4" 
          value={value.maxPropagation}
          className={styles.range}
          onChange={(e) => update('maxPropagation', parseInt(e.target.value))}
        />
        <div className={styles.meta}>
          <span>1 salto</span>
          <span>4 saltos</span>
        </div>
      </div>
    </div>
  );
}
