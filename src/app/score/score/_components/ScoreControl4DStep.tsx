'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Sparkles, Upload, RotateCcw } from 'lucide-react';
import styles from './ScoreControl4DStep.module.css';

type ControlItem = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  evaluation_4d?: {
    dimensions: Record<DimensionKey, DimensionStatus>;
    notes: string;
  } | null;
};

type DimensionKey = 'existencia' | 'diseno' | 'formalizacion' | 'operacion';
type DimensionStatus = 'cumple' | 'parcial' | 'no_cumple' | '';

type ControlEvaluation = {
  controlId: string;
  dimensions: Record<DimensionKey, DimensionStatus>;
  notes: string;
  dimensionNotes: Record<DimensionKey, string>;
};

type Props = {
  runId: string | null;
  evaluations: ControlEvaluation[];
  onChange: (next: ControlEvaluation[]) => void;
  onBack: () => void;
  onNext: () => void;
  onSave: () => void;
};

const DIMENSIONS: { key: DimensionKey; label: string; helper: string }[] = [
  { key: 'existencia', label: 'Existencia', helper: 'Existe el control de forma verificable.' },
  { key: 'diseno', label: 'Diseño', helper: 'Diseño adecuado y alineado al riesgo.' },
  { key: 'formalizacion', label: 'Formalizacion', helper: 'Documentado, aprobado y vigente.' },
  { key: 'operacion', label: 'Operacion', helper: 'Funciona de forma consistente.' },
];

export default function ScoreControl4DStep({
  runId,
  evaluations,
  onChange,
  onBack,
  onNext,
  onSave,
}: Props) {
  const [controls, setControls] = useState<ControlItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [activeControlId, setActiveControlId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (!runId) return;
    let alive = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/score/runs/${runId}/controls`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'No se pudo cargar controles');
        if (!alive) return;
        const list = Array.isArray(data.controls) ? data.controls : [];
        setControls(list);
        if (list.length > 0) {
          const seeded = list
            .filter((c: any) => c.evaluation_4d)
            .map((c: any) => ({
              controlId: c.id,
              dimensions: c.evaluation_4d.dimensions,
              notes: c.evaluation_4d.notes || '',
            }));
          if (seeded.length > 0) onChange(seeded);
        }
        setActiveControlId((prev) => (prev && list.some((c: any) => c.id === prev) ? prev : list[0]?.id || null));
      } catch {
        if (alive) setControls([]);
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => {
      alive = false;
    };
  }, [runId]);

  const filteredControls = useMemo(() => {
    const term = query.trim().toLowerCase();
    const base = term
      ? controls.filter((control) => (control.name || '').toLowerCase().includes(term))
      : controls;
    return [...base].sort((a, b) =>
      String(a.code || '').localeCompare(String(b.code || ''), 'es', { sensitivity: 'base' })
    );
  }, [controls, query]);

  const evalMap = useMemo(() => {
    const map = new Map<string, ControlEvaluation>();
    evaluations.forEach((ev) => map.set(ev.controlId, ev));
    return map;
  }, [evaluations]);

  const activeControl = useMemo(
    () => controls.find((control) => control.id === activeControlId) || null,
    [controls, activeControlId]
  );

  const saveEvaluation = async (controlId: string, evaluation: ControlEvaluation) => {
    if (!runId) return;
    await fetch(`/api/score/runs/${runId}/controls/${controlId}/evaluation`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ evaluation }),
    });
  };

  const updateEvaluation = (controlId: string, patch: Partial<ControlEvaluation>) => {
    const existing = evalMap.get(controlId);
    const nextItem: ControlEvaluation = {
      controlId,
      dimensions: existing?.dimensions || {
        existencia: '',
        diseno: '',
        formalizacion: '',
        operacion: '',
      },
      notes: existing?.notes || '',
      dimensionNotes: existing?.dimensionNotes || {
        existencia: '',
        diseno: '',
        formalizacion: '',
        operacion: '',
      },
      ...patch,
    };
    const next = evaluations.filter((ev) => ev.controlId !== controlId);
    next.push(nextItem);
    onChange(next);
    saveEvaluation(controlId, nextItem);
  };

  const handleRefineNotes = async (control: ControlItem, notes: string) => {
    if (!runId) return;
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai/control-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          controlName: control.name,
          text: notes,
          howToEvaluate: '',
          coverageNotes: '',
          controlDescription: control.description || '',
        }),
      });
      const data = await res.json();
      if (res.ok && data?.text) {
        updateEvaluation(control.id, { notes: data.text });
      }
    } finally {
      setAiLoading(false);
    }
  };

  const handleRefineDimensionNotes = async (
    control: ControlItem,
    dimension: DimensionKey,
    notes: string
  ) => {
    if (!runId) return;
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai/control-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          controlName: `${control.name} · ${dimension}`,
          text: notes,
          howToEvaluate: '',
          coverageNotes: '',
          controlDescription: control.description || '',
        }),
      });
      const data = await res.json();
      if (res.ok && data?.text) {
        const existing = evalMap.get(control.id);
        const nextNotes = {
          existencia: existing?.dimensionNotes?.existencia || '',
          diseno: existing?.dimensionNotes?.diseno || '',
          formalizacion: existing?.dimensionNotes?.formalizacion || '',
          operacion: existing?.dimensionNotes?.operacion || '',
        };
        nextNotes[dimension] = data.text;
        updateEvaluation(control.id, { dimensionNotes: nextNotes });
      }
    } finally {
      setAiLoading(false);
    }
  };

  const handleUploadEvidence = async (control: ControlItem, file: File, dimension: string) => {
    if (!runId) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('run_id', runId);
      formData.append('control_id', control.id);
      formData.append('dimension', dimension);
      formData.append('test_id', control.id);
      const res = await fetch('/api/score/evidence/upload', { method: 'POST', body: formData });
      if (!res.ok) return;
    } finally {
      setUploading(false);
    }
  };

  const updateDimension = (controlId: string, key: DimensionKey, status: DimensionStatus) => {
    const existing = evalMap.get(controlId);
    const nextDims = {
      existencia: existing?.dimensions?.existencia || '',
      diseno: existing?.dimensions?.diseno || '',
      formalizacion: existing?.dimensions?.formalizacion || '',
      operacion: existing?.dimensions?.operacion || '',
    };
    nextDims[key] = nextDims[key] === status ? '' : status;
    updateEvaluation(controlId, { dimensions: nextDims });
  };

  const evaluatedCount = useMemo(() => {
    return evaluations.filter((ev) => Object.values(ev.dimensions || {}).some((v) => v)).length;
  }, [evaluations]);

  if (!runId) {
    return (
      <div className={styles.root}>
        <div className={styles.emptyState}>
          <AlertTriangle className={styles.emptyIcon} />
          <div>
            <h3>Necesitas una corrida activa</h3>
            <p>Completa el Paso 2 para generar la seleccion estructural.</p>
          </div>
        </div>
        <div className={styles.footer}>
          <div className={styles.footerActions}>
            <button className={styles.backButton} onClick={onBack}>Volver</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.headerIntro}>
          <h2 className={styles.title}>Evaluacion 4D de controles</h2>
          <p className={styles.subtitle}>Califica existencia, diseño, formalización y operación por control.</p>
        </div>
        <div className={styles.headerMeta}>
          <span className={styles.metaPill}>Total controles: {controls.length}</span>
          <span className={styles.metaPillMuted}>{evaluatedCount}/{controls.length}</span>
        </div>
      </div>

      <div className={styles.controlStrip}>
        {loading && <div className={styles.empty}>Cargando controles...</div>}
        {!loading && filteredControls.length === 0 && (
          <div className={styles.empty}>No hay controles seleccionados.</div>
        )}
        {!loading && activeControl && (() => {
          const evaluation = evalMap.get(activeControl.id);
          const hasStatus = evaluation && Object.values(evaluation.dimensions || {}).some((v) => v);
          const currentIndex = filteredControls.findIndex((c) => c.id === activeControl.id);
          const prev = currentIndex > 0 ? filteredControls[currentIndex - 1] : null;
          const next = currentIndex >= 0 && currentIndex < filteredControls.length - 1 ? filteredControls[currentIndex + 1] : null;
          return (
            <div className={styles.controlStripCard}>
              <div className={styles.controlCardHeader}>
                {hasStatus && <span className={styles.statusDot} />}
              </div>
              <div className={styles.controlName}>{activeControl.name}</div>
              <div className={styles.controlDesc}>{activeControl.description || 'Sin descripcion registrada.'}</div>
              <div className={styles.controlNavRow}>
                <button
                  type="button"
                  className={styles.controlNavButton}
                  onClick={() => prev && setActiveControlId(prev.id)}
                  disabled={!prev}
                >
                  Control anterior
                </button>
                <div className={styles.controlNavMeta}>
                  Control {currentIndex + 1} de {filteredControls.length}
                </div>
                <button
                  type="button"
                  className={styles.controlNavButtonPrimary}
                  onClick={() => next && setActiveControlId(next.id)}
                  disabled={!next}
                >
                  Control siguiente
                </button>
              </div>
            </div>
          );
        })()}
      </div>

      <section className={styles.content}>
          {!activeControl && (
            <div className={styles.emptyState}>
              <AlertTriangle className={styles.emptyIcon} />
              <div>
                <h3>Sin control seleccionado</h3>
                <p>Selecciona un control desde la tarjeta superior para evaluar sus dimensiones.</p>
              </div>
            </div>
          )}

          {activeControl && (
            <div className={styles.detailStack}>
              <div className={styles.cardGrid}>
                {DIMENSIONS.map((dimension) => {
                  const current = evalMap.get(activeControl.id)?.dimensions?.[dimension.key] || '';
                  const dimensionNotes = evalMap.get(activeControl.id)?.dimensionNotes?.[dimension.key] || '';
                  return (
                    <div key={dimension.key} className={styles.subCard}>
                      <div className={styles.subCardTitle}>{dimension.label}</div>
                      <div className={styles.subCardBody}>{dimension.helper}</div>
                      <div className={styles.statusGroup}>
                        <button
                          type="button"
                          className={`${styles.statusButton} ${current === 'cumple' ? styles.statusActive : ''}`}
                          onClick={() => updateDimension(activeControl.id, dimension.key, 'cumple')}
                        >
                          Cumple
                        </button>
                        <button
                          type="button"
                          className={`${styles.statusButton} ${current === 'parcial' ? styles.statusActive : ''}`}
                          onClick={() => updateDimension(activeControl.id, dimension.key, 'parcial')}
                        >
                          Parcial
                        </button>
                        <button
                          type="button"
                          className={`${styles.statusButton} ${current === 'no_cumple' ? styles.statusActive : ''}`}
                          onClick={() => updateDimension(activeControl.id, dimension.key, 'no_cumple')}
                        >
                          No cumple
                        </button>
                      </div>
                      <div className={styles.textBlock}>
                        <div className={styles.textHeaderRow}>
                          <label className={styles.textLabel}>Observacion del auditor</label>
                          <button
                            type="button"
                            className={styles.aiButton}
                            onClick={() => handleRefineDimensionNotes(activeControl, dimension.key, dimensionNotes)}
                            disabled={aiLoading}
                          >
                            {aiLoading ? <span className={styles.aiSpinner} /> : <Sparkles className={styles.aiIcon} />}
                            IA
                          </button>
                        </div>
                        <textarea
                          value={dimensionNotes}
                          onChange={(e) => {
                            const existing = evalMap.get(activeControl.id);
                            const nextNotes = {
                              existencia: existing?.dimensionNotes?.existencia || '',
                              diseno: existing?.dimensionNotes?.diseno || '',
                              formalizacion: existing?.dimensionNotes?.formalizacion || '',
                              operacion: existing?.dimensionNotes?.operacion || '',
                            };
                            nextNotes[dimension.key] = e.target.value;
                            updateEvaluation(activeControl.id, { dimensionNotes: nextNotes });
                          }}
                          placeholder={`Observaciones sobre ${dimension.label.toLowerCase()}...`}
                          className={styles.textarea}
                          rows={3}
                        />
                        <div className={styles.actionRow}>
                          <label className={styles.uploadButton}>
                            <input
                              type="file"
                              className={styles.uploadInput}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                e.currentTarget.value = '';
                                handleUploadEvidence(activeControl, file, dimension.label.toUpperCase());
                              }}
                              disabled={uploading}
                            />
                            <Upload className={styles.actionIcon} />
                            {uploading ? 'Subiendo...' : 'Subir evidencia'}
                          </label>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className={styles.textBlock}>
                <div className={styles.textHeaderRow}>
                  <label className={styles.textLabel}>Observaciones adicionales</label>
                  <button
                    type="button"
                    className={styles.aiButton}
                    onClick={() => handleRefineNotes(activeControl, evalMap.get(activeControl.id)?.notes || '')}
                    disabled={aiLoading}
                  >
                    {aiLoading ? <span className={styles.aiSpinner} /> : <Sparkles className={styles.aiIcon} />}
                    IA
                  </button>
                </div>
                <textarea
                  value={evalMap.get(activeControl.id)?.notes || ''}
                  onChange={(e) => updateEvaluation(activeControl.id, { notes: e.target.value })}
                  placeholder="Notas sobre evidencia, hallazgos o contexto de este control."
                  className={styles.textarea}
                  rows={5}
                />
                <div className={styles.actionRow}>
                  <label className={styles.uploadButton}>
                    <input
                      type="file"
                      className={styles.uploadInput}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        e.currentTarget.value = '';
                        handleUploadEvidence(activeControl, file);
                      }}
                      disabled={uploading}
                    />
                    <Upload className={styles.actionIcon} />
                    {uploading ? 'Subiendo...' : 'Subir evidencia'}
                  </label>
                  <button
                    type="button"
                    className={styles.clearButton}
                    onClick={() => updateEvaluation(activeControl.id, { notes: '' })}
                  >
                    <RotateCcw className={styles.actionIcon} />
                    Limpiar contenido
                  </button>
                </div>
              </div>
            </div>
          )}
      </section>

      <div className={styles.footer}>
        <div className={styles.footerActions}>
          <button className={styles.backButton} onClick={onBack}>Volver</button>
          <button className={styles.ghostButton} onClick={onSave}>Guardar</button>
          <button className={styles.primaryButton} onClick={onNext}>Continuar</button>
        </div>
      </div>
    </div>
  );
}
