'use client';

import React, { useEffect, useMemo, useState } from 'react';
import styles from './ScoreSummaryStep.module.css';

type ParameterValue = {
  code: string;
  name: string | null;
  numeric_value: number | null;
};

type ControlItem = {
  control_id: string;
  code: string;
  name: string;
  status: 'cumple' | 'parcial' | 'no_cumple';
  effectiveness: number;
  risks?: Array<{ risk_id: string; risk_code: string; risk_name: string }>;
};

type SummaryPayload = {
  isIncomplete: boolean;
  evaluatedCount: number;
  totalCount: number;
  parameters: {
    profile: { id: string; code: string; name: string | null } | null;
    values: ParameterValue[];
  };
  controls: {
    evaluated: ControlItem[];
    passed: ControlItem[];
    partial: ControlItem[];
    failed: ControlItem[];
  };
  control_scores: Array<{
    control_id: string;
    control_code: string;
    control_name: string;
    effectiveness: number;
  }>;
  score: {
    final_score: number;
    base_exposure: number;
    concentration_index_h: number;
    concentration_factor: number;
    concentrated_exposure: number;
    propagation_exposure: number;
    final_exposure: number;
  };
};

type Props = {
  runId: string | null;
  onBack: () => void;
  onNext: () => void;
};

export default function ScoreSummaryStep({ runId, onBack, onNext }: Props) {
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
        if (!res.ok) throw new Error(data?.error || 'No se pudo cargar score');
        if (alive) setPayload(data);
      } catch (err: any) {
        if (alive) setError(err?.message || 'No se pudo cargar score');
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
    total: payload?.totalCount ?? 0,
    evaluated: payload?.evaluatedCount ?? 0,
    passed: payload?.controls.passed.length ?? 0,
    partial: payload?.controls.partial.length ?? 0,
    failed: payload?.controls.failed.length ?? 0,
  }), [payload]);

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        {/* Header content removed per user request */}
      </div>

      {loading && <div className={styles.helperText}>Calculando score...</div>}
      {error && <div className={styles.helperText}>{error}</div>}

      {payload?.isIncomplete && (
        <div className={styles.incompleteBanner}>
          <div className={styles.incompleteTitle}>EVALUACIÓN INCOMPLETA</div>
          <div className={styles.incompleteSubtitle}>
            El score se calcula con los controles evaluados hasta el momento.
          </div>
        </div>
      )}

      <div className={styles.summaryRow}>
        <span className={styles.pill}>Evaluados: {counts.evaluated}/{counts.total}</span>
        <span className={styles.pill}>Cumplen: {counts.passed}</span>
        <span className={styles.pill}>Parciales: {counts.partial}</span>
        <span className={styles.pill}>No cumplen: {counts.failed}</span>
      </div>

      <div className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.cardTitle}>Parámetros del motor</div>
          <div className={styles.cardSubtitle}>
            {payload?.parameters.profile?.name || 'Perfil activo'} · {payload?.parameters.profile?.code || '—'}
          </div>
          <div className={styles.paramList}>
            {payload?.parameters.values.map((param) => (
              <div key={param.code} className={styles.paramItem}>
                <div className={styles.paramCode}>{param.code}</div>
                <div className={styles.paramValue}>
                  {param.numeric_value !== null ? param.numeric_value.toFixed(2) : '—'}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitle}>Score final</div>
          <div className={styles.scoreValue}>
            {payload?.score?.final_score?.toFixed?.(2) ?? '—'}
          </div>
          <div className={styles.scoreMeta}>
            Exposición base: {payload?.score?.base_exposure?.toFixed?.(3) ?? '—'}
          </div>
          <div className={styles.scoreMeta}>
            Exposición final: {payload?.score?.final_exposure?.toFixed?.(3) ?? '—'}
          </div>
        </div>
      </div>

      <div className={styles.listGrid}>
        <div className={styles.card}>
          <div className={styles.cardTitle}>Controles que cumplen</div>
          <div className={styles.list}>
            {payload?.controls.passed.map((item) => (
              <div key={item.control_id} className={styles.listItem}>
                <span>{item.code} · {item.name}</span>
                <span className={styles.listValue}>{item.effectiveness.toFixed(2)}</span>
              </div>
            ))}
            {payload && payload.controls.passed.length === 0 && (
              <div className={styles.emptyItem}>Sin controles completos.</div>
            )}
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardTitle}>Cumplen parcial</div>
          <div className={styles.list}>
            {payload?.controls.partial.map((item) => (
              <div key={item.control_id} className={styles.listItem}>
                <span>{item.code} · {item.name}</span>
                <span className={styles.listValue}>{item.effectiveness.toFixed(2)}</span>
              </div>
            ))}
            {payload && payload.controls.partial.length === 0 && (
              <div className={styles.emptyItem}>Sin parciales.</div>
            )}
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardTitle}>No cumplen</div>
          <div className={styles.list}>
            {payload?.controls.failed.map((item) => (
              <div key={item.control_id} className={styles.failedItem}>
                <div className={styles.failedHeader}>
                  <span>{item.code} · {item.name}</span>
                  <span className={styles.listValue}>{item.effectiveness.toFixed(2)}</span>
                </div>
                <div className={styles.riskList}>
                  {(item.risks || []).map((risk) => (
                    <span key={risk.risk_id} className={styles.riskPill}>
                      {risk.risk_code} · {risk.risk_name}
                    </span>
                  ))}
                  {(item.risks || []).length === 0 && (
                    <span className={styles.riskEmpty}>Sin riesgos asociados.</span>
                  )}
                </div>
              </div>
            ))}
            {payload && payload.controls.failed.length === 0 && (
              <div className={styles.emptyItem}>Sin controles fallidos.</div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <div className={styles.tableTitle}>Score por control</div>
          <div className={styles.tableSubtitle}>Se listan controles evaluados.</div>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead className={styles.thead}>
              <tr>
                <th className={styles.th}>Código</th>
                <th className={styles.th}>Control</th>
                <th className={styles.th}>Effectiveness</th>
              </tr>
            </thead>
            <tbody className={styles.tbody}>
              {payload?.control_scores.map((row) => (
                <tr key={row.control_id} className={styles.tr}>
                  <td className={styles.td}>{row.control_code}</td>
                  <td className={styles.td}>{row.control_name}</td>
                  <td className={styles.td}>{row.effectiveness.toFixed(2)}</td>
                </tr>
              ))}
              {payload && payload.control_scores.length === 0 && (
                <tr>
                  <td className={styles.emptyCell} colSpan={3}>Sin controles evaluados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className={styles.footer}>
        <div className={styles.footerActions}>
          <button className={styles.backButton} onClick={onBack}>Volver</button>
          <button className={styles.primaryButton} onClick={onNext} disabled={!runId}>
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
}
