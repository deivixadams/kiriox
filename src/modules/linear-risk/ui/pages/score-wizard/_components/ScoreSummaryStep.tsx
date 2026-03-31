'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
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

  const lanes = useMemo(() => ([
    {
      title: 'Controles que cumplen',
      badge: 'Cumple',
      count: counts.passed,
      empty: 'Sin controles completos.',
      items: payload?.controls.passed ?? [],
    },
    {
      title: 'Cumplen parcial',
      badge: 'Parcial',
      count: counts.partial,
      empty: 'Sin parciales.',
      items: payload?.controls.partial ?? [],
    },
    {
      title: 'No cumplen',
      badge: 'No cumple',
      count: counts.failed,
      empty: 'Sin controles fallidos.',
      items: payload?.controls.failed ?? [],
    },
  ]), [payload, counts.passed, counts.partial, counts.failed]);

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.heroCard}>
          <div className={styles.heroHeader}>
            <div>
              <div className={styles.heroEyebrow}>Paso 4 · Panorama del score</div>
              <div className={styles.title}>Lectura ejecutiva del resultado</div>
            </div>
            <div className={styles.heroBadges}>
              <span className={`${styles.statusBadge} ${styles.badgeInfo}`}>Evaluados {counts.evaluated}/{counts.total}</span>
              <span className={`${styles.statusBadge} ${styles.badgeSuccess}`}>Cumplen {counts.passed}</span>
              <span className={`${styles.statusBadge} ${styles.badgeWarning}`}>Parciales {counts.partial}</span>
              <span className={`${styles.statusBadge} ${styles.badgeDanger}`}>No cumplen {counts.failed}</span>
            </div>
          </div>
          <div className={styles.heroText}>
            El panel resume el estado real de los controles evaluados y te permite enfocar rápido los grupos con mejor y peor desempeño.
          </div>
        </div>
      </div>

      {loading && <div className={styles.helperText}>Calculando score...</div>}
      {error && <div className={styles.helperText}>{error}</div>}

      {payload?.isIncomplete && (
        <div className={styles.incompleteBanner}>
          <div className={styles.incompleteTitle}>Evaluación incompleta</div>
          <div className={styles.incompleteSubtitle}>
            El score actual refleja {counts.evaluated} de {counts.total} controles. Completar la evaluación mejora la lectura sistémica.
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
          <div className={styles.valueDescription}>
            Representa el estado general de salud de cumplimiento normativo en una escala de 0 a 100. 
            Un valor cercano a 100 indica que los controles implementados están mitigando efectivamente 
            los riesgos identificados, mientras que un valor bajo señala una fragilidad crítica 
            que requiere intervención.
          </div>
          
          <div className={styles.scoreMeta}>
            <span>Exposición base: {payload?.score?.base_exposure?.toFixed?.(3) ?? '—'}</span>
            <span className={styles.valueDescription}>
              Nivel de riesgo inherente total detectado antes de ajustes sistémicos. Se calcula 
              sumando la carga de riesgo de las obligaciones con fallas en sus controles, 
              considerando criticidad y fortaleza de evidencia.
            </span>
          </div>
          
          <div className={styles.scoreMeta}>
            <span>Exposición final: {payload?.score?.final_exposure?.toFixed?.(3) ?? '—'}</span>
            <span className={styles.valueDescription}>
              Riesgo real proyectado tras considerar la estructura de red. Ajusta la exposición 
              base mediante factores de concentración en dominios y el efecto de propagación 
              (dominó) entre procesos interdependientes.
            </span>
          </div>
          {runId && (
            <Link href={`/score/explicacion/${runId}`} className={styles.detailButton}>
              Ver detalle
            </Link>
          )}
        </div>
      </div>

      <div className={styles.laneGrid}>
        {lanes.map((lane) => (
          <div key={lane.title} className={styles.laneCard}>
            <div className={styles.laneHeader}>
              <div>
                <div className={styles.cardTitle}>{lane.title}</div>
                <div className={styles.cardSubtitle}>{lane.count} controles en esta banda</div>
              </div>
              <div className={styles.laneHeaderActions}>
                <span
                  className={`${styles.statusBadge} ${
                    lane.badge === 'Cumple'
                      ? styles.badgeSuccess
                      : lane.badge === 'Parcial'
                        ? styles.badgeWarning
                        : styles.badgeDanger
                  }`}
                >
                  {lane.badge}
                </span>
              </div>
            </div>
            <div className={styles.list}>
              {lane.items.map((item) => (
                <div
                  key={item.control_id}
                  className={lane.badge === 'No cumple' ? styles.failedItem : styles.listItem}
                >
                  <div className={styles.itemHeader}>
                    <span className={styles.itemText}>{item.code} · {item.name}</span>
                    <span className={styles.listValue}>{item.effectiveness.toFixed(2)}</span>
                  </div>
                  <div className={styles.itemMeta}>
                    <span
                      className={`${styles.statusBadge} ${
                        item.status === 'cumple'
                          ? styles.badgeSuccess
                          : item.status === 'parcial'
                            ? styles.badgeWarning
                            : styles.badgeDanger
                      }`}
                    >
                      {item.status === 'cumple' ? 'Cumple' : item.status === 'parcial' ? 'Parcial' : 'No cumple'}
                    </span>
                  </div>
                  {lane.badge === 'No cumple' && (
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
                  )}
                </div>
              ))}
              {payload && lane.items.length === 0 && (
                <div className={styles.emptyItem}>{lane.empty}</div>
              )}
            </div>
          </div>
        ))}
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
