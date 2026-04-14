'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './RiskHeatmapModal.module.css';

type HeatmapRow = {
  rowId: string;
  riskCode?: string | null;
  elementName: string | null;
  customElementName?: string | null;
  riskName: string | null;
  probability?: number | null;
  impact?: number | null;
  baseScore: number | null;
  riskScore: number | null;
  mitigatingControlName: string | null;
  mitigationLevel: string | null;
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
};

type RiskHeatmapModalProps = {
  open: boolean;
  rows: HeatmapRow[];
  onClose: () => void;
};

type MetricMode = 'inherent' | 'residual';

const probabilityAxis = ['1 Muy Baja', '2 Baja', '3 Media', '4 Alta', '5 Muy Alta'];
const impactAxis = ['1 Muy Bajo', '2 Bajo', '3 Medio', '4 Alto', '5 Muy Alto'];

function clampLevel(value: number | null | undefined): number | null {
  if (value == null || Number.isNaN(value)) return null;
  if (value <= 1) return 1;
  if (value >= 5) return 5;
  const rounded = Math.round(value);
  if (rounded < 1 || rounded > 5) return null;
  return rounded;
}

function clampAxis(value: number | null | undefined): number | null {
  if (value == null || Number.isNaN(value)) return null;
  if (value <= 1) return 1;
  if (value >= 5) return 5;
  return value;
}

function clampScatterCoord(value: number) {
  return Math.max(1.06, Math.min(4.94, value));
}

function computeJitteredCoords(impact: number, probability: number, indexInCell: number): [number, number] {
  if (indexInCell === 0) {
    return [clampScatterCoord(impact), clampScatterCoord(probability)];
  }

  // Keep first point centered and distribute overlaps in rings towards valid plot area.
  const ringIndex = indexInCell - 1;
  const angle = (ringIndex % 8) * (Math.PI / 4);
  const ring = 1 + Math.floor(ringIndex / 8);
  const radius = 0.22 + (ring - 1) * 0.12;

  const jitteredImpact = impact + Math.cos(angle) * radius;
  const jitteredProbability = probability + Math.sin(angle) * radius;
  return [clampScatterCoord(jitteredImpact), clampScatterCoord(jitteredProbability)];
}

function getSeverityByScale(scale?: { name?: string | null; severity_rank?: number | null; color_hex?: string | null }) {
  if (scale?.name) {
    const rank = scale.severity_rank ?? 0;
    const label = String(scale.name);
    if (scale.color_hex) return { label, color: scale.color_hex, level: rank };
    if (rank <= 1) return { label, color: '#09b253', level: rank };
    if (rank <= 2) return { label, color: '#f4c300', level: rank };
    if (rank <= 3) return { label, color: '#b8a300', level: rank };
    return { label, color: '#ff3b30', level: rank };
  }
  return { label: 'Sin escala', color: '#94a3b8', level: 0 };
}

function pickScore(row: HeatmapRow, metric: MetricMode): number | null {
  return metric === 'inherent' ? row.baseScore : row.riskScore;
}

function scoreToLevel(score: number | null): number | null {
  if (score == null || Number.isNaN(score)) return null;
  if (score <= 5) return 1;
  if (score <= 10) return 2;
  if (score <= 15) return 3;
  if (score <= 20) return 4;
  return 5;
}

function scoreToAxis(score: number | null): number | null {
  if (score == null || Number.isNaN(score)) return null;
  if (score <= 0) return 1;
  // Mapea score [1..25] en eje [1..5].
  const normalized = 1 + ((Math.min(25, score) - 1) / 24) * 4;
  return clampAxis(normalized);
}

function resolveCoords(row: HeatmapRow, metric: MetricMode): { probability: number | null; impact: number | null } {
  const baseProbability = clampAxis(row.probability);
  const baseImpact = clampAxis(row.impact);
  const baseScore = row.baseScore == null ? null : Number(row.baseScore);
  const residualScore = row.riskScore == null ? null : Number(row.riskScore);

  if (metric === 'inherent') {
    if (baseProbability != null && baseImpact != null) {
      return { probability: baseProbability, impact: baseImpact };
    }
    const fallbackAxis = scoreToAxis(baseScore);
    return { probability: fallbackAxis, impact: fallbackAxis };
  }

  // Residual: proyecta desde el punto inherente hacia abajo-izquierda según reducción real del score.
  if (
    baseProbability != null &&
    baseImpact != null &&
    baseScore != null &&
    baseScore > 0 &&
    residualScore != null
  ) {
    const ratio = Math.max(0, Math.min(1, residualScore / baseScore));
    const shrink = Math.sqrt(ratio);
    return {
      probability: clampAxis(baseProbability * shrink),
      impact: clampAxis(baseImpact * shrink),
    };
  }

  if (baseProbability != null && baseImpact != null) {
    return { probability: baseProbability, impact: baseImpact };
  }

  const fallbackAxis = scoreToAxis(residualScore ?? baseScore);
  return { probability: fallbackAxis, impact: fallbackAxis };
}

export default function RiskHeatmapModal({ open, rows, onClose }: RiskHeatmapModalProps) {
  const [metric, setMetric] = useState<MetricMode>('residual');
  const chartRef = useRef<HTMLDivElement | null>(null);

  const prepared = useMemo(() => {
    const validRows = rows
      .map((row) => {
        const { probability, impact } = resolveCoords(row, metric);

        return {
          row,
          probability,
          impact
        };
      })
      .filter((item): item is { row: HeatmapRow; probability: number; impact: number } => item.probability !== null && item.impact !== null);

    const inCellCounter = new Map<string, number>();
    const points = validRows.map(({ row, probability, impact }) => {
      const score = pickScore(row, metric) ?? 0;
      const key = `${probability}:${impact}`;
      const indexInCell = inCellCounter.get(key) ?? 0;
      inCellCounter.set(key, indexInCell + 1);
      const [scatterImpact, scatterProbability] = computeJitteredCoords(impact, probability, indexInCell);
      const riskLabel = row.riskName || row.riskCode || 'Riesgo';
      const elementLabel = row.customElementName || row.elementName || 'Elemento';
      const base = row.baseScore == null ? '--' : row.baseScore.toFixed(4);
      const residual = row.riskScore == null ? '--' : row.riskScore.toFixed(4);
      const inherentClass = row.inherentScale?.name || 'Sin escala';
      const residualClass = row.residualScale?.name || 'Sin escala';
      return {
        name: `${elementLabel} | ${riskLabel}`,
        value: [scatterImpact, scatterProbability, score],
        symbolSize: 11 + Math.min(12, Math.max(0, score * 0.7)),
        itemStyle: {
          color: 'rgba(255,255,255,0.06)',
          borderColor: '#ffffff',
          borderWidth: 2,
          shadowBlur: 10,
          shadowColor: 'rgba(2,6,23,0.7)'
        },
        label: {
          show: false,
          formatter: riskLabel,
          position: 'right',
          color: '#0f172a',
          fontWeight: 700,
          fontSize: 11,
          padding: [0, 0, 0, 6]
        },
        tooltipHtml: [
          `<strong>${riskLabel}</strong>`,
          `${elementLabel}`,
          `Probabilidad: ${row.probability == null ? '--' : row.probability}`,
          `Impacto: ${row.impact == null ? '--' : row.impact}`,
          `Riesgo inherente: ${base}`,
          `Clasificación inherente: ${inherentClass}`,
          `Riesgo residual: ${residual}`,
          `Clasificación residual: ${residualClass}`,
          `Métrica visualizada: ${metric === 'inherent' ? 'Inherente' : 'Residual'}`,
          `Posición en mapa (I,P): ${scatterImpact.toFixed(2)}, ${scatterProbability.toFixed(2)}`,
          `Control: ${row.mitigatingControlName || 'Sin control'}${row.mitigationLevel ? ` (${row.mitigationLevel})` : ''}`
        ].join('<br/>')
      };
    });

    const topRows = [...rows]
      .map((row) => ({
        row,
        score: metric === 'residual' ? (row.riskScore ?? 0) : (row.baseScore ?? 0),
        scale: metric === 'residual' ? row.residualScale : row.inherentScale
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    return {
      points,
      topRows,
      plottedCount: validRows.length,
      totalCount: rows.length
    };
  }, [metric, rows]);

  useEffect(() => {
    if (!open || !chartRef.current) return;

    let chart: any;
    let mounted = true;

    const mount = async () => {
      const echarts = await import('echarts');
      if (!mounted || !chartRef.current) return;

      chart = echarts.init(chartRef.current, undefined, { renderer: 'canvas' });
      chart.setOption({
        animation: false,
        backgroundColor: 'transparent',
        tooltip: {
          formatter: (params: any) => {
            if (params.seriesType === 'scatter') return params.data.tooltipHtml;
            return '';
          }
        },
        grid: {
          left: 120,
          right: 32,
          top: 42,
          bottom: 56,
          containLabel: true,
          show: true,
          borderWidth: 0,
          // Smooth radial half-moon with balanced color distribution.
          // Center slightly outside top-right; larger radius prevents green from dominating.
          backgroundColor: new echarts.graphic.RadialGradient(1.0, -0.02, 1.58, [
            { offset: 0.0, color: '#ff2f38' },   // rojo intenso
            { offset: 0.24, color: '#ff7a1f' },  // transición cálida
            { offset: 0.5, color: '#b8a300' },   // mostaza
            { offset: 0.74, color: '#f4c300' },  // amarillo
            { offset: 1.0, color: '#08b052' }    // verde
          ])
        },
        xAxis: {
          type: 'value',
          min: 1,
          max: 5,
          interval: 1,
          name: 'Impacto',
          nameLocation: 'middle',
          nameGap: 34,
          axisLabel: {
            color: 'rgba(255,255,255,0.88)',
            fontSize: 11,
            formatter: (value: number) => impactAxis[Math.round(value) - 1] || ''
          },
          nameTextStyle: { color: '#93a7c2', fontWeight: 700, fontSize: 12 },
          axisLine: { lineStyle: { color: 'rgba(255,255,255,0.22)' } },
          axisTick: { show: false },
          splitArea: { show: false },
          splitLine: { show: true, lineStyle: { color: 'rgba(255,255,255,0.42)', width: 1 } }
        },
        yAxis: {
          type: 'value',
          min: 1,
          max: 5,
          interval: 1,
          name: 'Probabilidad',
          nameLocation: 'middle',
          nameGap: 72,
          axisLabel: {
            color: 'rgba(255,255,255,0.88)',
            fontSize: 11,
            formatter: (value: number) => probabilityAxis[Math.round(value) - 1] || ''
          },
          nameTextStyle: { color: '#93a7c2', fontWeight: 700, fontSize: 12 },
          axisLine: { lineStyle: { color: 'rgba(255,255,255,0.22)' } },
          axisTick: { show: false },
          splitArea: { show: false },
          splitLine: { show: true, lineStyle: { color: 'rgba(255,255,255,0.42)', width: 1 } }
        },
        series: [
          {
            type: 'scatter',
            name: metric === 'inherent' ? 'Riesgo inherente' : 'Riesgo residual',
            data: prepared.points,
            symbol: 'circle',
            zlevel: 2
          },
          {
            type: 'effectScatter',
            name: 'Pulse',
            data: prepared.points,
            symbol: 'circle',
            zlevel: 3,
            tooltip: { show: false },
            silent: true,
            rippleEffect: {
              period: 2,
              scale: 1.35,
              brushType: 'stroke'
            },
            itemStyle: {
              color: 'rgba(255,255,255,0.15)'
            }
          }
        ]
      });
    };

    const onResize = () => {
      if (chart) chart.resize();
    };

    mount();
    window.addEventListener('resize', onResize);
    return () => {
      mounted = false;
      window.removeEventListener('resize', onResize);
      if (chart) chart.dispose();
    };
  }, [metric, open, prepared]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Mapa de calor de riesgo" onClick={onClose}>
      <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.titleBlock}>
            <h3 className={styles.title}>Mapa de Calor de Riesgo</h3>
            <p className={styles.subtitle}>Matriz de auditoría 5x5 basada en Probabilidad vs Impacto</p>
          </div>
          <button type="button" className={styles.closeButton} onClick={onClose}>
            Cerrar
          </button>
        </div>
        <div className={styles.toolbar}>
          <div className={styles.metricSwitch}>
            <button
              type="button"
              className={`${styles.metricButton} ${metric === 'inherent' ? styles.metricButtonActive : ''}`}
              onClick={() => setMetric('inherent')}
            >
              Ver Inherente
            </button>
            <button
              type="button"
              className={`${styles.metricButton} ${metric === 'residual' ? styles.metricButtonActive : ''}`}
              onClick={() => setMetric('residual')}
            >
              Ver Residual
            </button>
          </div>
          <p className={styles.toolbarHint}>
            Puntos en mapa: {prepared.plottedCount}/{prepared.totalCount}. Separación automática para riesgos que comparten celda.
          </p>
        </div>
        <div className={styles.content}>
          {rows.length === 0 ? (
            <div className={styles.empty}>No hay filas para construir el mapa de calor.</div>
          ) : (
            <>
              <div className={styles.chart} ref={chartRef} />
              <aside className={styles.sidePanel}>
                <h4 className={styles.sideTitle}>Top Riesgos ({metric === 'residual' ? 'Residual' : 'Inherente'})</h4>
                <div className={styles.sideList}>
                  {prepared.topRows.map(({ row, score, scale }, index) => {
                    const sev = getSeverityByScale(scale || undefined);
                    return (
                      <div key={row.rowId} className={styles.sideItem}>
                        <div className={styles.sideItemHeader}>
                          <span className={styles.sideRank}>#{index + 1}</span>
                          <span className={styles.sideScore}>{score.toFixed(4)}</span>
                        </div>
                        <div className={styles.sideRisk}>{row.riskCode || row.riskName || 'Riesgo'}</div>
                        <div className={styles.sideElement}>{row.customElementName || row.elementName || 'Elemento'}</div>
                        <div className={styles.sideMeta}>
                          <span style={{ color: sev.color }}>{sev.label}</span>
                          <span>{row.mitigatingControlName || 'Sin control'}</span>
                        </div>
                      </div>
                    );
                  })}
                  {prepared.topRows.length === 0 && <div className={styles.emptySmall}>Sin datos para ranking.</div>}
                </div>
              </aside>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
