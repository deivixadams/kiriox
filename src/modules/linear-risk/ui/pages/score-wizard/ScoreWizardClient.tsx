'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import WizardShell from '@/shared/ui/wizard-shell/WizardShell';
import ScoreScopeStep from './_components/ScoreScopeStep';
import ScoreControl4DStep from './_components/ScoreControl4DStep';
import ScoreSummaryStep from './_components/ScoreSummaryStep';
import ScoreControlResultsStep from './_components/ScoreControlResultsStep';
import ScoreResultStep from './_components/ScoreResultStep';
import styles from './ScoreWizardClient.module.css';
import QuestionResultRenderer from '../../components/QuestionResultRenderer';
import { AnalyticalQuestion, ExecutionResult } from '@/modules/structural-risk/domain/types/AnalyticalQuestion';



const TOTAL_STEPS = 6;

const STEP_TITLES = [
  'Contexto y Marco',
  'Preguntas Clave',
  'Alcance Normativo',
  'Evaluación 4D del Control',
  'Resultado del Score',
  'Análisis de Controles'
];

// STRUCTURAL_QUESTIONS moved to state/API


const ENGINE_PROFILE_BASE = [
  { key: 'w_D', label: 'Diseño', detail: 'Mide cuánto influye el diseño del control (política, estructura, alcance). Si baja, el motor asume controles frágiles desde el origen.' },
  { key: 'w_F', label: 'Formalizacion', detail: 'Pondera la calidad documental y procedimental. Si baja, el score reduce la defensa porque no hay trazabilidad formal sólida.' },
  { key: 'w_O', label: 'Operacion', detail: 'Da peso al funcionamiento real y continuo. Si baja, el motor interpreta que la ejecución práctica es débil aunque existan documentos.' },
  { key: 'w_P', label: 'Pruebas', detail: 'Valor asignado a la verificación mediante pruebas. Si baja, las pruebas influyen menos y el sistema depende más de otros componentes.' },
  { key: 'w_S', label: 'Evidencia', detail: 'Refuerza la evidencia válida y reciente. Si baja, la inspección se vuelve más riesgosa porque la defensa pierde sustento.' },
  { key: 'alpha', label: 'Concentracion', detail: 'Penaliza exposición acumulada cuando los riesgos se concentran en pocos dominios. Mayor alpha significa castigo más fuerte.' },
  { key: 'beta', label: 'Interdependencia', detail: 'Amplifica exposición cuando fallas en un dominio arrastran a otros. Mayor beta aumenta la fragilidad sistémica.' },
  { key: 'gamma', label: 'Curva final', detail: 'Controla la no linealidad del score. Valores altos hacen que pequeños deterioros se amplifiquen en el resultado final.' },
  { key: 'eta', label: 'Mezcla experto/grafo', detail: 'Balancea criterio experto vs estructura del grafo para dependencias. Más eta = más peso experto.' },
];

type SelectionItem = {
  id: string;
  code: string;
  title?: string;
  name?: string;
  score: number;
  rank: number;
  reasons: string[];
};

type SelectionPayload = {
  obligations: SelectionItem[];
  risks: SelectionItem[];
  controls: SelectionItem[];
  tests: SelectionItem[];
};

export default function ScoreWizardClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [selectedQuestionCode, setSelectedQuestionCode] = useState('');
  const [companies, setCompanies] = useState<{ id: string; name: string; code?: string }[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [reinos, setReinos] = useState<{ id: string; name: string; code?: string }[]>([]);
  const [selectedReinoId, setSelectedReinoId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endDateAuto, setEndDateAuto] = useState(true);
  const [contextLoaded, setContextLoaded] = useState(false);
  const [scopeMode, setScopeMode] = useState<'top20' | 'all' | null>(null);
  const [frameworkVersionId, setFrameworkVersionId] = useState('');
  const [selection, setSelection] = useState<SelectionPayload | null>(null);
  const [selectionLoading, setSelectionLoading] = useState(false);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<AnalyticalQuestion[]>([]);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [executionLoading, setExecutionLoading] = useState(false);
  const [executionError, setExecutionError] = useState<string | null>(null);

  const [controlEvaluations, setControlEvaluations] = useState<any[]>([]);
  const [controlStats, setControlStats] = useState<{ total: number; evaluated: number }>({ total: 0, evaluated: 0 });
  const [engineProfile, setEngineProfile] = useState(
    ENGINE_PROFILE_BASE.map((item) => ({ ...item, value: '—' }))
  );
  const autoSelectKeyRef = useRef<string>('');
  const urlHydratedRef = useRef(false);

  useEffect(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setStartDate(`${yyyy}-${mm}-${dd}`);
  }, []);

  useEffect(() => {
    if (urlHydratedRef.current) return;
    const stepFromQuery = Number(searchParams.get('step'));
    const runIdFromQuery = searchParams.get('runId');

    if (Number.isInteger(stepFromQuery) && stepFromQuery >= 1 && stepFromQuery <= TOTAL_STEPS) {
      setStep(stepFromQuery);
    }

    if (runIdFromQuery) {
      setDraftId(runIdFromQuery);
    }

    urlHydratedRef.current = true;
  }, [searchParams]);

  useEffect(() => {
    if (!urlHydratedRef.current) return;

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set('step', String(step));

    if (draftId) {
      nextParams.set('runId', draftId);
    } else {
      nextParams.delete('runId');
    }

    const targetQuery = nextParams.toString();
    const currentQuery = searchParams.toString();

    if (targetQuery === currentQuery) return;

    router.replace(`/score/score?${targetQuery}`, { scroll: false });
  }, [draftId, router, searchParams, step]);

  useEffect(() => {
    if (!startDate) return;
    if (!endDateAuto) return;
    const [y, m, d] = startDate.split('-').map(Number);
    if (!y || !m || !d) return;
    const base = new Date(y, m - 1, d);
    base.setDate(base.getDate() + 10);
    const yyyy = base.getFullYear();
    const mm = String(base.getMonth() + 1).padStart(2, '0');
    const dd = String(base.getDate()).padStart(2, '0');
    setEndDate(`${yyyy}-${mm}-${dd}`);
  }, [startDate, endDateAuto]);

  // Fetch Questions for Step 2
  useEffect(() => {
    if (step !== 2) return;
    const loadQuestions = async () => {
      try {
        const res = await fetch('/api/score/questions');
        if (!res.ok) return;
        const data = await res.json();
        setQuestions(data.questions || []);
      } catch (err) {
        console.error('Error loading questions:', err);
      }
    };
    loadQuestions();
  }, [step]);

  // Execute Question when selected
  useEffect(() => {
    if (step !== 2 || !selectedQuestionCode) {
      setExecutionResult(null);
      return;
    }
    const q = questions.find(q => q.code === selectedQuestionCode);
    if (!q) return;

    const execute = async () => {
      setExecutionLoading(true);
      setExecutionError(null);
      try {
        const res = await fetch('/api/score/questions/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: q.code,
            context: {
              companyId: selectedCompanyId,
              frameworkVersionId: frameworkVersionId || null,
              reinoId: selectedReinoId || null,
              periodStart: startDate || null,
              periodEnd: endDate || null,
            },
            debug: true
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error ejecutando pregunta');
        setExecutionResult(data.result);
      } catch (err: any) {
        setExecutionError(err.message);
      } finally {
        setExecutionLoading(false);
      }
    };
    execute();
  }, [selectedQuestionCode, questions, step, selectedCompanyId, frameworkVersionId, selectedReinoId, startDate, endDate]);

  useEffect(() => {
    let alive = true;
      const loadContext = async () => {
        try {
          const res = await fetch('/api/superintendence/context?minimal=1');
          if (!res.ok) return;
          const data = await res.json();
        if (!alive) return;
        const list = Array.isArray(data?.companies) ? data.companies : [];
        setCompanies(list);
        if (!selectedCompanyId && list.length > 0) {
          setSelectedCompanyId(list[0].id);
        }
        const reinoList = Array.isArray(data?.reinos) ? data.reinos : [];
        setReinos(reinoList);
        if (!selectedReinoId && reinoList.length > 0) {
          setSelectedReinoId(reinoList[0].id);
        }
          setContextLoaded(true);
        } catch {
          if (alive) setContextLoaded(true);
        }
      };
      loadContext();
      return () => {
        alive = false;
      };
    }, [selectedCompanyId]);

  useEffect(() => {
    setEngineProfile(ENGINE_PROFILE_BASE.map((item) => ({ ...item, value: '—' })));
  }, []);

  useEffect(() => {
    return;
  }, [selectedCompanyId]);

  const headerItems = useMemo(() => {
    if (step !== 4) return [];
    const total = controlStats.total;
    const evaluated = controlStats.evaluated;
    return [
      { label: 'Total controles', value: String(total) },
      { label: 'Evaluados', value: `${evaluated}/${total}` },
    ];
  }, [step, controlStats]);

  const title = STEP_TITLES[step - 1] || 'Wizard';
  const subtitle = step === 3
    ? 'Selecciona el universo crítico que entra al score.'
    : 'Evaluación y Resultados';

  const handleSelection = async (mode: 'top20' | 'all') => {
    if (!selectedCompanyId || !startDate || !endDate) {
      setSelectionError('Completa empresa y periodo antes de seleccionar.');
      return;
    }
    if (reinos.length > 0 && !selectedReinoId) {
      setSelectionError('Selecciona un reino antes de continuar.');
      return;
    }
    setSelectionLoading(true);
    setSelectionError(null);
    try {
        const res = await fetch('/api/score/selector', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyId: selectedCompanyId,
            frameworkVersionId: frameworkVersionId || null,
            periodStart: startDate,
            periodEnd: endDate,
            mode,
            draftId,
            reinoId: selectedReinoId || null,
          }),
        });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'No se pudo generar la seleccion');
      }
      setSelection(data.selection || null);
      setDraftId(data.draftId || null);
      setScopeMode(mode);
    } catch (err: any) {
      setSelectionError(err?.message || 'No se pudo generar la seleccion');
    } finally {
      setSelectionLoading(false);
    }
  };

    useEffect(() => {
      if (step !== 3) return;
      if (selection || selectionLoading) return;
      if (!selectedCompanyId || !startDate || !endDate) return;
      if (reinos.length > 0 && !selectedReinoId) return;
      const key = `${selectedCompanyId}:${startDate}:${endDate}:${selectedReinoId || 'all'}`;
      if (autoSelectKeyRef.current === key) return;
      autoSelectKeyRef.current = key;
      handleSelection('top20');
  }, [step, selection, selectionLoading, selectedCompanyId, startDate, endDate, selectedReinoId, reinos.length]);

  return (
    <div className={styles.shellWrapper}>
      <WizardShell
        title={title}
        subtitle={subtitle}
        step={step}
        totalSteps={TOTAL_STEPS}
        headerItems={headerItems}
        onClose={step === 2 ? () => router.push('/score/dashboard') : undefined}
        centerContent={
          controlStats.evaluated < controlStats.total && (
            <div className={styles.incompleteBannerSmall}>
              <div className={styles.incompleteBannerTitle}>EVALUACIÓN INCOMPLETA</div>
              <div className={styles.incompleteBannerSub}>Score parcial basado en {controlStats.evaluated} de {controlStats.total} controles.</div>
            </div>
          )
        }
      >
        {step === 2 ? (
          <div className={styles.root}>
            <div className={styles.card}>
              <div className={styles.field}>
                <span className={styles.label}>Pregunta Analítica</span>
                <div className={styles.questionsLayout}>
                  <div className={styles.questionsGrid}>
                    {questions.map((q) => (
                      <button
                        key={q.code}
                        type="button"
                        className={`${styles.questionCard} ${q.code === selectedQuestionCode ? styles.questionCardActive : ''}`}
                        onClick={() => setSelectedQuestionCode(q.code)}
                      >
                        <div
                          className={styles.questionTitle}
                          data-tooltip={q.business_meaning || q.description || q.objective || ''}
                        >
                          {q.question}
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className={styles.answerPanel}>
                    <div className={styles.answerTitle}>Respuesta</div>
                    {!selectedQuestionCode && (
                      <div className={styles.emptyState}>Selecciona una pregunta para ver la respuesta.</div>
                    )}
                    {selectedQuestionCode && (
                      <div className={styles.resultBlock}>
                        {executionLoading && (
                          <div className={styles.emptyState}>Analizando respuesta...</div>
                        )}
                        {!executionLoading && executionError && (
                          <div className={styles.emptyState}>{executionError}</div>
                        )}
                        {!executionLoading && !executionError && (
                          <div className={styles.emptyState}>
                            {(() => {
                              const rows = executionResult?.data || [];
                              if (!rows.length) {
                                return 'No se encontraron resultados para esta pregunta.';
                              }
                              const limitedRows = rows.slice(0, 4);
                              const firstRow = limitedRows[0];
                              if (typeof firstRow === 'object' && firstRow !== null && !Array.isArray(firstRow)) {
                                const columns = Object.keys(firstRow);
                                return (
                                  <div className={styles.answerTableWrap}>
                                    <table className={styles.answerTable}>
                                      <thead>
                                        <tr>
                                          {columns.map((col) => (
                                            <th key={col}>{col.replaceAll('_', ' ').toUpperCase()}</th>
                                          ))}
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {limitedRows.map((row, idx) => (
                                          <tr key={idx}>
                                            {columns.map((col) => (
                                              <td key={col}>{row?.[col] != null ? String(row[col]) : ''}</td>
                                            ))}
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                    {rows.length > 4 && (
                                      <div className={styles.answerLimitNote}>
                                        Mostrando 4 de {rows.length} resultados.
                                      </div>
                                    )}
                                  </div>
                                );
                              }
                              return (
                                <div className={styles.answerList}>
                                  {limitedRows.map((row, idx) => (
                                    <div key={idx} className={styles.answerItem}>
                                      {typeof row === 'string' ? row : JSON.stringify(row)}
                                    </div>
                                  ))}
                                  {rows.length > 4 && (
                                    <div className={styles.answerLimitNote}>
                                      Mostrando 4 de {rows.length} resultados.
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.footer}>
              <div className={styles.footerActions}>
                <button className={styles.backButton} onClick={() => setStep((s) => Math.max(1, s - 1))}>Volver</button>
                <button className={styles.ghostButton} onClick={() => {}}>Guardar</button>
                <button
                  className={styles.primaryButton}
                  onClick={() => setStep((s) => Math.min(TOTAL_STEPS, s + 1))}
                >
                  Continuar
                </button>
              </div>
            </div>
          </div>
        ) : step === 3 ? (
          <ScoreScopeStep
            selection={selection}
            selectionLoading={selectionLoading}
            selectionError={selectionError}
            scopeMode={scopeMode}
            onSelectTop20={() => handleSelection('top20')}
            onSelectAll={() => handleSelection('all')}
            onBack={() => setStep((s) => Math.max(1, s - 1))}
            onNext={() => setStep((s) => Math.min(TOTAL_STEPS, s + 1))}
            onSave={() => {}}
          />
        ) : (
          <div className={styles.root}>
            {step === 1 && (
              <>
                <div className={styles.header}>
                  <h2 className={styles.title}>Contexto y Marco</h2>
                  <p className={styles.subtitle}>Define el universo normativo y la ventana de evaluación.</p>
                </div>
                <div className={styles.grid}>
                  <div className={styles.card}>
                    <div className={styles.field}>
                      <span
                        className={`${styles.label} ${styles.labelClickable}`}
                        onDoubleClick={() => router.push('/admin/empresa/nuevo?return_to=/score/score')}
                        title="Doble clic para crear empresa"
                      >
                        Empresa
                      </span>
                      <select
                        className={styles.input}
                        value={selectedCompanyId}
                        onChange={(e) => setSelectedCompanyId(e.target.value)}
                        disabled={!contextLoaded}
                      >
                        <option value="">{contextLoaded ? 'Seleccione empresa' : 'Cargando...'}</option>
                        {companies.map((company) => (
                          <option key={company.id} value={company.id}>{company.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.field}>
                      <span className={styles.label}>Reino</span>
                      <select
                        className={styles.input}
                        value={selectedReinoId}
                        onChange={(e) => setSelectedReinoId(e.target.value)}
                        disabled={!contextLoaded}
                      >
                        <option value="">{contextLoaded ? 'Seleccione reino' : 'Cargando...'}</option>
                        {reinos.map((reino) => (
                          <option key={reino.id} value={reino.id}>
                            {reino.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className={styles.card}>
                    <div className={styles.field}>
                      <span className={styles.label}>Periodo inicio</span>
                      <input
                        type="date"
                        className={styles.input}
                        value={startDate}
                        onChange={(e) => {
                          setStartDate(e.target.value);
                          setEndDateAuto(true);
                        }}
                        onClick={(e) => (e.currentTarget as HTMLInputElement).showPicker?.()}
                      />
                    </div>
                    <div className={styles.field}>
                      <span className={styles.label}>Periodo fin</span>
                      <input
                        type="date"
                        className={styles.input}
                        value={endDate}
                        onChange={(e) => {
                          setEndDate(e.target.value);
                          setEndDateAuto(false);
                        }}
                        onClick={(e) => (e.currentTarget as HTMLInputElement).showPicker?.()}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {step === 4 && (
              <ScoreControl4DStep
                runId={draftId}
                evaluations={controlEvaluations}
                onChange={setControlEvaluations}
                onStatsChange={setControlStats}
                onBack={() => setStep((s) => Math.max(1, s - 1))}
                onNext={() => setStep((s) => Math.min(TOTAL_STEPS, s + 1))}
                onSave={() => {}}
              />
            )}

            {step === 5 && (
              <ScoreSummaryStep
                runId={draftId}
                onBack={() => setStep(4)}
                onNext={() => setStep(6)}
              />
            )}

            {step === 6 && (
              <ScoreControlResultsStep
                runId={draftId}
                onBack={() => setStep(5)}
                onNext={() => {}}
              />
            )}

            {step <= 1 && (
              <div className={styles.footer}>
                <div className={styles.footerActions}>
                  <button className={styles.backButton} onClick={() => setStep((s) => Math.max(1, s - 1))}>Volver</button>
                  <button className={styles.ghostButton} onClick={() => {}}>Guardar</button>
                  <button
                    className={styles.primaryButton}
                    onClick={() => setStep((s) => Math.min(TOTAL_STEPS, s + 1))}
                    disabled={step === TOTAL_STEPS}
                  >
                    Continuar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </WizardShell>
    </div>
  );
}
