'use client';

import React from 'react';
import { GitBranch, Layers3, Maximize2, RefreshCw, Zap } from 'lucide-react';
import type { Dashboard2Layout, Dashboard2Mode } from '@/modules/structural-risk/ui/store/useDashboard2Store';
import styles from './Dashboard2Header.module.css';

type Props = {
  nodeCount: number;
  edgeCount: number;
  nodeFilter: string;
  activeNodeTypes: string[];
  rotationSpeed: number;
  onFilterChange: (filter: string) => void;
  onToggleType: (type: string) => void;
  onToggleFullscreen: () => void;
  onRefresh: () => void;
  onRotationSpeedChange: (speed: number) => void;
  loading: boolean;
};

export default function Dashboard2Header({
  nodeCount,
  edgeCount,
  nodeFilter,
  activeNodeTypes,
  rotationSpeed,
  onFilterChange,
  onToggleType,
  onToggleFullscreen,
  onRefresh,
  onRotationSpeedChange,
  loading,
}: Props) {
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <div className={styles.eyebrow}>centro de análisis estructural AML</div>
        <h1 className={styles.title}>Intelligence Graph</h1>
        <div className={styles.badges}>
          <span className={styles.badge}>
            <Layers3 size={12} /> {nodeCount} nodos
          </span>
          <span className={styles.badge}>
            <GitBranch size={12} /> {edgeCount} aristas
          </span>
          {loading && (
            <span className={`${styles.badge} ${styles.badgeLoading}`}>
              <Zap size={12} /> Cargando...
            </span>
          )}
        </div>
      </div>

      <div className={styles.controls}>
        {/* Fila superior: Visualizar + Capas + acciones */}
        <div className={styles.controlsRow}>
          <div className={styles.controlGroup}>
            <div className={styles.groupLabel}>Visualizar</div>
            <select
              className={styles.select}
              value={nodeFilter}
              onChange={(e) => onFilterChange?.(e.target.value)}
            >
              <option value="all">Todo</option>
              <option value="reino_aml">AML</option>
              <option value="reino_ciber">Ciberseguridad</option>
            </select>
          </div>

          <div className={styles.controlGroup}>
            <div className={styles.groupLabel}>Capas</div>
            <div className={styles.checkboxGroup}>
              {[
                { id: 'ELEMENT', label: 'Proceso' },
                { id: 'RISK',    label: 'Riesgo'  },
                { id: 'CONTROL', label: 'Control' },
              ].map((type) => (
                <label key={type.id} className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={activeNodeTypes.includes(type.id)}
                    onChange={() => onToggleType(type.id)}
                    className={styles.checkbox}
                  />
                  <span>{type.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.iconBtn} onClick={onToggleFullscreen} title="Pantalla completa">
              <Maximize2 size={14} />
            </button>
            <button type="button" className={styles.iconBtn} onClick={onRefresh} title="Recargar">
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* Fila inferior: slider velocidad 3D — mismo ancho que la fila superior */}
        <div className={styles.speedRow}>
          <div className={styles.speedMeta}>
            <span className={styles.speedLabel}>Velocidad 3D</span>
            <span className={styles.speedValue}>{rotationSpeed === 0 ? 'Pausa' : rotationSpeed}</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={rotationSpeed}
            onChange={(e) => onRotationSpeedChange(Number(e.target.value))}
            className={styles.speedSlider}
          />
        </div>
      </div>
    </header>
  );
}
