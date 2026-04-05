'use client';

import React from 'react';
import styles from './SimulationScopeSelector.module.css';
import { SimulationScope } from './StructuralSimulationPage';

interface SimulationScopeSelectorProps {
  value: SimulationScope;
  onChange: (scope: SimulationScope) => void;
}

export default function SimulationScopeSelector({ value, onChange }: SimulationScopeSelectorProps) {
  return (
    <div className={styles.container}>
      <button 
        className={`${styles.button} ${value === 'AML' ? styles.active : ''}`}
        onClick={() => onChange('AML')}
      >
        <span>AML / CFT</span>
      </button>
      <button 
        className={`${styles.button} ${value === 'CIBER' ? styles.active : ''}`}
        onClick={() => onChange('CIBER')}
      >
        <span>Ciberseguridad</span>
      </button>
    </div>
  );
}
