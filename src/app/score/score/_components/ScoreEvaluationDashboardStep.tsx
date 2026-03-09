'use client';

import React, { useEffect, useMemo, useState } from 'react';
import styles from '../ScoreWizardClient.module.css';

type DomainRow = {
  domainId: string;
  code: string;
  name: string;
  obligations: number;
  controls: number;
  evaluated: number;
  pending: number;
  progress: number;
};

type Props = {
  runId: string | null;
  onSelectDomain: (domainId: string) => void;
  onBack: () => void;
  onNext: () => void;
};

export default function ScoreEvaluationDashboardStep({
  runId,
  onSelectDomain,
  onBack,
  onNext,
}: Props) {
  const [domains, setDomains] = useState<DomainRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!runId) return;
    let alive = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/score/runs/${runId}/domains`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'No se pudo cargar dominios');
        if (alive) setDomains(Array.isArray(data.domains) ? data.domains : []);
      } catch (err: any) {
        if (alive) setError(err?.message || 'No se pudo cargar dominios');
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => {
      alive = false;
    };
  }, [runId]);

  const hasRun = Boolean(runId);
  const summary = useMemo(() => {
    const total = domains.reduce((acc, d) => acc + d.controls, 0);
    const evaluated = domains.reduce((acc, d) => acc + d.evaluated, 0);
    return { total, evaluated };
  }, [domains]);

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h2 className={styles.title}>Dashboard de evaluacion</h2>
        <p className={styles.subtitle}>Selecciona el dominio para continuar la evaluacion estructural.</p>
      </div>

      {!hasRun && (
        <div className={styles.card}>
          <div className={styles.cardTitle}>Necesitas una corrida activa</div>
          <div className={styles.cardSubtitle}>Completa el Paso 2 para generar la seleccion estructural.</div>
        </div>
      )}

      {hasRun && (
        <>
          <div className={styles.summaryRow}>
            <span className={styles.pill}>Controles: {summary.total}</span>
            <span className={styles.pill}>Evaluados: {summary.evaluated}</span>
          </div>

          {loading && <div className={styles.helperText}>Cargando dominios...</div>}
          {error && <div className={styles.helperText}>{error}</div>}

          <div className={styles.domainGrid}>
            {domains.map((domain) => (
              <button
                key={domain.domainId}
                type="button"
                className={styles.domainCard}
                onClick={() => onSelectDomain(domain.domainId)}
              >
                <div className={styles.domainHeader}>
                  <div className={styles.domainCode}>{domain.code}</div>
                  <div className={styles.domainName}>{domain.name}</div>
                </div>
                <div className={styles.domainMeta}>
                  <span>Obligaciones: {domain.obligations}</span>
                  <span>Controles: {domain.controls}</span>
                  <span>Evaluados: {domain.evaluated}</span>
                  <span>Pendientes: {domain.pending}</span>
                </div>
                <div className={styles.progressBar}>
                  <div className={styles.progressFill} style={{ width: `${Math.round(domain.progress * 100)}%` }} />
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      <div className={styles.footer}>
        <div className={styles.footerActions}>
          <button className={styles.backButton} onClick={onBack}>Volver</button>
          <button className={styles.primaryButton} onClick={onNext} disabled={!hasRun}>
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
}
