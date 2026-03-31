'use client';

import React, { useEffect, useMemo, useState } from 'react';
import styles from '../ScoreWizardClient.module.css';

type DimensionModel = {
  dimension: string;
  weight: number;
  is_gate: boolean;
  min_dimension_score: number | null;
  evidence_required: boolean;
  evidence_min_spec?: string | null;
};

type TestRow = {
  control_id: string;
  dimension: string;
  test_id: string;
  test_code: string;
  test_title: string;
  test_weight: number;
  is_key: boolean;
  evidence_type: string | null;
  evidence_name: string | null;
  required: boolean;
  min_quantity: number | null;
  window_days: number | null;
};

type TestResult = {
  run_id: string;
  control_id: string;
  dimension: string;
  test_id: string;
  score: number | null;
  passed: boolean | null;
  assessment_method: string | null;
  evaluator_notes: string | null;
  reasons: any;
};

type EvidenceRow = {
  id: string;
  run_id: string;
  control_id: string;
  dimension: string;
  test_id: string;
  file_name_original: string;
  object_key: string;
  uploaded_at: string;
};

type Props = {
  runId: string | null;
  controlId: string | null;
  onBack: () => void;
  onNext: () => void;
};

export default function ScoreControlEvaluationStep({ runId, controlId, onBack, onNext }: Props) {
  const [control, setControl] = useState<any>(null);
  const [dimensionModel, setDimensionModel] = useState<DimensionModel[]>([]);
  const [tests, setTests] = useState<TestRow[]>([]);
  const [results, setResults] = useState<TestResult[]>([]);
  const [evidence, setEvidence] = useState<EvidenceRow[]>([]);
  const [activeDimension, setActiveDimension] = useState<string>('EXISTENCE');
  const [savingMap, setSavingMap] = useState<Record<string, 'idle' | 'saving' | 'saved' | 'error'>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!runId || !controlId) return;
    let alive = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/score/runs/${runId}/controls/${controlId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'No se pudo cargar control');
        if (!alive) return;
        setControl(data.control);
        setDimensionModel(data.dimensionModel || []);
        setTests(data.tests || []);
        setResults(data.results || []);
        setEvidence(data.evidence || []);
        if (data.dimensionModel?.length) {
          setActiveDimension(data.dimensionModel[0].dimension);
        }
      } catch (err: any) {
        if (alive) setError(err?.message || 'No se pudo cargar control');
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => {
      alive = false;
    };
  }, [runId, controlId]);

  const resultByKey = useMemo(() => {
    const map = new Map<string, TestResult>();
    results.forEach((r) => map.set(`${r.dimension}:${r.test_id}`, r));
    return map;
  }, [results]);

  const evidenceByTest = useMemo(() => {
    const map = new Map<string, EvidenceRow[]>();
    evidence.forEach((e) => {
      const key = `${e.dimension}:${e.test_id}`;
      const list = map.get(key) || [];
      list.push(e);
      map.set(key, list);
    });
    return map;
  }, [evidence]);

  const testsByDimension = useMemo(() => {
    return tests.filter((t) => t.dimension === activeDimension);
  }, [tests, activeDimension]);

  const saveTestResult = async (payload: Partial<TestResult> & { dimension: string; test_id: string }) => {
    if (!runId || !controlId) return;
    const key = `${payload.dimension}:${payload.test_id}`;
    setSavingMap((prev) => ({ ...prev, [key]: 'saving' }));
    try {
      const res = await fetch('/api/score/test-result', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          run_id: runId,
          control_id: controlId,
          dimension: payload.dimension,
          test_id: payload.test_id,
          score: payload.score ?? null,
          passed: payload.passed ?? null,
          assessment_method: 'manual',
          evaluator_notes: payload.evaluator_notes ?? null,
          reasons: payload.reasons ?? null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'No se pudo guardar');

      setResults((prev) => {
        const next = prev.filter((r) => !(r.dimension === payload.dimension && r.test_id === payload.test_id));
        next.push({
          run_id: runId,
          control_id: controlId,
          dimension: payload.dimension,
          test_id: payload.test_id,
          score: payload.score ?? null,
          passed: payload.passed ?? null,
          assessment_method: 'manual',
          evaluator_notes: payload.evaluator_notes ?? null,
          reasons: payload.reasons ?? null,
        });
        return next;
      });
      setSavingMap((prev) => ({ ...prev, [key]: 'saved' }));
      setTimeout(() => {
        setSavingMap((prev) => ({ ...prev, [key]: 'idle' }));
      }, 1200);
    } catch {
      setSavingMap((prev) => ({ ...prev, [key]: 'error' }));
    }
  };

  const uploadEvidence = async (file: File, dimension: string, testId: string) => {
    if (!runId || !controlId) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('run_id', runId);
    formData.append('control_id', controlId);
    formData.append('dimension', dimension);
    formData.append('test_id', testId);
    const res = await fetch('/api/score/evidence/upload', { method: 'POST', body: formData });
    const data = await res.json();
    if (res.ok && data?.evidence) {
      setEvidence((prev) => [data.evidence, ...prev]);
    }
  };

  if (!runId || !controlId) {
    return (
      <div className={styles.root}>
        <div className={styles.card}>
          <div className={styles.cardTitle}>Selecciona un control</div>
          <div className={styles.cardSubtitle}>Regresa al paso anterior para elegir un control.</div>
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
        <h2 className={styles.title}>Evaluacion del control</h2>
        <p className={styles.subtitle}>Valida evidencia y califica tests por dimension.</p>
      </div>

      {loading && <div className={styles.helperText}>Cargando control...</div>}
      {error && <div className={styles.helperText}>{error}</div>}

      {control && (
        <div className={styles.card}>
          <div className={styles.cardTitle}>{control.code} · {control.name}</div>
          <div className={styles.cardSubtitle}>{control.control_objective || control.description || '—'}</div>
          <div className={styles.metaRow}>
            <span className={styles.pill}>Owner: {control.owner_role || '—'}</span>
            <span className={styles.pill}>Evidencia requerida: {control.evidence_required ? 'Si' : 'No'}</span>
          </div>
        </div>
      )}

      <div className={styles.tabRow}>
        {dimensionModel.map((dim) => (
          <button
            key={dim.dimension}
            className={dim.dimension === activeDimension ? styles.tabActive : styles.tab}
            onClick={() => setActiveDimension(dim.dimension)}
          >
            {dim.dimension}
          </button>
        ))}
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead className={styles.thead}>
            <tr>
              <th className={styles.th}>Test</th>
              <th className={styles.th}>Peso</th>
              <th className={styles.th}>Score</th>
              <th className={styles.th}>Pass</th>
              <th className={styles.th}>Notas</th>
              <th className={styles.th}>Evidencia</th>
            </tr>
          </thead>
          <tbody className={styles.tbody}>
            {testsByDimension.length === 0 && (
              <tr className={styles.emptyRow}>
                <td colSpan={6}>No hay tests configurados para esta dimension.</td>
              </tr>
            )}
            {testsByDimension.map((test) => {
              const key = `${test.dimension}:${test.test_id}`;
              const result = resultByKey.get(key);
              const evidenceList = evidenceByTest.get(key) || [];
              const saving = savingMap[key] || 'idle';
              return (
                <tr key={key} className={styles.tr}>
                  <td className={styles.td}>
                    <div className={styles.riskTitle}>{test.test_code}</div>
                    <div className={styles.riskSubtitle}>{test.test_title}</div>
                    <div className={styles.riskMeta}>
                      {test.is_key ? 'Key test' : 'Test'} · {test.required ? 'Evidencia requerida' : 'Evidencia opcional'}
                      {test.window_days ? ` · Ventana ${test.window_days}d` : ''}
                    </div>
                  </td>
                  <td className={styles.tdMuted}>{test.test_weight?.toFixed?.(2) ?? test.test_weight}</td>
                  <td className={styles.td}>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={result?.score ?? 0}
                      onChange={(e) => saveTestResult({ dimension: test.dimension, test_id: test.test_id, score: Number(e.target.value), passed: result?.passed ?? null })}
                    />
                    <input
                      type="number"
                      min={0}
                      max={1}
                      step={0.01}
                      value={result?.score ?? 0}
                      onChange={(e) => saveTestResult({ dimension: test.dimension, test_id: test.test_id, score: Number(e.target.value), passed: result?.passed ?? null })}
                      className={styles.scoreInput}
                    />
                    <div className={styles.saveState}>
                      {saving === 'saving' && 'Guardando...'}
                      {saving === 'saved' && 'Guardado'}
                      {saving === 'error' && 'Error'}
                    </div>
                  </td>
                  <td className={styles.td}>
                    <input
                      type="checkbox"
                      checked={result?.passed ?? false}
                      onChange={(e) => saveTestResult({ dimension: test.dimension, test_id: test.test_id, passed: e.target.checked, score: result?.score ?? 0 })}
                    />
                  </td>
                  <td className={styles.td}>
                    <textarea
                      className={styles.textArea}
                      value={result?.evaluator_notes ?? ''}
                      onChange={(e) => saveTestResult({ dimension: test.dimension, test_id: test.test_id, evaluator_notes: e.target.value, score: result?.score ?? 0, passed: result?.passed ?? null })}
                      placeholder="Notas del evaluador"
                    />
                  </td>
                  <td className={styles.td}>
                    <div className={styles.evidenceList}>
                      {evidenceList.map((ev) => (
                        <div key={ev.id} className={styles.evidenceItem}>{ev.file_name_original}</div>
                      ))}
                    </div>
                    <input
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadEvidence(file, test.dimension, test.test_id);
                      }}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className={styles.footer}>
        <div className={styles.footerActions}>
          <button className={styles.backButton} onClick={onBack}>Volver</button>
          <button className={styles.primaryButton} onClick={onNext}>Continuar</button>
        </div>
      </div>
    </div>
  );
}
