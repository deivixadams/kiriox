'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Sparkles } from 'lucide-react';
import styles from './ExtensionsStep.module.css';

type ExtensionItem = { title: string; notes: string; evidence?: string[] };
type ControlEvaluation = {
  riskId: string;
  controlId: string;
  status: 'cumple' | 'parcial' | 'no_cumple' | '';
  notes: string;
  howToEvaluate?: string;
  evidence?: string[];
};

type DraftRiskAnalysisRow = {
  riskId: string;
  riskName?: string | null;
  mitigatingControlId?: string | null;
  mitigatingControlName?: string | null;
};

type SelectedPair = {
  riskId: string;
  riskName: string;
  controlId: string;
  controlName: string;
};

type ExtensionsStepProps = {
  draftId: string | null;
  evaluations: ControlEvaluation[];
  extensions: ExtensionItem[];
  onChange: (next: ExtensionItem[]) => void;
  onBack: () => void;
  onFinalize: () => void;
  onGenerateReport: (heatmapBase64?: string | null) => void;
  onSave: () => void;
  finalizing?: boolean;
};

const pairKey = (riskId: string, controlId: string) => `${riskId}::${controlId}`;

export default function ExtensionsStep({
  draftId,
  evaluations,
  extensions,
  onChange,
  onBack,
  onFinalize,
  onGenerateReport,
  onSave,
  finalizing
}: ExtensionsStepProps) {
  const [aiLoading, setAiLoading] = useState<Record<number, boolean>>({});
  const [selectedPairs, setSelectedPairs] = useState<SelectedPair[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [reporting, setReporting] = useState(false);

  const addExtension = () => {
    onChange([...extensions, { title: '', notes: '', evidence: [] }]);
  };

  useEffect(() => {
    if (!draftId) {
      setSelectedPairs([]);
      setSummaryLoading(false);
      return;
    }

    const loadSelectionSummary = async () => {
      setSummaryLoading(true);
      try {
        const res = await fetch(`/api/linear-risk/drafts/${draftId}/risk-analysis`, { cache: 'no-store' });
        if (!res.ok) {
          setSelectedPairs([]);
          return;
        }

        const payload = await res.json();
        const rows = Array.isArray(payload?.rows) ? (payload.rows as DraftRiskAnalysisRow[]) : [];
        const nextPairs: SelectedPair[] = [];
        const seen = new Set<string>();

        rows.forEach((row) => {
          const riskId = String(row?.riskId || '').trim();
          const controlId = String(row?.mitigatingControlId || '').trim();
          if (!riskId || !controlId) return;
          const key = pairKey(riskId, controlId);
          if (seen.has(key)) return;
          seen.add(key);
          nextPairs.push({
            riskId,
            riskName: row.riskName || 'Riesgo sin nombre',
            controlId,
            controlName: row.mitigatingControlName || 'Control sin nombre'
          });
        });

        setSelectedPairs(nextPairs);
      } finally {
        setSummaryLoading(false);
      }
    };

    loadSelectionSummary();
  }, [draftId]);

  const updateExtension = (index: number, field: keyof ExtensionItem, value: string) => {
    const next = [...extensions];
    next[index] = { ...next[index], [field]: value };
    onChange(next);
  };

  const removeExtension = (index: number) => {
    onChange(extensions.filter((_, i) => i !== index));
  };

  const handleUploadEvidence = (index: number, file: File) => {
    const next = [...extensions];
    const current = next[index];
    const evidence = current.evidence ? [...current.evidence, file.name] : [file.name];
    next[index] = { ...current, evidence };
    onChange(next);
  };

  const handleAI = async (index: number) => {
    const item = extensions[index];
    if (!item) return;
    if (!item.notes.trim() && !item.title.trim()) {
      alert('Completa al menos el campo de aspecto manual antes de usar IA.');
      return;
    }
    setAiLoading((prev) => ({ ...prev, [index]: true }));
    try {
      const res = await fetch('/api/ai/extension-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: item.title,
          text: item.notes
        })
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data?.text) {
        updateExtension(index, 'notes', data.text);
      }
    } finally {
      setAiLoading((prev) => ({ ...prev, [index]: false }));
    }
  };

  const buildHeatmapImage = async (): Promise<string | null> => {
    if (!draftId) return null;
    try {
      const res = await fetch(`/api/linear-risk/drafts/${draftId}/risk-analysis`, { cache: 'no-store' });
      if (!res.ok) return null;
      const payload = await res.json();
      const rows = Array.isArray(payload?.rows) ? payload.rows : [];
      if (!rows.length) return null;

      const echarts = await import('echarts');
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '-10000px';
      container.style.top = '-10000px';
      container.style.width = '1200px';
      container.style.height = '820px';
      document.body.appendChild(container);

      const chart = echarts.init(container, undefined, { renderer: 'canvas' });
      const points = rows
        .map((row: any) => {
          const probability = Number(row?.probability ?? NaN);
          const impact = Number(row?.impact ?? NaN);
          if (!Number.isFinite(probability) || !Number.isFinite(impact)) return null;
          const residual = Number(row?.residualScore ?? NaN);
          return {
            name: row?.riskName || row?.riskCode || 'Riesgo',
            value: [impact, probability, Number.isFinite(residual) ? residual : 0]
          };
        })
        .filter(Boolean);

      chart.setOption({
        animation: false,
        backgroundColor: 'transparent',
        grid: {
          left: 120,
          right: 32,
          top: 42,
          bottom: 56,
          containLabel: true,
          show: true,
          borderWidth: 0,
          backgroundColor: new echarts.graphic.RadialGradient(1.0, -0.02, 1.58, [
            { offset: 0.0, color: '#ff2f38' },
            { offset: 0.24, color: '#ff7a1f' },
            { offset: 0.5, color: '#b8a300' },
            { offset: 0.74, color: '#f4c300' },
            { offset: 1.0, color: '#08b052' }
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
          axisLabel: { color: 'rgba(255,255,255,0.88)', fontSize: 11 },
          nameTextStyle: { color: '#93a7c2', fontWeight: 700, fontSize: 12 },
          axisLine: { lineStyle: { color: 'rgba(255,255,255,0.22)' } },
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
          axisLabel: { color: 'rgba(255,255,255,0.88)', fontSize: 11 },
          nameTextStyle: { color: '#93a7c2', fontWeight: 700, fontSize: 12 },
          axisLine: { lineStyle: { color: 'rgba(255,255,255,0.22)' } },
          splitLine: { show: true, lineStyle: { color: 'rgba(255,255,255,0.42)', width: 1 } }
        },
        series: [
          {
            type: 'scatter',
            data: points,
            symbol: 'circle',
            symbolSize: 16,
            itemStyle: {
              color: 'rgba(255,255,255,0.1)',
              borderColor: '#ffffff',
              borderWidth: 2
            }
          }
        ]
      });

      const dataUrl = chart.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: 'transparent' });
      chart.dispose();
      container.remove();
      return dataUrl;
    } catch {
      return null;
    }
  };

  const handleGenerateReport = async () => {
    if (!draftId || reporting) return;
    setReporting(true);
    try {
      const heatmap = await buildHeatmapImage();
      onGenerateReport(heatmap);
    } finally {
      setReporting(false);
    }
  };

  const summary = useMemo(() => {
    const evalMap = new Map<string, ControlEvaluation>();
    evaluations.forEach((ev) => evalMap.set(pairKey(ev.riskId, ev.controlId), ev));

    const universe = selectedPairs.length > 0
      ? selectedPairs
      : evaluations.map((ev) => ({
          riskId: ev.riskId,
          riskName: 'Riesgo',
          controlId: ev.controlId,
          controlName: 'Control'
        }));

    let cumple = 0;
    let parcial = 0;
    let noCumple = 0;
    let pendientes = 0;

    const pendingItems: string[] = [];

    universe.forEach((pair) => {
      const status = evalMap.get(pairKey(pair.riskId, pair.controlId))?.status || '';
      if (status === 'cumple') cumple += 1;
      else if (status === 'parcial') parcial += 1;
      else if (status === 'no_cumple') noCumple += 1;
      else {
        pendientes += 1;
        pendingItems.push(`${pair.riskName} -> ${pair.controlName}`);
      }
    });

    const total = universe.length;
    const evaluated = cumple + parcial + noCumple;
    const avance = total > 0 ? Math.round((evaluated / total) * 100) : 0;

    return {
      total,
      evaluated,
      pendiente: pendientes,
      cumple,
      parcial,
      noCumple,
      avance,
      pendingItems: pendingItems.slice(0, 6)
    };
  }, [evaluations, selectedPairs]);

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.title}>Resumen Paso 5</div>
        <div className={styles.subtitle}>Estado consolidado de la evaluación de controles seleccionados en el Paso 2.</div>
      </div>

      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Controles seleccionados</span>
          <span className={styles.summaryValue}>{summaryLoading ? '...' : summary.total}</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Controles evaluados</span>
          <span className={styles.summaryValue}>{summaryLoading ? '...' : summary.evaluated}</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Avance</span>
          <span className={styles.summaryValue}>{summaryLoading ? '...' : `${summary.avance}%`}</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Pendientes</span>
          <span className={styles.summaryValue}>{summaryLoading ? '...' : summary.pendiente}</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Cumple / Parcial / No cumple</span>
          <span className={styles.summaryValue}>
            {summaryLoading ? '...' : `${summary.cumple} / ${summary.parcial} / ${summary.noCumple}`}
          </span>
        </div>
      </div>

      {!summaryLoading && summary.pendingItems.length > 0 && (
        <div className={styles.pendingBox}>
          <div className={styles.pendingTitle}>Pendientes clave</div>
          <ul className={styles.pendingList}>
            {summary.pendingItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      <div className={styles.list}>
        {extensions.map((item, idx) => (
          <div key={idx} className={styles.card}>
            <input
              value={item.title}
              onChange={(e) => updateExtension(idx, 'title', e.target.value)}
              className={styles.input}
              placeholder="Aspecto manual"
            />
            <textarea
              value={item.notes}
              onChange={(e) => updateExtension(idx, 'notes', e.target.value)}
              className={styles.textarea}
              placeholder="Notas"
            />
            <div className={styles.notesFooter}>
              <button
                type="button"
                className={styles.aiButton}
                onClick={() => handleAI(idx)}
                disabled={!!aiLoading[idx]}
              >
                {aiLoading[idx] ? (
                  '...'
                ) : (
                  <>
                    <Sparkles className={styles.aiIcon} /> IA
                  </>
                )}
              </button>
            </div>
            <div className={styles.uploadRow}>
              {[0, 1, 2].map((slot) => (
                <label key={slot} className={styles.uploadButton}>
                  <input
                    type="file"
                    className={styles.uploadInput}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      e.currentTarget.value = '';
                      handleUploadEvidence(idx, file);
                    }}
                  />
                  Subir evidencia {slot + 1}
                </label>
              ))}
            </div>
            <button className={styles.removeButton} onClick={() => removeExtension(idx)}>Eliminar</button>
          </div>
        ))}
      </div>

      <button className={styles.addButton} onClick={addExtension}>
        <Plus className={styles.addIcon} /> Agregar aspecto
      </button>

      <div className={styles.footer}>
        <div className={styles.footerActions}>
          <button className={styles.backButton} onClick={onBack}>Volver</button>
          <button className={styles.ghostButton} onClick={onSave}>Guardar</button>
          <button className={styles.secondaryButton} onClick={onFinalize} disabled={!!finalizing}>
            {finalizing ? 'Finalizando...' : 'Finalizar evaluación'}
          </button>
          <button className={styles.primaryButton} onClick={handleGenerateReport} disabled={reporting || !!finalizing}>
            {reporting ? 'Generando...' : 'Generar informe'}
          </button>
        </div>
      </div>
    </div>
  );
}
