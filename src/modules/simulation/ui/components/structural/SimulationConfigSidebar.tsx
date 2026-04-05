'use client';

import React from 'react';
import styles from './SimulationConfigSidebar.module.css';
import SimulationTypeSelector from './SimulationTypeSelector';
import SimulationScopeSelector from './SimulationScopeSelector';
import SimulationControlPicker from './SimulationControlPicker';
import SimulationIntensityPanel from './SimulationIntensityPanel';
import SimulationRulesPanel from './SimulationRulesPanel';
import { SimulationConfig } from './StructuralSimulationPage';

interface SimulationConfigSidebarProps {
  config: SimulationConfig;
  onChange: (config: SimulationConfig) => void;
}

export default function SimulationConfigSidebar({ config, onChange }: SimulationConfigSidebarProps) {
  const updateConfig = (patch: Partial<SimulationConfig>) => {
    onChange({ ...config, ...patch });
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Tipo de Simulación</h3>
        <SimulationTypeSelector 
          value={config.type} 
          onChange={(type) => updateConfig({ type })} 
        />
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Reinos y Alcance</h3>
        <SimulationScopeSelector 
          value={config.scope} 
          onChange={(scope) => updateConfig({ scope })} 
        />
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Selección de Controles</h3>
        <SimulationControlPicker 
          selected={config.selectedControls} 
          onChange={(selectedControls) => updateConfig({ selectedControls })} 
        />
      </div>

      <div className={styles.sectionDivider} />

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Intensidad del Evento</h3>
        <SimulationIntensityPanel 
          value={config.intensity} 
          onChange={(intensity) => updateConfig({ intensity })} 
        />
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Reglas de Propagación</h3>
        <SimulationRulesPanel 
          value={config.rules} 
          onChange={(rules) => updateConfig({ rules })} 
        />
      </div>
    </aside>
  );
}
