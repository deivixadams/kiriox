'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import WizardShell from '@/shared/ui/wizard-shell/WizardShell';
import ActaStep from './_components/ActaStep';
import SignificantActivitiesStep, {
  type SignificantActivityCatalogOption,
  type SignificantActivityDraftItem,
} from './_components/SignificantActivitiesStep';
import QuestionnaireStep from './_components/QuestionnaireStep';
import ExtensionsStep from './_components/ExtensionsStep';
const TOTAL_STEPS = 4;

type Option = { id: string; name: string; code?: string; frameworkId?: string; jurisdictionId?: string; version?: string };
type RealmOption = { id: string; name: string; code?: string };
type ProcessOption = { id: string; name: string; code?: string; domainId?: string };
type ScaleOption = { id: number; code: string; name: string; description: string | null; baseValue: number; sortOrder: number };

type ActaData = {
  title: string;
  assessment_period_label: string;
  scope_description: string;
  business_context: string;
  model_of_business: string;
  entidad_nombre: string;
  periodo_inicio: string;
  periodo_fin: string;
  objetivo: string;
  alcance: string;
  marco_normativo: string;
  metodologia: string;
  model_of_business_id?: string;
  business_context_id?: string;
  business_context_domain_id?: string;
  lider_equipo: string;
  lider_equipo_id?: string;
  auditores: string;
  auditores_ids?: string[];
  cronograma: { hito: string; fecha: string }[];
};

type DraftRecord = {
  id: string;
  step: number;
  jurisdictionId?: string | null;
  frameworkId?: string | null;
  frameworkVersionId?: string | null;
  companyId?: string | null;
  acta?: ActaData | null;
  questionnaire?: any;
  manualExtensions?: any;
  notes?: any;
  windowStart?: string | null;
  windowEnd?: string | null;
};

type ContextState = {
  companyId: string;
  reinoId: string;
  processId: string;
  domainId: string;
};

type ControlEvaluation = {
  riskId: string;
  controlId: string;
  status: 'cumple' | 'parcial' | 'no_cumple' | '';
  notes: string;
  howToEvaluate?: string;
  evidence?: string[];
};

type ExtensionItem = { title: string; notes: string; evidence?: string[] };
const round6 = (value: number) => Math.round(value * 1_000_000) / 1_000_000;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizeActivities(items: SignificantActivityDraftItem[]): SignificantActivityDraftItem[] {
  return items.map((item, idx) => {
    const score =
      item.inherent_probability != null && item.inherent_impact != null
        ? round6(item.inherent_probability * item.inherent_impact)
        : null;

    return {
      ...item,
      significant_activity_id: item.significant_activity_id ?? null,
      inherent_risk_score: score,
      sort_order: idx + 1,
    };
  });
}

function buildDefaultActa(): ActaData {
  const today = new Date();
  const yyyy = today.getFullYear();
  return {
    title: '',
    assessment_period_label: `${yyyy}-01-01 a ${yyyy}-12-31`,
    scope_description: '',
    business_context: '',
    model_of_business: '',
    entidad_nombre: '',
    periodo_inicio: `${yyyy}-01-01`,
    periodo_fin: `${yyyy}-12-31`,
    objetivo: '',
    alcance: '',
    marco_normativo: '',
    metodologia: '',
    lider_equipo: '',
    lider_equipo_id: '',
    auditores: '',
    auditores_ids: [],
    cronograma: [
      { hito: 'Inicio Auditoria', fecha: `${yyyy}-02-15` },
      { hito: 'Trabajo de Campo', fecha: `${yyyy}-03-01` },
      { hito: 'Informe Preliminar', fecha: `${yyyy}-04-15` },
      { hito: 'Cierre Formal', fecha: `${yyyy}-05-10` },
    ],
  };
}

function buildDefaultActivity(idx: number): SignificantActivityDraftItem {
  return {
    tempId: crypto.randomUUID(),
    significant_activity_id: null,
    inherent_risk_catalog_id: null,
    activity_code: '',
    activity_name: '',
    activity_description: '',
    materiality_level: 'media',
    materiality_weight: null,
    materiality_justification: '',
    inherent_risk_description: '',
    inherent_probability: null,
    inherent_impact: null,
    inherent_risk_score: null,
    sort_order: idx + 1,
  };
}

export default function RiesgoLinealWizardClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [draftId, setDraftId] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [acta, setActa] = useState<ActaData>(buildDefaultActa());
  const [context, setContext] = useState<ContextState>({ companyId: '', reinoId: '', processId: '', domainId: '' });
  const [options, setOptions] = useState<{ companies: Option[]; reinos: RealmOption[]; processes: ProcessOption[] }>({
    companies: [],
    reinos: [],
    processes: [],
  });
  const [loadingReinos, setLoadingReinos] = useState(false);
  const [loadingProcesses, setLoadingProcesses] = useState(false);
  const [scales, setScales] = useState<{ probabilityCatalog: ScaleOption[]; impactCatalog: ScaleOption[] }>({
    probabilityCatalog: [],
    impactCatalog: [],
  });
  const [activities, setActivities] = useState<SignificantActivityDraftItem[]>([buildDefaultActivity(0)]);
  const [activityCatalog, setActivityCatalog] = useState<SignificantActivityCatalogOption[]>([]);
  const [activityCatalogLoading, setActivityCatalogLoading] = useState(false);
  const [questionnaire, setQuestionnaire] = useState<ControlEvaluation[]>([]);
  const [extensions, setExtensions] = useState<ExtensionItem[]>([]);
  const [mitigationByRiskKey, setMitigationByRiskKey] = useState<Record<string, { controlId: string; coveragePct: number }>>({});

  const [loading, setLoading] = useState(true);
  const [aiLoadingFields, setAiLoadingFields] = useState<Record<string, boolean>>({});
  const [finalizing, setFinalizing] = useState(false);
  const [autoTitle, setAutoTitle] = useState('');
  const selectionAppliedRef = useRef<string>('');

  const loadContextOptions = useCallback(async () => {
    const res = await fetch('/api/linear-risk/context');
    if (!res.ok) return;
    const data = await res.json();
    setOptions((prev) => ({ ...prev, companies: data.companies ?? [] }));
  }, []);

  const loadReinos = useCallback(async (companyId: string) => {
    const normalizedCompanyId = String(companyId || '').trim();
    if (!normalizedCompanyId || !UUID_REGEX.test(normalizedCompanyId)) {
      setOptions((prev) => ({ ...prev, reinos: [], processes: [] }));
      return;
    }

    setLoadingReinos(true);
    try {
      const res = await fetch(`/api/governance/reino-catalog?companyId=${encodeURIComponent(normalizedCompanyId)}`, {
        cache: 'no-store',
      });
      if (!res.ok) {
        setOptions((prev) => ({ ...prev, reinos: [], processes: [] }));
        return;
      }
      const data = await res.json();
      setOptions((prev) => ({ ...prev, reinos: Array.isArray(data?.items) ? data.items : [], processes: [] }));
    } finally {
      setLoadingReinos(false);
    }
  }, []);

  const loadProcesses = useCallback(async (companyId: string, reinoId: string) => {
    const normalizedCompanyId = String(companyId || '').trim();
    const normalizedReinoId = String(reinoId || '').trim();
    if (!normalizedCompanyId || !normalizedReinoId || !UUID_REGEX.test(normalizedCompanyId) || !UUID_REGEX.test(normalizedReinoId)) {
      setOptions((prev) => ({ ...prev, processes: [] }));
      return;
    }

    setLoadingProcesses(true);
    try {
      const params = new URLSearchParams({
        companyId: normalizedCompanyId,
        reinoId: normalizedReinoId,
      });
      const res = await fetch(`/api/governance/process-catalog?${params.toString()}`, { cache: 'no-store' });
      if (!res.ok) {
        setOptions((prev) => ({ ...prev, processes: [] }));
        return;
      }
      const data = await res.json();
      setOptions((prev) => ({ ...prev, processes: Array.isArray(data?.items) ? data.items : [] }));
    } finally {
      setLoadingProcesses(false);
    }
  }, []);

  const loadScalesCatalog = useCallback(async () => {
    const res = await fetch('/api/linear-risk/catalog/scales', { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    setScales({
      probabilityCatalog: Array.isArray(data?.probabilityCatalog) ? data.probabilityCatalog : [],
      impactCatalog: Array.isArray(data?.impactCatalog) ? data.impactCatalog : [],
    });
  }, []);

  const loadActivityCatalog = useCallback(async (companyId: string) => {
    const normalizedCompanyId = String(companyId || '').trim();
    if (!normalizedCompanyId || !UUID_REGEX.test(normalizedCompanyId)) {
      setActivityCatalog([]);
      return;
    }
    setActivityCatalogLoading(true);
    try {
      const res = await fetch(`/api/linear-risk/catalog/significant-activities?companyId=${encodeURIComponent(normalizedCompanyId)}`, { cache: 'no-store' });
      if (!res.ok) {
        setActivityCatalog([]);
        return;
      }
      const data = await res.json();
      const scopedItems = Array.isArray(data?.items) ? data.items : [];
      if (scopedItems.length > 0) {
        setActivityCatalog(scopedItems);
        return;
      }

      // Fallback de UX: si la empresa activa no tiene catálogo, habilita selección global.
      const fallbackRes = await fetch('/api/linear-risk/catalog/significant-activities?fallbackAll=1', { cache: 'no-store' });
      if (!fallbackRes.ok) {
        setActivityCatalog([]);
        return;
      }
      const fallbackData = await fallbackRes.json();
      setActivityCatalog(Array.isArray(fallbackData?.items) ? fallbackData.items : []);
    } finally {
      setActivityCatalogLoading(false);
    }
  }, []);

  useEffect(() => {
    if (context.companyId) return;
    if (options.companies.length === 0) return;
    setContext((prev) => ({ ...prev, companyId: options.companies[0].id, reinoId: '', processId: '', domainId: '' }));
  }, [context.companyId, options.companies]);

  useEffect(() => {
    if (!context.companyId) {
      setOptions((prev) => ({ ...prev, reinos: [], processes: [] }));
      return;
    }
    loadReinos(context.companyId);
  }, [context.companyId, loadReinos]);

  useEffect(() => {
    if (!context.companyId || !context.reinoId) {
      setOptions((prev) => ({ ...prev, processes: [] }));
      return;
    }
    loadProcesses(context.companyId, context.reinoId);
  }, [context.companyId, context.reinoId, loadProcesses]);

  useEffect(() => {
    if (options.reinos.length === 0) {
      if (context.reinoId || acta.model_of_business || acta.model_of_business_id) {
        setContext((prev) => ({ ...prev, reinoId: '', processId: '', domainId: '' }));
        setActa((prev) => ({
          ...prev,
          model_of_business: '',
          model_of_business_id: '',
          business_context: '',
          business_context_id: '',
          business_context_domain_id: '',
          objetivo: '',
        }));
      }
      return;
    }

    if (context.reinoId && options.reinos.some((item) => item.id === context.reinoId)) return;

    const fallback = options.reinos[0];
    setContext((prev) => ({ ...prev, reinoId: fallback.id, processId: '', domainId: '' }));
    setActa((prev) => ({
      ...prev,
      model_of_business: fallback.name,
      model_of_business_id: fallback.id,
      entidad_nombre: fallback.name,
      business_context: '',
      business_context_id: '',
      business_context_domain_id: '',
      objetivo: '',
    }));
  }, [options.reinos, context.reinoId, acta.model_of_business, acta.model_of_business_id]);

  useEffect(() => {
    if (!context.reinoId) return;
    const selectedRealm = options.reinos.find((item) => item.id === context.reinoId);
    if (!selectedRealm) return;

    if (acta.model_of_business === selectedRealm.name && acta.model_of_business_id === selectedRealm.id) return;
    setActa((prev) => ({
      ...prev,
      model_of_business: selectedRealm.name,
      model_of_business_id: selectedRealm.id,
      entidad_nombre: selectedRealm.name,
    }));
  }, [context.reinoId, options.reinos, acta.model_of_business, acta.model_of_business_id]);

  useEffect(() => {
    if (options.processes.length === 0) {
      if (context.processId || acta.business_context || acta.business_context_id) {
        setContext((prev) => ({ ...prev, processId: '', domainId: '' }));
        setActa((prev) => ({
          ...prev,
          business_context: '',
          business_context_id: '',
          business_context_domain_id: '',
          objetivo: '',
        }));
      }
      return;
    }

    if (context.processId && options.processes.some((item) => item.id === context.processId)) return;

    const fallback = options.processes[0];
    setContext((prev) => ({ ...prev, processId: fallback.id, domainId: fallback.domainId || '' }));
    setActa((prev) => ({
      ...prev,
      business_context: fallback.name,
      business_context_id: fallback.id,
      business_context_domain_id: fallback.domainId || '',
      objetivo: fallback.name,
    }));
  }, [options.processes, context.processId, acta.business_context, acta.business_context_id]);

  useEffect(() => {
    if (!context.processId) return;
    const selectedProcess = options.processes.find((item) => item.id === context.processId);
    if (!selectedProcess) return;

    if (
      acta.business_context === selectedProcess.name &&
      acta.business_context_id === selectedProcess.id &&
      (acta.business_context_domain_id || '') === (selectedProcess.domainId || '')
    ) {
      return;
    }

    setActa((prev) => ({
      ...prev,
      business_context: selectedProcess.name,
      business_context_id: selectedProcess.id,
      business_context_domain_id: selectedProcess.domainId || '',
      objetivo: selectedProcess.name,
    }));
  }, [context.processId, options.processes, acta.business_context, acta.business_context_id, acta.business_context_domain_id]);

  useEffect(() => {
    const selected = options.companies.find((c) => c.id === context.companyId);
    if (!selected) return;
    const nextAutoTitle = `Evaluación integral de riesgo ${selected.name}`.trim();
    setActa((prev) => {
      if (!prev.title || prev.title === autoTitle) {
        return { ...prev, title: nextAutoTitle };
      }
      return prev;
    });
    setAutoTitle(nextAutoTitle);
  }, [context.companyId, options.companies, autoTitle]);

  useEffect(() => {
    if (!context.companyId) return;
    loadActivityCatalog(context.companyId);
  }, [context.companyId, loadActivityCatalog]);

  const hydrateDraft = useCallback((draft: DraftRecord) => {
    setDraftId(draft.id);
    const rawStep = Math.max(draft.step || 1, 1);
    const mappedStep = rawStep >= 4 ? rawStep - 1 : rawStep;
    const safeStep = Math.min(mappedStep, TOTAL_STEPS);
    setStep(safeStep);
    const normalizedCompanyId = String(draft.companyId || '').trim();
    const mergedActa = draft.acta ? { ...buildDefaultActa(), ...draft.acta } : buildDefaultActa();
    setActa(mergedActa);
    setContext({
      companyId: UUID_REGEX.test(normalizedCompanyId) ? normalizedCompanyId : '',
      reinoId: mergedActa.model_of_business_id || '',
      processId: mergedActa.business_context_id || '',
      domainId: mergedActa.business_context_domain_id || '',
    });
    if (Array.isArray(draft.questionnaire)) setQuestionnaire(draft.questionnaire);
    if (Array.isArray(draft.manualExtensions)) setExtensions(draft.manualExtensions);

    const notes = draft.notes && typeof draft.notes === 'object' ? draft.notes : null;
    if (Array.isArray((notes as any)?.activities) && (notes as any).activities.length > 0) {
      setActivities((notes as any).activities);
    }
    if ((notes as any)?.mitigationByRiskKey && typeof (notes as any).mitigationByRiskKey === 'object') {
      setMitigationByRiskKey((notes as any).mitigationByRiskKey);
    }
  }, []);

  const createDraft = useCallback(async () => {
    await fetch('/api/auth/csrf');
    const res = await fetch('/api/linear-risk/drafts', { method: 'POST' });
    if (!res.ok) return null;
    const data = await res.json();
    return data as DraftRecord;
  }, []);

  const loadDraft = useCallback(async (id: string) => {
    const res = await fetch(`/api/linear-risk/drafts/${id}`);
    if (!res.ok) return null;
    return (await res.json()) as DraftRecord;
  }, []);

  const saveDraft = useCallback(async (payload?: Partial<DraftRecord>) => {
    if (!draftId) return;
    await fetch('/api/auth/csrf');
    await fetch(`/api/linear-risk/drafts/${draftId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        acta,
        companyId: context.companyId || null,
        questionnaire,
        manualExtensions: extensions,
        notes: {
          activities,
          mitigationByRiskKey,
        },
        step,
        ...payload,
      }),
    });
  }, [draftId, acta, context.companyId, questionnaire, extensions, activities, mitigationByRiskKey, step]);

  const persistActivities = useCallback(async () => {
    if (!draftId) return true;
    const normalized = normalizeActivities(activities);
    setActivities(normalized);
    const res = await fetch(`/api/linear-risk/drafts/${draftId}/activities`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: normalized, companyId: context.companyId || null }),
    });
    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      throw new Error(payload?.error || 'No se pudo guardar las actividades.');
    }
    return true;
  }, [draftId, activities, context.companyId]);

  const persistControls = useCallback(async () => {
    if (!draftId) return true;
    const res = await fetch(`/api/linear-risk/drafts/${draftId}/controls`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ evaluations: questionnaire }),
    });
    return res.ok;
  }, [draftId, questionnaire]);

  const persistFindingsActions = useCallback(async () => {
    if (!draftId) return true;
    const res = await fetch(`/api/linear-risk/drafts/${draftId}/findings-actions`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ extensions }),
    });
    return res.ok;
  }, [draftId, extensions]);

  useEffect(() => {
    const boot = async () => {
      setLoading(true);
      await Promise.all([loadContextOptions(), loadScalesCatalog()]);
      const existingDraft = searchParams.get('draft');
      const draft = existingDraft ? await loadDraft(existingDraft) : await createDraft();
      if (draft) hydrateDraft(draft);
      setLoading(false);
    };
    boot();
  }, [createDraft, loadContextOptions, loadDraft, hydrateDraft, loadScalesCatalog, searchParams]);

  useEffect(() => {
    const selectedActivityId = searchParams.get('selected_activity_id');
    const rowTempId = searchParams.get('row_temp_id');
    const fromNewActivity = searchParams.get('from_new_activity');
    if (!fromNewActivity || !selectedActivityId || !rowTempId) return;
    const selectionToken = `${rowTempId}:${selectedActivityId}`;
    if (selectionAppliedRef.current === selectionToken) return;
    if (activityCatalog.length === 0) return;
    const selected = activityCatalog.find((item) => item.id === selectedActivityId);
    if (!selected) return;

    selectionAppliedRef.current = selectionToken;
    setStep(2);
    setActivities((prev) =>
      prev.map((item) =>
        item.tempId === rowTempId
          ? {
              ...item,
              significant_activity_id: selected.id,
              activity_code: selected.activity_code,
              activity_name: selected.activity_name,
              activity_description: selected.activity_description || '',
            }
          : item
      )
    );
  }, [activityCatalog, searchParams]);

  useEffect(() => {
    const selectedRiskId = searchParams.get('selected_risk_id');
    const rowTempId = searchParams.get('row_temp_id');
    const fromNewRisk = searchParams.get('from_new_risk');
    if (!fromNewRisk || !selectedRiskId || !rowTempId) return;
    const selectionToken = `risk:${rowTempId}:${selectedRiskId}`;
    if (selectionAppliedRef.current === selectionToken) return;

    const apply = async () => {
      const res = await fetch(`/api/linear-risk/catalog/risk-catalog?id=${encodeURIComponent(selectedRiskId)}`, {
        cache: 'no-store',
      });
      if (!res.ok) return;
      const risk = await res.json().catch(() => null);
      if (!risk?.id) return;

      selectionAppliedRef.current = selectionToken;
      setStep(2);
      setActivities((prev) =>
        prev.map((item) =>
          item.tempId === rowTempId
            ? {
                ...item,
                inherent_risk_catalog_id: String(risk.id),
                inherent_risk_description: String(risk.risk_description || risk.risk_name || ''),
              }
            : item
        )
      );
    };
    apply();
  }, [searchParams]);

  const refineText = useCallback(async ({
    text,
    field,
    promptCode,
    loadingKey,
  }: {
    text: string;
    field: string;
    promptCode: string;
    loadingKey?: string;
  }) => {
    const key = loadingKey || field;
    setAiLoadingFields((prev) => ({ ...prev, [key]: true }));
    try {
      const res = await fetch('/api/ai/refine-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, field, promptCode }),
      });
      const data = await res.json();
      return data.refinedText ? String(data.refinedText) : null;
    } finally {
      setAiLoadingFields((prev) => ({ ...prev, [key]: false }));
    }
  }, []);

  const handleAI = async (field: string, promptCode: string) => {
    const current = String((acta as any)[field] || '');
    const refined = await refineText({ text: current, field, promptCode });
    if (refined && refined.trim()) {
      setActa((prev) => ({ ...prev, [field]: refined.trim() }));
    }
  };

  const nextStep = async () => {
    const newStep = Math.min(step + 1, TOTAL_STEPS);

    if (step === 2) {
      const ok = await persistActivities();
      if (!ok) return;
    }
    if (step === 3) {
      const ok = await persistControls();
      if (!ok) {
        // No bloquear el avance; el guardado se puede reintentar en el siguiente paso.
        console.error('No se pudo guardar controles en Paso 3, avanzando de todas formas.');
      }
    }
    if (step === 4) {
      const ok = await persistFindingsActions();
      if (!ok) return;
    }

    setStep(newStep);
  };

  const prevStep = async () => {
    const newStep = Math.max(step - 1, 1);
    setStep(newStep);
  };

  const finalize = async () => {
    if (!draftId) return;
    setFinalizing(true);
    try {
      await saveDraft();
      await persistActivities();
      await persistControls();
      await persistFindingsActions();

      await fetch('/api/auth/csrf');
      const res = await fetch(`/api/linear-risk/drafts/${draftId}/finalize`, { method: 'POST' });
      if (!res.ok) return;
      router.push('/validacion/riesgo-lineal');
    } finally {
      setFinalizing(false);
    }
  };

  const generateReport = async () => {
    if (!draftId) return;
    setFinalizing(true);
    try {
      await saveDraft();
      await persistActivities();
      await persistControls();
      await persistFindingsActions();
      await fetch('/api/auth/csrf');
      const res = await fetch(`/api/linear-risk/drafts/${draftId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Informe_Riesgo_Lineal_${draftId}.docx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      router.push('/validacion/riesgo-lineal');
    } finally {
      setFinalizing(false);
    }
  };

  const handleClose = () => {
    router.push('/validacion/riesgo-lineal');
  };

  const stepTitle = useMemo(() => {
    if (step === 1) return 'Contexto del análisis';
    if (step === 2) return 'Actividades significativas';
    if (step === 3) return 'Gestión y controles';
    if (step === 4) return 'Hallazgos y acciones';
    return 'Wizard';
  }, [step]);

  if (loading) {
    return <div className="p-6 text-sm text-slate-500">Cargando wizard...</div>;
  }

  return (
    <WizardShell title={stepTitle} subtitle="Riesgo lineal" step={step} totalSteps={TOTAL_STEPS} onClose={handleClose}>
      {step === 1 && (
        <ActaStep
          acta={acta}
          context={{ companyId: context.companyId, reinoId: context.reinoId, processId: context.processId }}
          companies={options.companies}
          reinos={options.reinos}
          processes={options.processes}
          loadingReinos={loadingReinos}
          loadingProcesses={loadingProcesses}
          onChangeActa={setActa}
          onChangeContext={(next) => {
            if (Object.prototype.hasOwnProperty.call(next, 'companyId')) {
              const nextCompanyId = next.companyId ?? '';
              setContext((prev) => ({
                ...prev,
                companyId: nextCompanyId,
                reinoId: '',
                processId: '',
                domainId: '',
              }));
              setActa((prev) => ({
                ...prev,
                model_of_business: '',
                model_of_business_id: '',
                business_context: '',
                business_context_id: '',
                business_context_domain_id: '',
                objetivo: '',
              }));
            }
            if (Object.prototype.hasOwnProperty.call(next, 'reinoId')) {
              const nextReinoId = next.reinoId ?? '';
              const selectedRealm = options.reinos.find((item) => item.id === nextReinoId);
              setContext((prev) => ({
                ...prev,
                reinoId: nextReinoId,
                processId: '',
                domainId: '',
              }));
              setActa((prev) => ({
                ...prev,
                model_of_business: selectedRealm?.name || '',
                model_of_business_id: selectedRealm?.id || '',
                entidad_nombre: selectedRealm?.name || '',
                business_context: '',
                business_context_id: '',
                business_context_domain_id: '',
                objetivo: '',
              }));
            }
            if (Object.prototype.hasOwnProperty.call(next, 'processId')) {
              const nextProcessId = next.processId ?? '';
              const selectedProcess = options.processes.find((item) => item.id === nextProcessId);
              setContext((prev) => ({
                ...prev,
                processId: nextProcessId,
                domainId: selectedProcess?.domainId || '',
              }));
              setActa((prev) => ({
                ...prev,
                business_context: selectedProcess?.name || '',
                business_context_id: selectedProcess?.id || '',
                business_context_domain_id: selectedProcess?.domainId || '',
                objetivo: selectedProcess?.name || '',
              }));
            }
          }}
          onAI={handleAI}
          aiLoadingFields={aiLoadingFields}
          onSave={() => saveDraft()}
          onNext={nextStep}
        />
      )}

      {step === 2 && (
        <SignificantActivitiesStep
          items={activities}
          mitigationByRiskKey={mitigationByRiskKey}
          probabilityCatalog={scales.probabilityCatalog}
          impactCatalog={scales.impactCatalog}
          catalogActivities={activityCatalog}
          loadingCatalog={activityCatalogLoading}
          onChange={setActivities}
          onChangeMitigationByRiskKey={setMitigationByRiskKey}
          onOpenCreateActivity={(tempId) => {
            const params = new URLSearchParams({
              return_to: '/validacion/riesgo-lineal/nueva',
              draft: draftId || '',
              row_temp_id: tempId,
            });
            if (context.companyId) params.set('company_id', context.companyId);
            router.push(`/validacion/riesgo-lineal/actividad/nueva?${params.toString()}`);
          }}
          onBack={prevStep}
          onSave={async () => {
            await persistActivities();
            await saveDraft();
          }}
          onNext={nextStep}
        />
      )}

      {step === 3 && (
        <QuestionnaireStep
          draftId={draftId}
          riskIds={[]}
          evaluations={questionnaire}
          onChange={setQuestionnaire}
          onBack={prevStep}
          onNext={nextStep}
          onSave={async () => {
            await persistControls();
            await saveDraft();
          }}
        />
      )}

      {step === 4 && (
        <ExtensionsStep
          draftId={draftId}
          evaluations={questionnaire}
          extensions={extensions}
          onChange={setExtensions}
          onBack={prevStep}
          onFinalize={finalize}
          onGenerateReport={generateReport}
          onSave={async () => {
            await persistFindingsActions();
            await saveDraft();
          }}
          finalizing={finalizing}
        />
      )}
    </WizardShell>
  );
}
