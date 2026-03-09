'use client';

import React, { useEffect, useMemo, useState } from 'react';
import styles from '../ScoreWizardClient.module.css';

type ControlRow = {
  id: string;
  code: string;
  name: string;
  description?: string;
  objective?: string;
  owner?: string;
  testsTotal: number;
  testsDone: number;
  evidenceCount: number;
  dimensionStatuses: Record<string, string>;
  status: string;
};

type Props = {
  runId: string | null;
  domainId: string | null;
  onSelectControl: (controlId: string) => void;
  onBack: () => void;
  onNext: () => void;
};

export default function ScoreDomainControlsStep({
  runId,
  domainId,
  onSelectControl,
  onBack,
  onNext,
}: Props) {
  const [controls, setControls] = useState<ControlRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [onlyPending, setOnlyPending] = useState(false);
  const [onlyKey, setOnlyKey] = useState(false);

  useEffect(() => {
    if (!runId || !domainId) return;
    let alive = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/score/runs/${runId}/domains/${domainId}/controls`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'No se pudo cargar controles');
        if (alive) setControls(Array.isArray(data.controls) ? data.controls : []);
      } catch (err: any) {
        if (alive) setError(err?.message || 'No se pudo cargar controles');
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => {
      alive = false;
    };
  }, [runId, domainId]);

  const filtered = useMemo(() => {
    let list = controls;
    if (onlyPending) {
      list = list.filter((c) => c.status !== 'Evaluated');
    }
    if (onlyKey) {
      list = list.filter((c) =>
        Object.values(c.dimensionStatuses).some((status) => status === 'Partial')
      );
    }
    return list;
  }, [controls, onlyPending, onlyKey]);

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h2 className={styles.title}>Controles del dominio</h2>
        <p className={styles.subtitle}>Selecciona el control para evaluar sus dimensiones.</p>
      </div>

      <div className={styles.filterRow}>
        <label className={styles.filterOption}>
          <input type="checkbox" checked={onlyPending} onChange={(e) => setOnlyPending(e.target.checked)} />
          Solo pendientes
        </label>
        <label className={styles.filterOption}>
          <input type="checkbox" checked={onlyKey} onChange={(e) => setOnlyKey(e.target.checked)} />
          Key controls
        </label>
      </div>

      {loading && <div className={styles.helperText}>Cargando controles...</div>}
      {error && <div className={styles.helperText}>{error}</div>}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead className={styles.thead}>
            <tr>
              <th className={styles.th}>Codigo</th>
              <th className={styles.th}>Control</th>
              <th className={styles.th}>Dimensiones</th>
              <th className={styles.th}>Tests</th>
              <th className={styles.th}>Evidencia</th>
              <th className={styles.th}>Estado</th>
              <th className={styles.th}></th>
            </tr>
          </thead>
          <tbody className={styles.tbody}>
            {!loading && filtered.length === 0 && (
              <tr className={styles.emptyRow}>
                <td colSpan={7}>No hay controles para mostrar.</td>
              </tr>
            )}
            {filtered.map((control) => (
              <tr key={control.id} className={styles.tr}>
                <td className={styles.tdMuted}>{control.code}</td>
                <td className={styles.td}>
                  <div className={styles.riskTitle}>{control.name}</div>
                  <div className={styles.riskSubtitle}>{control.description || control.objective || '—'}</div>
                </td>
                <td className={styles.td}>
                  <div className={styles.dimensionStack}>
                    {Object.entries(control.dimensionStatuses).map(([dimension, status]) => (
                      <span key={dimension} className={styles.dimensionPill}>
                        {dimension}: {status}
                      </span>
                    ))}
                  </div>
                </td>
                <td className={styles.td}>{control.testsDone}/{control.testsTotal}</td>
                <td className={styles.td}>{control.evidenceCount}</td>
                <td className={styles.td}>{control.status}</td>
                <td className={styles.td}>
                  <button className={styles.actionButton} onClick={() => onSelectControl(control.id)}>
                    Evaluar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.footer}>
        <div className={styles.footerActions}>
          <button className={styles.backButton} onClick={onBack}>Volver</button>
          <button className={styles.primaryButton} onClick={onNext} disabled={!runId || !domainId}>
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
}
