'use client';

import React from 'react';
import styles from './PropagationTraceTable.module.css';
import { Network, ArrowRight, Zap } from 'lucide-react';

interface TraceItem {
  step: number;
  origin: string;
  originType: string;
  target: string;
  targetType: string;
  relation: string;
  before: number;
  after: number;
  delta: number;
  reason: string;
}

interface PropagationTraceTableProps {
  trace: TraceItem[];
}

export default function PropagationTraceTable({ trace }: PropagationTraceTableProps) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <Network size={18} className={styles.icon} />
          <h3 className={styles.title}>Trazabilidad de Propagación</h3>
        </div>
        <div className={styles.count}>
          {trace.length} eventos registrados
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Paso</th>
              <th>Origen</th>
              <th>Relación</th>
              <th>Objetivo</th>
              <th>Estado Pre</th>
              <th>Estado Post</th>
              <th>Δ Impacto</th>
              <th>Razón / Gatillo</th>
            </tr>
          </thead>
          <tbody>
            {trace.length === 0 ? (
              <tr>
                <td colSpan={8} className={styles.empty}>
                  Sin datos de propagación. Ejecute una simulación para observar la cascada.
                </td>
              </tr>
            ) : (
              trace.map((item, idx) => (
                <tr key={idx}>
                  <td className={styles.step}>#{item.step}</td>
                  <td className={styles.nodeCell}>
                    <span className={styles.nodeType}>{item.originType}</span>
                    <span className={styles.nodeId}>{item.origin}</span>
                  </td>
                  <td className={styles.relation}>
                    <div className={styles.relBox}>
                      {item.relation}
                      <ArrowRight size={12} />
                    </div>
                  </td>
                  <td className={styles.nodeCell}>
                    <span className={styles.nodeType}>{item.targetType}</span>
                    <span className={styles.nodeId}>{item.target}</span>
                  </td>
                  <td className={styles.value}>{item.before.toFixed(2)}</td>
                  <td className={styles.valueActive}>{item.after.toFixed(2)}</td>
                  <td className={styles.delta}>+{item.delta.toFixed(2)}</td>
                  <td className={styles.reason}>
                    <Zap size={10} className={styles.zap} />
                    {item.reason}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
