'use client';

import React, { useEffect, useMemo, useState } from 'react';
import styles from './ScoreControlResultsStep.module.css';

type ControlItem = {
  control_id: string;
  code: string;
  name: string;
  status: 'cumple' | 'parcial' | 'no_cumple';
  effectiveness: number;
};

type SummaryPayload = {
  evaluatedCount: number;
  totalCount: number;
  controls: {
    evaluated: ControlItem[];
  };
};

type Props = {
  runId: string | null;
  onBack: () => void;
  onNext: () => void;
};

export default function ScoreControlResultsStep({ runId, onBack, onNext }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<SummaryPayload | null>(null);

  useEffect(() => {
    if (!runId) return;
    let alive = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/score/runs/${runId}/summary`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'No se pudo cargar resultados');
        if (alive) {
          setPayload({
            evaluatedCount: data?.evaluatedCount ?? 0,
            totalCount: data?.totalCount ?? 0,
            controls: {
              evaluated: Array.isArray(data?.controls?.evaluated) ? data.controls.evaluated : [],
            },
          });
        }
      } catch (err: any) {
        if (alive) setError(err?.message || 'No se pudo cargar resultados');
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => {
      alive = false;
    };
  }, [runId]);

  const counts = useMemo(() => ({
    evaluated: payload?.evaluatedCount ?? 0,
    total: payload?.totalCount ?? 0,
  }), [payload]);

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h2 className={styles.title}>Resultados por control</h2>
        <p className={styles.subtitle}>
          Controles evaluados con su estado y resultado final.
        </p>
      </div>

      {loading && <div className={styles.helperText}>Cargando resultados...</div>}
      {error && <div className={styles.helperText}>{error}</div>}

      <div className={styles.summaryRow}>
        <span className={styles.pill}>Evaluados: {counts.evaluated}/{counts.total}</span>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <div className={styles.tableTitle}>Controles evaluados</div>
          <div className={styles.tableSubtitle}>Resultado de la evaluación 4D.</div>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead className={styles.thead}>
              <tr>
                <th className={styles.th}>Código</th>
                <th className={styles.th}>Control</th>
                <th className={styles.th}>Estado</th>
                <th className={styles.th}>Resultado</th>
              </tr>
            </thead>
            <tbody className={styles.tbody}>
              {payload?.controls.evaluated.map((row) => (
                <tr key={row.control_id} className={styles.tr}>
                  <td className={styles.td}>{row.code}</td>
                  <td className={styles.td}>{row.name}</td>
                  <td className={styles.td}>
                    <span className={`${styles.statusPill} ${styles[`status_${row.status}`]}`}>
                      {row.status === 'cumple' ? 'Cumple' : row.status === 'parcial' ? 'Cumple parcial' : 'No cumple'}
                    </span>
                  </td>
                  <td className={styles.td}>{row.effectiveness.toFixed(2)}</td>
                </tr>
              ))}
              {payload && payload.controls.evaluated.length === 0 && (
                <tr>
                  <td className={styles.emptyCell} colSpan={4}>Sin controles evaluados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className={styles.footer}>
        <div className={styles.footerActions}>
          <button className={styles.backButton} onClick={onBack}>Volver</button>
          <button className={styles.primaryButton} onClick={onNext}>Continuar</button>
        </div>
      </div>
    </div>
  );
}
