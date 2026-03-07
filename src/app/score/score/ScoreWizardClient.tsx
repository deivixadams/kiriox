
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import WizardShell from '@/app/validacion/auditorias/nueva/_components/WizardShell';
import ScoreScopeStep from './_components/ScoreScopeStep';
import styles from './ScoreWizardClient.module.css';

const TOTAL_STEPS = 7;

const STEP_TITLES = [
  'Contexto y marco',
  'Alcance real',
  'Perfil de ponderacion',
  'Evaluacion 3D',
  'Evidencia / Pruebas',
  'Motor y resultado',
  'Simulacion'
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
  const [step, setStep] = useState(1);
  const [companies, setCompanies] = useState<{ id: string; name: string; code?: string }[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [contextLoaded, setContextLoaded] = useState(false);
  const [scopeMode, setScopeMode] = useState<'top20' | 'all' | null>(null);
  const [jurisdictionName, setJurisdictionName] = useState('');
  const [frameworkName, setFrameworkName] = useState('');
  const [frameworkSourceLabel, setFrameworkSourceLabel] = useState('');
  const [frameworkSourceId, setFrameworkSourceId] = useState('');
  const [selection, setSelection] = useState<SelectionPayload | null>(null);
  const [selectionLoading, setSelectionLoading] = useState(false);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);

  useEffect(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setStartDate(`${yyyy}-${mm}-${dd}`);
  }, []);

  useEffect(() => {
    let alive = true;
    const loadContext = async () => {
      try {
        const res = await fetch('/api/superintendence/context');
        if (!res.ok) return;
        const data = await res.json();
        if (!alive) return;
        const list = Array.isArray(data?.companies) ? data.companies : [];
        setCompanies(list);
        if (!selectedCompanyId && list.length > 0) {
          setSelectedCompanyId(list[0].id);
        }
        const jurisdiction = Array.isArray(data?.jurisdictions) ? data.jurisdictions[0] : null;
        const frameworkSources = Array.isArray(data?.frameworkSources) ? data.frameworkSources : [];
        const frameworks = Array.isArray(data?.frameworks) ? data.frameworks : [];
        const latestSource = frameworkSources[0];
        const framework = frameworks.find((f: any) => f.id === latestSource?.frameworkId);
        if (jurisdiction?.name) setJurisdictionName(jurisdiction.name);
        if (framework?.name) setFrameworkName(framework.name);
        if (latestSource?.citation) setFrameworkSourceLabel(latestSource.citation);
        if (latestSource?.id) setFrameworkSourceId(latestSource.id);
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
    let alive = true;
    const loadCompanyContext = async () => {
      if (!selectedCompanyId) return;
      try {
        const res = await fetch(`/api/superintendence/context?company_id=${selectedCompanyId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!alive) return;
        if (data?.frameworkSourceId) setFrameworkSourceId(data.frameworkSourceId);
      } catch {
        return;
      }
    };
    loadCompanyContext();
    return () => {
      alive = false;
    };
  }, [selectedCompanyId]);

  const headerItems = useMemo(() => ([
    { label: 'Jurisdiccion', value: jurisdictionName || '-' },
    { label: 'Marco', value: frameworkName || '-' },
    { label: 'Fuente', value: frameworkSourceLabel || '-' }
  ]), [jurisdictionName, frameworkName, frameworkSourceLabel]);

  const title = STEP_TITLES[step - 1] || 'Wizard';

  const handleSelection = async (mode: 'top20' | 'all') => {
    if (!selectedCompanyId || !frameworkSourceId || !startDate || !endDate) {
      setSelectionError('Completa empresa y periodo antes de seleccionar.');
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
          frameworkSourceId,
          periodStart: startDate,
          periodEnd: endDate,
          mode,
          draftId,
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

  return (
    <div className={styles.shellWrapper}>
      <WizardShell
        title={title}
        subtitle="Score"
        step={step}
        totalSteps={TOTAL_STEPS}
        headerItems={headerItems}
      >
        {step === 2 ? (
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
                <h2 className={styles.title}>Contexto y marco</h2>
                <p className={styles.subtitle}>Define el universo normativo y la ventana de evaluacion.</p>
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
                </div>
                <div className={styles.card}>
                  <div className={styles.field}>
                    <span className={styles.label}>Periodo inicio</span>
                    <input
                      type="date"
                      className={styles.input}
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      onClick={(e) => (e.currentTarget as HTMLInputElement).showPicker?.()}
                    />
                  </div>
                  <div className={styles.field}>
                    <span className={styles.label}>Periodo fin</span>
                    <input
                      type="date"
                      className={styles.input}
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      onClick={(e) => (e.currentTarget as HTMLInputElement).showPicker?.()}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className={styles.header}>
                <h2 className={styles.title}>Perfil de ponderacion</h2>
                <p className={styles.subtitle}>Aun no hay datos cargados.</p>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <div className={styles.header}>
                <h2 className={styles.title}>Evaluacion 3D</h2>
                <p className={styles.subtitle}>Aun no hay datos cargados.</p>
              </div>
            </>
          )}

          {step === 5 && (
            <>
              <div className={styles.header}>
                <h2 className={styles.title}>Evidencia / Pruebas</h2>
                <p className={styles.subtitle}>Aun no hay datos cargados.</p>
              </div>
            </>
          )}

          {step === 6 && (
            <>
              <div className={styles.header}>
                <h2 className={styles.title}>Motor y resultado</h2>
                <p className={styles.subtitle}>Aun no hay datos cargados.</p>
              </div>
            </>
          )}

          {step === 7 && (
            <>
              <div className={styles.header}>
                <h2 className={styles.title}>Simulacion</h2>
                <p className={styles.subtitle}>Aun no hay datos cargados.</p>
              </div>
            </>
          )}

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
          </div>
        )}
      </WizardShell>
    </div>
  );
}
