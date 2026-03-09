'use client';

import React, { useEffect, useMemo, useState } from 'react';
import styles from '../ScoreWizardClient.module.css';

type DomainRow = {
  domainId: string;
  name: string;
  obligations: number;
  controls: number;
  evaluated: number;
  pending: number;
};

type EngineResultPayload = {
  engineVersion: string;
  scoreBand: string;
  generatedAt: string;
  output: {
    control_results: Array<{
      control_id: string;
      control_code: string;
      effectiveness: number;
      residual_fragility: number;
      propagation_charge: number;
    }>;
    obligation_results: Array<{
      obligation_id: string;
      obligation_code: string;
      effectiveness: number;
      exposure: number;
    }>;
    domain_results: Array<{
      domain_id: string;
      exposure: number;
      normalized_vulnerability: number;
    }>;
    score_breakdown: {
      base_exposure: number;
      concentration_index_h: number;
      concentration_factor: number;
      concentrated_exposure: number;
      propagation_exposure: number;
      final_exposure: number;
      final_score_0_100: number;
    };
  };
};

type Props = {
  runId: string | null;
  onBack: () => void;
};

export default function ScoreResultStep({ runId, onBack }: Props) {
  const [domains, setDomains] = useState<DomainRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [finalizing, setFinalizing] = useState(false);
  const [finalized, setFinalized] = useState(false);
  const [scoreResult, setScoreResult] = useState<{
    scoreTotal: number | null;
    scoreBand: string | null;
    engineVersion: string | null;
    result: EngineResultPayload | null;
  } | null>(null);

  useEffect(() => {
    if (!runId) return;
    let alive = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/score/runs/${runId}/domains`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'No se pudo cargar resumen');
        if (alive) setDomains(Array.isArray(data.domains) ? data.domains : []);
      } catch (err: any) {
        if (alive) setError(err?.message || 'No se pudo cargar resumen');
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => {
      alive = false;
    };
  }, [runId]);

  useEffect(() => {
    if (!runId) return;
    let alive = true;
    const loadResult = async () => {
      try {
        const res = await fetch(`/api/score/runs/${runId}/result`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'No se pudo cargar resultado');
        if (!alive) return;
        setFinalized(Boolean(data?.finalized));
        setScoreResult({
          scoreTotal: typeof data?.scoreTotal === 'number' ? data.scoreTotal : null,
          scoreBand: data?.scoreBand || null,
          engineVersion: data?.engineVersion || null,
          result: data?.result || null,
        });
      } catch (err: any) {
        if (alive) setError(err?.message || 'No se pudo cargar resultado');
      }
    };
    loadResult();
    return () => {
      alive = false;
    };
  }, [runId]);

  const totals = useMemo(() => {
    const controls = domains.reduce((acc, d) => acc + d.controls, 0);
    const evaluated = domains.reduce((acc, d) => acc + d.evaluated, 0);
    const pending = domains.reduce((acc, d) => acc + d.pending, 0);
    return { controls, evaluated, pending };
  }, [domains]);

  const topControls = useMemo(
    () => scoreResult?.result?.output.control_results?.slice(0, 5) || [],
    [scoreResult]
  );
  const topObligations = useMemo(
    () => scoreResult?.result?.output.obligation_results?.slice(0, 5) || [],
    [scoreResult]
  );
  const topDomains = useMemo(
    () => scoreResult?.result?.output.domain_results?.slice(0, 5) || [],
    [scoreResult]
  );
  const breakdown = scoreResult?.result?.output.score_breakdown;

  const finalize = async () => {
    if (!runId) return;
    setFinalizing(true);
    setError(null);
    try {
      const res = await fetch(`/api/score/runs/${runId}/finalize`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'No se pudo finalizar');
      setFinalized(true);
      setScoreResult({
        scoreTotal: data?.result?.output?.score_breakdown?.final_score_0_100 ?? null,
        scoreBand: data?.result?.scoreBand || null,
        engineVersion: data?.result?.engineVersion || null,
        result: data?.result || null,
      });
    } catch (err: any) {
      setError(err?.message || 'No se pudo finalizar');
    } finally {
      setFinalizing(false);
    }
  };

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h2 className={styles.title}>Resultado de la corrida</h2>
        <p className={styles.subtitle}>Resumen de progreso y estado final.</p>
      </div>

      {loading && <div className={styles.helperText}>Cargando resumen...</div>}
      {error && <div className={styles.helperText}>{error}</div>}

      <div className={styles.summaryRow}>
        <span className={styles.pill}>Controles: {totals.controls}</span>
        <span className={styles.pill}>Evaluados: {totals.evaluated}</span>
        <span className={styles.pill}>Pendientes: {totals.pending}</span>
      </div>

      <div className={styles.card}>
        <div className={styles.cardTitle}>Estado global</div>
        <div className={styles.cardSubtitle}>
          {finalized ? 'Corrida finalizada y materializada.' : 'La corrida aun esta en borrador.'}
        </div>
        {scoreResult && (
          <div className={styles.metaRow}>
            <span className={styles.pill}>Score: {scoreResult.scoreTotal?.toFixed?.(2) ?? '—'}</span>
            <span className={styles.pill}>Banda: {scoreResult.scoreBand || '—'}</span>
            <span className={styles.pill}>Engine: {scoreResult.engineVersion || '—'}</span>
          </div>
        )}
      </div>

      {breakdown && (
        <div className={styles.grid}>
          <div className={styles.card}>
            <div className={styles.cardTitle}>Breakdown CRE</div>
            <div className={styles.domainMeta}>
              <span>Base exposure: {breakdown.base_exposure.toFixed(4)}</span>
              <span>Concentration index: {breakdown.concentration_index_h.toFixed(4)}</span>
              <span>Concentration factor: {breakdown.concentration_factor.toFixed(4)}</span>
              <span>Propagation exposure: {breakdown.propagation_exposure.toFixed(4)}</span>
              <span>Final exposure: {breakdown.final_exposure.toFixed(4)}</span>
            </div>
          </div>
          <div className={styles.card}>
            <div className={styles.cardTitle}>Dominios mas expuestos</div>
            <div className={styles.dimensionStack}>
              {topDomains.length === 0 && <span className={styles.dimensionPill}>Sin concentracion por dominio</span>}
              {topDomains.map((domain) => (
                <span key={domain.domain_id} className={styles.dimensionPill}>
                  {domain.domain_id.slice(0, 8)} · exp {domain.exposure.toFixed(3)}
                </span>
              ))}
            </div>
          </div>
          <div className={styles.card}>
            <div className={styles.cardTitle}>Controles mas fragiles</div>
            <div className={styles.dimensionStack}>
              {topControls.map((control) => (
                <span key={control.control_id} className={styles.dimensionPill}>
                  {control.control_code} · eff {control.effectiveness.toFixed(2)} · pc {control.propagation_charge.toFixed(2)}
                </span>
              ))}
            </div>
          </div>
          <div className={styles.card}>
            <div className={styles.cardTitle}>Obligaciones mas expuestas</div>
            <div className={styles.dimensionStack}>
              {topObligations.map((obligation) => (
                <span key={obligation.obligation_id} className={styles.dimensionPill}>
                  {obligation.obligation_code} · exp {obligation.exposure.toFixed(2)}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className={styles.footer}>
        <div className={styles.footerActions}>
          <button className={styles.backButton} onClick={onBack}>Volver</button>
          <button className={styles.primaryButton} onClick={finalize} disabled={!runId || finalizing}>
            {finalizing ? 'Finalizando...' : 'Finalizar evaluacion'}
          </button>
        </div>
      </div>
    </div>
  );
}
