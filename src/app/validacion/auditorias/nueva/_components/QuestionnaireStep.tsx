'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, FileText, Search, XCircle, MinusCircle, Sparkles } from 'lucide-react';
import styles from './QuestionnaireStep.module.css';

type RiskItem = {
  id: string;
  name: string;
  description?: string | null;
  status?: string | null;
  riskTypeName?: string | null;
  riskLayerName?: string | null;
};

type ControlItem = {
  id: string;
  name: string;
  description?: string | null;
};

type ControlEvaluation = {
  riskId: string;
  controlId: string;
  status: 'cumple' | 'parcial' | 'no_cumple' | '';
  notes: string;
  howToEvaluate?: string;
  evidence?: string[];
};

type QuestionnaireStepProps = {
  riskIds: string[];
  evaluations: ControlEvaluation[];
  onChange: (next: ControlEvaluation[]) => void;
  onBack: () => void;
  onNext: () => void;
  onSave: () => void;
};

export default function QuestionnaireStep({ riskIds, evaluations, onChange, onBack, onNext, onSave }: QuestionnaireStepProps) {
  const [risks, setRisks] = useState<RiskItem[]>([]);
  const [controlsByRisk, setControlsByRisk] = useState<Record<string, ControlItem[]>>({});
  const [loading, setLoading] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [aiLoadingKey, setAiLoadingKey] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [activeRiskId, setActiveRiskId] = useState<string | null>(null);
  const [sequenceIndex, setSequenceIndex] = useState(0);

  useEffect(() => {
    if (riskIds.length === 0) {
      setRisks([]);
      setActiveRiskId(null);
      return;
    }
    const loadRisks = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/audit/catalog/risks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ riskIds })
        });
        if (!res.ok) {
          setRisks([]);
          return;
        }
        const data = await res.json();
        const normalized = Array.isArray(data) ? data : [];
        setRisks(normalized);
        setActiveRiskId((prev) => (prev && normalized.some((r) => r.id === prev) ? prev : normalized[0]?.id || null));
      } finally {
        setLoading(false);
      }
    };
    loadRisks();
  }, [riskIds]);

  useEffect(() => {
    if (riskIds.length === 0) {
      setControlsByRisk({});
      return;
    }
    const loadControls = async () => {
      const res = await fetch('/api/audit/catalog/controls-by-risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ riskIds })
      });
      if (!res.ok) {
        setControlsByRisk({});
        return;
      }
      const data = await res.json();
      setControlsByRisk(data?.byRisk || {});
    };
    loadControls();
  }, [riskIds]);

  useEffect(() => {
    if (evaluations.length === 0) return;
    const allowed = new Set(riskIds);
    const filtered = evaluations.filter((e) => allowed.has(e.riskId));
    if (filtered.length !== evaluations.length) {
      onChange(filtered);
    }
  }, [evaluations, riskIds, onChange]);

  const filteredRisks = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return risks;
    return risks.filter((risk) => (risk.name || '').toLowerCase().includes(term));
  }, [risks, query]);

  const activeRisk = useMemo(
    () => risks.find((risk) => risk.id === activeRiskId) || null,
    [risks, activeRiskId]
  );

  const evalMap = useMemo(() => {
    const map = new Map<string, ControlEvaluation>();
    evaluations.forEach((ev) => map.set(`${ev.riskId}::${ev.controlId}`, ev));
    return map;
  }, [evaluations]);

  const controlSequence = useMemo(() => {
    return riskIds.flatMap((riskId) => (controlsByRisk[riskId] || []).map((control) => ({ riskId, control })));
  }, [controlsByRisk, riskIds]);

  const scoreSnapshot = useMemo(() => {
    const weights: Record<ControlEvaluation['status'], number> = {
      cumple: 1,
      parcial: 0.5,
      no_cumple: 0,
      '': 0
    };
    let weightedSum = 0;
    let completedControls = 0;
    controlSequence.forEach(({ riskId, control }) => {
      const status = evalMap.get(`${riskId}::${control.id}`)?.status || '';
      if (status) completedControls += 1;
      weightedSum += weights[status];
    });
    const totalControls = controlSequence.length;
    const score = totalControls > 0 ? weightedSum / totalControls : 0;
    return {
      score,
      percent: Math.round(score * 100),
      totalControls,
      weightedSum,
      completedControls
    };
  }, [controlSequence, evalMap]);

  const maxScore = scoreSnapshot.totalControls;
  const currentScore = scoreSnapshot.weightedSum;
  const maxPercent = scoreSnapshot.totalControls > 0 ? 100 : 0;
  const formatScore = (value: number) => (Number.isInteger(value) ? value.toString() : value.toFixed(1));

  const updateEvaluation = (riskId: string, controlId: string, patch: Partial<ControlEvaluation>) => {
    const key = `${riskId}::${controlId}`;
    const existing = evalMap.get(key);
    const nextItem: ControlEvaluation = {
      riskId,
      controlId,
      status: existing?.status || '',
      notes: existing?.notes || '',
      howToEvaluate: existing?.howToEvaluate || '',
      evidence: existing?.evidence || [],
      ...patch
    };
    const next = evaluations.filter((ev) => !(ev.riskId === riskId && ev.controlId === controlId));
    next.push(nextItem);
    onChange(next);
  };

  const completedCount = scoreSnapshot.completedControls;
  const scoreSegments = useMemo(() => Array.from({ length: 12 }, (_, index) => index), []);
  const evaluatedRisksCount = useMemo(() => {
    const set = new Set<string>();
    evaluations.forEach((ev) => {
      if (ev.status) set.add(ev.riskId);
    });
    return set.size;
  }, [evaluations]);

  useEffect(() => {
    if (controlSequence.length === 0) {
      setSequenceIndex(0);
      return;
    }
    if (sequenceIndex >= controlSequence.length) {
      setSequenceIndex(0);
    }
  }, [controlSequence.length, sequenceIndex]);

  useEffect(() => {
    if (controlSequence.length === 0) return;
    const current = controlSequence[sequenceIndex];
    if (current && current.riskId !== activeRiskId) {
      setActiveRiskId(current.riskId);
    }
  }, [activeRiskId, controlSequence, sequenceIndex]);

  const jumpToRisk = (riskId: string) => {
    setActiveRiskId(riskId);
    const index = controlSequence.findIndex((item) => item.riskId === riskId);
    if (index >= 0) setSequenceIndex(index);
  };

  const goToIndex = (index: number) => {
    if (index < 0 || index >= controlSequence.length) return;
    const next = controlSequence[index];
    setSequenceIndex(index);
    setActiveRiskId(next.riskId);
  };

  const handleUploadEvidence = async (riskId: string, controlId: string, file: File) => {
    const key = `${riskId}::${controlId}`;
    setUploadingKey(key);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('riskId', riskId);
      formData.append('controlId', controlId);
      const res = await fetch('/api/audit/evidence', {
        method: 'POST',
        body: formData
      });
      if (!res.ok) return;
      const data = await res.json();
      if (!data?.filename) return;
      const existing = evalMap.get(key);
      const evidence = existing?.evidence ? [...existing.evidence, data.filename] : [data.filename];
      updateEvaluation(riskId, controlId, { evidence });
    } finally {
      setUploadingKey(null);
    }
  };

  const handleGenerateHowTo = async (riskId: string, control: ControlItem) => {
    const key = `${riskId}::${control.id}`;
    setAiLoadingKey(key);
    try {
      const res = await fetch('/api/ai/control-evaluation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          controlName: control.name,
          controlDescription: control.description || ''
        })
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data?.text) {
        updateEvaluation(riskId, control.id, { howToEvaluate: data.text });
      }
    } finally {
      setAiLoadingKey(null);
    }
  };

  const activePair = controlSequence[sequenceIndex] || null;
  const activeControl = activePair?.control || null;
  const activeKey = activePair && activeControl ? `${activePair.riskId}::${activeControl.id}` : null;
  const activeEvaluation = activeKey ? evalMap.get(activeKey) : undefined;
  const controlPosition = controlSequence.length > 0 ? sequenceIndex + 1 : 0;
  const uploadKey = activeKey || '';
  const listMaxHeight = useMemo(() => {
    if (filteredRisks.length === 0) return 140;
    const estimatedRow = 60;
    const estimated = filteredRisks.length * estimatedRow + 12;
    return Math.min(520, Math.max(220, estimated));
  }, [filteredRisks.length]);

  return (
    <div className={styles.root}>
      <div className={styles.shell}>
        <div className={styles.leftColumn}>
          <aside className={styles.sidebar}>
            <div className={styles.searchBox}>
              <Search className={styles.searchIcon} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar riesgo..."
                className={styles.searchInput}
              />
            </div>
            <div className={styles.sidebarList} style={{ maxHeight: listMaxHeight }}>
              {loading && <div className={styles.empty}>Cargando riesgos...</div>}
              {!loading && filteredRisks.length === 0 && (
                <div className={styles.empty}>No hay riesgos seleccionados.</div>
              )}
              {filteredRisks.map((risk) => {
                const riskEvaluations = evaluations.filter((ev) => ev.riskId === risk.id);
                const active = risk.id === activeRiskId;
                return (
                  <button
                    key={risk.id}
                    type="button"
                    className={`${styles.riskItem} ${active ? styles.riskItemActive : ''}`}
                    onClick={() => jumpToRisk(risk.id)}
                  >
                    <div className={styles.riskTitleRow}>
                      <span className={styles.riskName}>{risk.name}</span>
                      {riskEvaluations.some((ev) => ev.status) && (
                        <span className={styles.statusDot} />
                      )}
                    </div>
                    <div className={styles.riskMeta}>
                      <span>{risk.riskLayerName || 'Sin capa'}</span>
                      <span className={styles.riskMetaDivider} />
                      <span>{risk.riskTypeName || 'Sin tipo'}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>
        </div>

        <section className={styles.content}>
          {!activeRisk && (
            <div className={styles.emptyState}>
              <AlertTriangle className={styles.emptyIcon} />
              <div>
                <h3>Sin riesgo seleccionado</h3>
                <p>Selecciona un riesgo del panel izquierdo para comenzar la evaluacion.</p>
              </div>
            </div>
          )}

          {activeRisk && (
            <div className={styles.detailStack}>
              <div className={styles.detailTopRow}>
                <div className={styles.detailCard}>
                  <div className={styles.detailHeader}>
                    <div className={styles.detailLabel}>
                      <FileText className={styles.detailIcon} />
                      Detalle del item
                    </div>
                  </div>
                  <h3 className={styles.detailTitle}>{activeRisk.name}</h3>
                  <p className={styles.detailText}>
                    {activeRisk.description || 'No hay descripcion para este riesgo.'}
                  </p>
                </div>
                <div className={styles.scorePanel}>
                  <div className={styles.scoreLabel}>Nivel de cumplimiento</div>
                  <div className={styles.scoreValue}>
                    {scoreSnapshot.percent}% <span className={styles.scoreSuffix}>de {maxPercent}%</span>
                  </div>
                  <div className={styles.scoreBar}>
                    {scoreSegments.map((segment) => {
                      const filled = scoreSnapshot.percent >= Math.round(((segment + 1) / scoreSegments.length) * 100);
                      return <span key={segment} className={`${styles.scoreDash} ${filled ? styles.scoreDashActive : ''}`} />;
                    })}
                  </div>
                  <div className={styles.scoreMeta}>
                    <span>{riskIds.length} riesgos</span>
                    <span className={styles.scoreDivider} />
                    <span>{scoreSnapshot.totalControls} controles</span>
                    <span className={styles.scoreDivider} />
                    <span>{completedCount} controles evaluados</span>
                    <span className={styles.scoreDivider} />
                    <span>{evaluatedRisksCount} riesgos evaluados</span>
                  </div>
                </div>
              </div>

              <div className={styles.controlsSection}>
                {!activeControl && (
                  <div className={styles.subCardBody}>Sin controles asociados.</div>
                )}
                {activeControl && (() => {
                  const evaluation = activeEvaluation;
                  return (
                    <div className={styles.controlCard}>
                      <div className={styles.controlHeader}>
                        <div>
                          <div className={styles.controlLabel}>Control {controlPosition} de {controlSequence.length}</div>
                          <div className={styles.controlTitle}>{activeControl.name}</div>
                          <div className={styles.controlDescription}>
                            {activeControl.description || 'Sin descripcion registrada.'}
                          </div>
                        </div>
                      </div>
                      <div className={styles.statusGroup}>
                        <button
                          type="button"
                          className={`${styles.statusButton} ${evaluation?.status === 'cumple' ? styles.statusActive : ''}`}
                          onClick={() => updateEvaluation(activePair!.riskId, activeControl.id, { status: evaluation?.status === 'cumple' ? '' : 'cumple' })}
                        >
                          <CheckCircle2 className={styles.statusIcon} /> Cumple
                        </button>
                        <button
                          type="button"
                          className={`${styles.statusButton} ${evaluation?.status === 'parcial' ? styles.statusActive : ''}`}
                          onClick={() => updateEvaluation(activePair!.riskId, activeControl.id, { status: evaluation?.status === 'parcial' ? '' : 'parcial' })}
                        >
                          <MinusCircle className={styles.statusIcon} /> Parcial
                        </button>
                        <button
                          type="button"
                          className={`${styles.statusButton} ${evaluation?.status === 'no_cumple' ? styles.statusActive : ''}`}
                          onClick={() => updateEvaluation(activePair!.riskId, activeControl.id, { status: evaluation?.status === 'no_cumple' ? '' : 'no_cumple' })}
                        >
                          <XCircle className={styles.statusIcon} /> No cumple
                        </button>
                      </div>
                      <div className={styles.textBlock}>
                        <label className={styles.textLabel}>Observaciones y hallazgos</label>
                        <textarea
                          value={evaluation?.notes || ''}
                          onChange={(e) => updateEvaluation(activePair!.riskId, activeControl.id, { notes: e.target.value })}
                          placeholder="Describe evidencias, pruebas y hallazgos relevantes..."
                          className={styles.textarea}
                          rows={5}
                        />
                      </div>
                      <div className={styles.uploadRow}>
                        <label className={styles.uploadButton}>
                          <input
                            type="file"
                            className={styles.uploadInput}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              e.currentTarget.value = '';
                              handleUploadEvidence(activePair!.riskId, activeControl.id, file);
                            }}
                            disabled={uploadingKey === uploadKey}
                          />
                          {uploadingKey === uploadKey ? 'Subiendo...' : 'Subir evidencia'}
                        </label>
                        <div className={styles.fileList}>
                          {(evaluation?.evidence || []).map((file) => (
                            <span key={file} className={styles.fileTag}>{file}</span>
                          ))}
                        </div>
                      </div>
                      <div className={styles.controlNav}>
                        <button
                          type="button"
                          className={styles.controlNavButton}
                          onClick={() => goToIndex(sequenceIndex - 1)}
                          disabled={sequenceIndex === 0}
                        >
                          Anterior
                        </button>
                        <div className={styles.controlNavMeta}>
                          Control {controlPosition} de {controlSequence.length}
                        </div>
                        <button
                          type="button"
                          className={styles.controlNavButtonPrimary}
                          onClick={() => goToIndex(sequenceIndex + 1)}
                          disabled={sequenceIndex >= controlSequence.length - 1}
                        >
                          Siguiente
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {activeControl && (
                <div className={styles.howToCard}>
                  <div className={styles.howToHeader}>
                    <div className={styles.howToTitle}>Como evaluar</div>
                    <button
                      type="button"
                      className={styles.aiButton}
                      onClick={() => handleGenerateHowTo(activePair!.riskId, activeControl)}
                      disabled={aiLoadingKey === activeKey}
                    >
                      {aiLoadingKey === activeKey ? (
                        <span className={styles.aiSpinner} />
                      ) : (
                        <Sparkles className={styles.aiIcon} />
                      )}
                      IA
                    </button>
                  </div>
                  <textarea
                    value={activeEvaluation?.howToEvaluate || ''}
                    onChange={(e) => updateEvaluation(activePair!.riskId, activeControl.id, { howToEvaluate: e.target.value })}
                    placeholder="Describe como evaluar este control..."
                    className={styles.howToTextarea}
                    rows={3}
                  />
                </div>
              )}

            </div>
          )}
        </section>
      </div>

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
