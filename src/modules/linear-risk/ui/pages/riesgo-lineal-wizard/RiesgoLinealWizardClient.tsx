'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import WizardShell from '@/shared/ui/wizard-shell/WizardShell';
import ActaStep from './_components/ActaStep';
import SignificantActivitiesStep, {
  type SignificantActivityCatalogOption,
  type SignificantActivityDraftItem,
} from './_components/SignificantActivitiesStep';
import RiskAnalysisStep from './_components/RiskAnalysisStep';
import QuestionnaireStep from './_components/QuestionnaireStep';
import ExtensionsStep from './_components/ExtensionsStep';
const TOTAL_STEPS = 5;

type Option = { id: string; name: string; code?: string; frameworkId?: string; jurisdictionId?: string; version?: string };
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
  const [context, setContext] = useState<ContextState>({ companyId: '' });
  const [options, setOptions] = useState<{ companies: Option[] }>({ companies: [] });
  const [scales, setScales] = useState<{ probabilityCatalog: ScaleOption[]; impactCatalog: ScaleOption[] }>({
    probabilityCatalog: [],
    impactCatalog: [],
  });
  const [activities, setActivities] = useState<SignificantActivityDraftItem[]>([buildDefaultActivity(0)]);
  const [activityCatalog, setActivityCatalog] = useState<SignificantActivityCatalogOption[]>([]);
  const [activityCatalogLoading, setActivityCatalogLoading] = useState(false);
  const [questionnaire, setQuestionnaire] = useState<ControlEvaluation[]>([]);
  const [extensions, setExtensions] = useState<ExtensionItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [aiLoadingFields, setAiLoadingFields] = useState<Record<string, boolean>>({});
  const [finalizing, setFinalizing] = useState(false);
  const [autoTitle, setAutoTitle] = useState('');
  const selectionAppliedRef = useRef<string>('');

  const loadContextOptions = useCallback(async () => {
    const res = await fetch('/api/linear-risk/context');
    if (!res.ok) return;
    const data = await res.json();
    setOptions({ companies: data.companies ?? [] });
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
    setContext((prev) => ({ ...prev, companyId: options.companies[0].id }));
  }, [context.companyId, options.companies]);

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
    const safeStep = Math.min(Math.max(draft.step || 1, 1), TOTAL_STEPS);
    setStep(safeStep);
    const normalizedCompanyId = String(draft.companyId || '').trim();
    setContext({ companyId: UUID_REGEX.test(normalizedCompanyId) ? normalizedCompanyId : '' });
    if (draft.acta) setActa({ ...buildDefaultActa(), ...draft.acta });
    if (Array.isArray(draft.questionnaire)) setQuestionnaire(draft.questionnaire);
    if (Array.isArray(draft.manualExtensions)) setExtensions(draft.manualExtensions);

    const notes = draft.notes && typeof draft.notes === 'object' ? draft.notes : null;
    if (Array.isArray((notes as any)?.activities) && (notes as any).activities.length > 0) {
      setActivities((notes as any).activities);
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
        },
        step,
        ...payload,
      }),
    });
  }, [draftId, acta, context.companyId, questionnaire, extensions, activities, step]);

  const persistActivities = useCallback(async () => {
    if (!draftId) return true;
    const normalized = normalizeActivities(activities);
    setActivities(normalized);
    const res = await fetch(`/api/linear-risk/drafts/${draftId}/activities`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: normalized, companyId: context.companyId || null }),
    });
    return res.ok;
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
    if (step === 4) {
      const ok = await persistControls();
      if (!ok) {
        // No bloquear el avance; el guardado se puede reintentar en el siguiente paso.
        console.error('No se pudo guardar controles en Paso 4, avanzando de todas formas.');
      }
    }
    if (step === 5) {
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
    if (step === 3) return 'Mitigación y riesgo residual';
    if (step === 4) return 'Gestión y controles';
    if (step === 5) return 'Hallazgos y acciones';
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
          context={{ companyId: context.companyId }}
          companies={options.companies}
          onChangeActa={setActa}
          onChangeContext={(next) => {
            if (Object.prototype.hasOwnProperty.call(next, 'companyId')) {
              setContext((prev) => ({ ...prev, companyId: next.companyId ?? '' }));
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
          probabilityCatalog={scales.probabilityCatalog}
          impactCatalog={scales.impactCatalog}
          catalogActivities={activityCatalog}
          loadingCatalog={activityCatalogLoading}
          onChange={setActivities}
          onOpenCreateActivity={(tempId) => {
            const params = new URLSearchParams({
              return_to: '/validacion/riesgo-lineal/nueva',
              draft: draftId || '',
              row_temp_id: tempId,
            });
            if (context.companyId) params.set('company_id', context.companyId);
            router.push(`/validacion/riesgo-lineal/actividad/nueva?${params.toString()}`);
          }}
          onOpenCreateRisk={(tempId, significantActivityId) => {
            const params = new URLSearchParams({
              return_to: '/validacion/riesgo-lineal/nueva',
              draft: draftId || '',
              row_temp_id: tempId,
              significant_activity_id: significantActivityId,
            });
            if (context.companyId) params.set('company_id', context.companyId);
            router.push(`/validacion/riesgo-lineal/riesgo/nuevo?${params.toString()}`);
          }}
          onAIRefine={refineText}
          aiLoadingFields={aiLoadingFields}
          onBack={prevStep}
          onSave={async () => {
            await persistActivities();
            await saveDraft();
          }}
          onNext={nextStep}
        />
      )}

      {step === 3 && (
        <RiskAnalysisStep
          draftId={draftId}
          onBack={prevStep}
          onNext={nextStep}
          onSave={() => saveDraft()}
        />
      )}

      {step === 4 && (
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

      {step === 5 && (
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
