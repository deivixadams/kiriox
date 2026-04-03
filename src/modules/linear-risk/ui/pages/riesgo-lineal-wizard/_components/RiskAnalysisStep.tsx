'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Flame } from 'lucide-react';
import styles from './RiskAnalysisStep.module.css';
import RiskHeatmapModal from './RiskHeatmapModal';

type ControlOption = {
  id: string;
  code: string | null;
  name: string;
  description: string | null;
};

type RiskAnalysisRow = {
  rowId: string;
  draftItemId: string;
  significantActivityId: string;
  activityCode: string;
  activityName: string;
  activityDescription: string | null;
  riskCatalogId: string;
  riskCode: string | null;
  riskName: string | null;
  riskDescription: string | null;
  probabilityLabel: string | null;
  probability: number | null;
  impactLabel: string | null;
  impact: number | null;
  inherentRisk: number | null;
  inherentScale?: {
    code: string;
    name: string;
    min_value: number;
    max_value: number;
    severity_rank: number;
    color_hex?: string | null;
    applies_to: string;
    version: number;
  } | null;
  mitigatingControlId: string | null;
  mitigatingControlCode: string | null;
  mitigatingControlName: string | null;
  mitigatingControlDescription: string | null;
  coveragePct: number;
  residualScore: number | null;
  residualScale?: {
    code: string;
    name: string;
    min_value: number;
    max_value: number;
    severity_rank: number;
    color_hex?: string | null;
    applies_to: string;
    version: number;
  } | null;
  availableControls: ControlOption[];
};

type SaveRow = {
  rowId?: string;
  draftItemId: string;
  riskCatalogId: string;
  mitigatingControlId?: string | null;
  coveragePct?: number | null;
  residualScore?: number | null;
  probability?: number | null;
  impact?: number | null;
};

type RiskAnalysisStepProps = {
  draftId: string | null;
  onBack: () => void;
  onNext: () => void;
  onSave: () => void;
};

const clampCoverage = (value: number) => {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
};

const toResidual = (inherentRisk: number | null, coveragePct: number) => {
  if (inherentRisk == null) return null;
  return Number((inherentRisk * (1 - coveragePct / 100)).toFixed(6));
};

export default function RiskAnalysisStep({ draftId, onBack, onNext, onSave }: RiskAnalysisStepProps) {
  const [rows, setRows] = useState<RiskAnalysisRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHeatmapOpen, setIsHeatmapOpen] = useState(false);

  const loadRows = useCallback(async () => {
    if (!draftId) {
      setRows([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/linear-risk/drafts/${draftId}/risk-analysis`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'No se pudo cargar el análisis de riesgo.');

      const incoming = Array.isArray(data?.rows) ? data.rows : [];
      setRows(
        incoming.map((row: any) => {
          const inherentRisk = row?.inherentRisk == null ? null : Number(row.inherentRisk);
          const coveragePct = clampCoverage(Number(row?.coveragePct ?? 0));
          const residualScore = row?.residualScore == null ? toResidual(inherentRisk, coveragePct) : Number(row.residualScore);
          return {
            rowId: String(row?.rowId || crypto.randomUUID()),
            draftItemId: String(row?.draftItemId || ''),
            significantActivityId: String(row?.significantActivityId || ''),
            activityCode: String(row?.activityCode || ''),
            activityName: String(row?.activityName || ''),
            activityDescription: row?.activityDescription ?? null,
            riskCatalogId: String(row?.riskCatalogId || ''),
            riskCode: row?.riskCode ?? null,
            riskName: row?.riskName ?? null,
            riskDescription: row?.riskDescription ?? null,
            probabilityLabel: row?.probabilityLabel ?? null,
            probability: row?.probability == null ? null : Number(row.probability),
            impactLabel: row?.impactLabel ?? null,
            impact: row?.impact == null ? null : Number(row.impact),
            inherentRisk,
            inherentScale: row?.inherentScale ?? null,
            mitigatingControlId: row?.mitigatingControlId ?? null,
            mitigatingControlCode: row?.mitigatingControlCode ?? null,
            mitigatingControlName: row?.mitigatingControlName ?? null,
            mitigatingControlDescription: row?.mitigatingControlDescription ?? null,
            coveragePct,
            residualScore,
            residualScale: row?.residualScale ?? null,
            availableControls: Array.isArray(row?.availableControls) ? row.availableControls : [],
          } as RiskAnalysisRow;
        })
      );
    } catch (err: any) {
      setError(err?.message || 'Error cargando análisis de riesgo.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [draftId]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  const updateRow = (rowId: string, patch: Partial<RiskAnalysisRow>) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.rowId !== rowId) return row;
        const next = { ...row, ...patch };
        const coveragePct = clampCoverage(next.coveragePct);
        const residualScore = toResidual(next.inherentRisk, coveragePct);
        let controlName = next.mitigatingControlName;
        let controlCode = next.mitigatingControlCode;
        let controlDescription = next.mitigatingControlDescription;
        if (patch.mitigatingControlId !== undefined) {
          const selected = next.availableControls.find((c) => c.id === patch.mitigatingControlId) ?? null;
          controlName = selected?.name ?? null;
          controlCode = selected?.code ?? null;
          controlDescription = selected?.description ?? null;
        }
        return {
          ...next,
          coveragePct,
          residualScore,
          mitigatingControlName: controlName ?? null,
          mitigatingControlCode: controlCode ?? null,
          mitigatingControlDescription: controlDescription ?? null,
        };
      })
    );
  };

  const persist = useCallback(async () => {
    if (!draftId) return true;
    setSaving(true);
    setError(null);
    try {
      await fetch('/api/auth/csrf');
      const payload: SaveRow[] = rows.map((row) => ({
        rowId: row.rowId,
        draftItemId: row.draftItemId,
        riskCatalogId: row.riskCatalogId,
        mitigatingControlId: row.mitigatingControlId ?? null,
        coveragePct: row.coveragePct,
        residualScore: row.residualScore,
        probability: row.probability,
        impact: row.impact,
      }));

      const res = await fetch(`/api/linear-risk/drafts/${draftId}/risk-analysis`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: payload }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'No se pudo guardar el análisis de riesgo.');
      return true;
    } catch (err: any) {
      setError(err?.message || 'Error guardando análisis de riesgo.');
      return false;
    } finally {
      setSaving(false);
    }
  }, [draftId, rows]);

  const totalResidual = useMemo(
    () => Number(rows.reduce((acc, row) => acc + (row.residualScore ?? 0), 0).toFixed(6)),
    [rows]
  );

  const heatmapRows = useMemo(
    () =>
      rows.map((row) => ({
        rowId: row.rowId,
        elementName: row.activityName || null,
        customElementName: null,
        riskName: row.riskName,
        probability: row.probability,
        impact: row.impact,
        baseScore: row.inherentRisk,
        riskScore: row.residualScore,
        mitigatingControlName: row.mitigatingControlName,
        mitigationLevel: row.coveragePct > 0 ? 'PARCIAL' : null,
        inherentScale: row.inherentScale ?? null,
        residualScale: row.residualScale ?? null,
      })),
    [rows]
  );

  const handleSaveClick = async () => {
    const ok = await persist();
    if (ok) onSave();
  };

  const handleBackClick = async () => {
    await persist();
    onBack();
  };

  const handleNextClick = async () => {
    const ok = await persist();
    if (ok) onNext();
  };

  const handleHeatmapClick = async () => {
    if (rows.length === 0) {
      setError('No hay filas para mostrar en el mapa de calor.');
      return;
    }
    const ok = await persist();
    if (!ok) return;
    await loadRows();
    setError(null);
    setIsHeatmapOpen(true);
  };

  if (loading) {
    return <div className={styles.loading}>Cargando mitigación y riesgo residual...</div>;
  }

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <p className={styles.subtitle}>
          Paso 3 consolida el riesgo inherente del Paso 2, aplica control mitigante y porcentaje de cobertura para calcular el riesgo residual por actividad.
        </p>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Actividad</th>
              <th>Riesgo</th>
              <th>Probabilidad</th>
              <th>Impacto</th>
              <th>Riesgo inherente</th>
              <th>Control mitigante</th>
              <th>% Cobertura</th>
              <th>Riesgo residual</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className={styles.empty}>
                  No hay datos en Paso 2 para construir el análisis de mitigación.
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.rowId}>
                <td>
                  <div className={styles.cellMain}>{row.activityName || '-'}</div>
                  {row.activityCode && <div className={styles.cellSub}>{row.activityCode}</div>}
                </td>
                <td>
                  <div className={styles.cellMain}>{row.riskName || 'Sin riesgo'}</div>
                  {row.riskCode && <div className={styles.cellSub}>{row.riskCode}</div>}
                </td>
                <td>
                  <div className={styles.cellMain}>{row.probabilityLabel || '-'}</div>
                  <div className={styles.cellSub}>{row.probability == null ? '-' : row.probability.toFixed(2)}</div>
                </td>
                <td>
                  <div className={styles.cellMain}>{row.impactLabel || '-'}</div>
                  <div className={styles.cellSub}>{row.impact == null ? '-' : row.impact.toFixed(2)}</div>
                </td>
                <td>
                  <span className={styles.scoreCell}>
                    {row.inherentRisk == null ? '--' : row.inherentRisk.toFixed(4)}
                  </span>
                </td>
                <td>
                  <select
                    value={row.mitigatingControlId ?? ''}
                    onChange={(event) => updateRow(row.rowId, { mitigatingControlId: event.target.value || null })}
                    className={styles.selectInput}
                  >
                    <option value="">Seleccione control...</option>
                    {row.availableControls.map((control) => (
                      <option key={`${row.rowId}-${control.id}`} value={control.id}>
                        {control.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={row.coveragePct}
                    onChange={(event) => updateRow(row.rowId, { coveragePct: Number(event.target.value) })}
                    className={styles.numberInput}
                  />
                </td>
                <td>
                  <span className={styles.scoreCell}>
                    {row.residualScore == null ? '--' : row.residualScore.toFixed(4)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className={styles.totalRow}>
                <td colSpan={7} className={styles.totalLabel}>Riesgo total residual</td>
                <td className={styles.totalValue}>{totalResidual.toFixed(4)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <div className={styles.footer}>
        <button className={styles.heatmapButton} onClick={handleHeatmapClick} type="button">
          <Flame size={16} /> Mapa de calor
        </button>
        <button className={styles.backButton} onClick={handleBackClick} disabled={saving}>
          Volver
        </button>
        <button className={styles.ghostButton} onClick={handleSaveClick} disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
        <button className={styles.primaryButton} onClick={handleNextClick} disabled={saving}>
          Continuar
        </button>
      </div>

      <RiskHeatmapModal
        open={isHeatmapOpen}
        rows={heatmapRows}
        onClose={() => setIsHeatmapOpen(false)}
        onLaunchAudit={async () => {
          setIsHeatmapOpen(false);
          await handleNextClick();
        }}
      />
    </div>
  );
}
