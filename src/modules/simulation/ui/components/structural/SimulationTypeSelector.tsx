'use client';

import React from 'react';
import styles from './SimulationTypeSelector.module.css';
import { SimulationType } from './StructuralSimulationPage';
import { Shuffle, Target, Zap, AlertTriangle, Layers } from 'lucide-react';

interface SimulationTypeSelectorProps {
  value: SimulationType;
  onChange: (type: SimulationType) => void;
}

const TYPES: { value: SimulationType; label: string; icon: any; desc: string }[] = [
  { value: 'ALEATORIA', label: 'Aleatoria', icon: Shuffle, desc: 'Fallas azarosas de N controles.' },
  { value: 'DIRIGIDA', label: 'Dirigida', icon: Target, desc: 'Selección manual de controles específicos.' },
  { value: 'STRESS_TEST', label: 'Stress Test', icon: Zap, desc: 'Simulación de caída masiva (80%+).' },
  { value: 'NODO_CRITICO', label: 'Nodo Crítico', icon: AlertTriangle, desc: 'Falla de los N más centrales.' },
  { value: 'DOMINIO', label: 'Dominio', icon: Layers, desc: 'Falla total de una obligación/reino.' },
];

export default function SimulationTypeSelector({ value, onChange }: SimulationTypeSelectorProps) {
  return (
    <div className={styles.container}>
      {TYPES.map((type) => {
        const Icon = type.icon;
        const isActive = value === type.value;
        return (
          <button
            key={type.value}
            className={`${styles.item} ${isActive ? styles.itemActive : ''}`}
            onClick={() => onChange(type.value)}
            title={type.desc}
          >
            <div className={styles.iconBox}>
              <Icon size={16} />
            </div>
            <div className={styles.textBox}>
              <span className={styles.label}>{type.label}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
