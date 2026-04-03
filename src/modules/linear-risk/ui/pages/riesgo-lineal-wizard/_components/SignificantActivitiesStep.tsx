'use client';

import React, { useMemo, useState } from 'react';
import { ChevronDown, Plus, Sparkles, Trash2 } from 'lucide-react';
import styles from './SignificantActivitiesStep.module.css';

type ScaleOption = {
  id: number;
  code: string;
  name: string;
  description: string | null;
  baseValue: number;
  sortOrder: number;
};

export type SignificantActivityCatalogOption = {
  id: string;
  company_id: string;
  activity_code: string;
  activity_name: string;
  activity_description: string | null;
  is_active: boolean;
};

export type SignificantActivityDraftItem = {
  tempId: string;
  significant_activity_id?: string | null;
  inherent_risk_catalog_id?: string | null;
  activity_code: string;
  activity_name: string;
  activity_description: string;
  materiality_level: 'baja' | 'media' | 'alta' | 'critica';
  materiality_weight: number | null;
  materiality_justification: string;
  inherent_risk_description: string;
  inherent_probability: number | null;
  inherent_impact: number | null;
  inherent_risk_score: number | null;
  sort_order: number;
};

type ActivityRiskOption = {
  id: string;
  significant_activity_id: string | null;
  risk_name: string;
  risk_description: string;
  risk_category: string;
};

type Props = {
  items: SignificantActivityDraftItem[];
  probabilityCatalog: ScaleOption[];
  impactCatalog: ScaleOption[];
  catalogActivities: SignificantActivityCatalogOption[];
  loadingCatalog: boolean;
  onChange: (next: SignificantActivityDraftItem[]) => void;
  onOpenCreateActivity: (tempId: string) => void;
  onOpenCreateRisk: (tempId: string, significantActivityId: string) => void;
  onBack: () => void;
  onNext: () => void | Promise<void>;
  onSave: () => void | Promise<void>;
  onAIRefine: (payload: { text: string; field: string; promptCode: string; loadingKey?: string }) => Promise<string | null>;
  aiLoadingFields: Record<string, boolean>;
};

const round6 = (value: number) => Math.round(value * 1_000_000) / 1_000_000;

function computeInherentRisk(probability: number | null, impact: number | null) {
  if (probability == null || impact == null) return null;
  return round6(probability * impact);
}

function deriveMaterialityLevel(score: number | null): SignificantActivityDraftItem['materiality_level'] {
  if (score == null) return 'media';
  if (score > 17) return 'critica';
  if (score > 10) return 'alta';
  if (score > 5) return 'media';
  return 'baja';
}

function buildCanonicalItems(items: SignificantActivityDraftItem[]): SignificantActivityDraftItem[] {
  return items.map((item, idx) => {
    const score = computeInherentRisk(item.inherent_probability, item.inherent_impact);
    return {
      ...item,
      sort_order: idx + 1,
      inherent_risk_score: score,
      materiality_level: deriveMaterialityLevel(score),
    };
  });
}

function buildEmpty(index: number): SignificantActivityDraftItem {
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
    sort_order: index + 1,
  };
}

export default function SignificantActivitiesStep({
  items,
  probabilityCatalog,
  impactCatalog,
  catalogActivities,
  loadingCatalog,
  onChange,
  onOpenCreateActivity,
  onOpenCreateRisk,
  onBack,
  onNext,
  onSave,
  onAIRefine,
  aiLoadingFields,
}: Props) {
  const [error, setError] = useState<string | null>(null);
  const [comboSearchByRow, setComboSearchByRow] = useState<Record<string, string>>({});
  const [comboOpenByRow, setComboOpenByRow] = useState<Record<string, boolean>>({});
  const [riskListOpenByRow, setRiskListOpenByRow] = useState<Record<string, boolean>>({});
  const [riskOptionsByActivity, setRiskOptionsByActivity] = useState<Record<string, ActivityRiskOption[]>>({});
  const [riskOptionsLoadingByActivity, setRiskOptionsLoadingByActivity] = useState<Record<string, boolean>>({});

  const normalizedItems = useMemo(() => buildCanonicalItems(items), [items]);

  const catalogMap = useMemo(() => {
    const map = new Map<string, SignificantActivityCatalogOption>();
    catalogActivities.forEach((item) => map.set(item.id, item));
    return map;
  }, [catalogActivities]);

  const getFilteredCatalog = (tempId: string) => {
    const term = (comboSearchByRow[tempId] || '').trim().toLowerCase();
    const filtered = !term
      ? catalogActivities
      : catalogActivities.filter((opt) => {
          const haystack = `${opt.activity_code} ${opt.activity_name} ${opt.activity_description || ''}`.toLowerCase();
          return haystack.includes(term);
        });

    return [...filtered].sort((a, b) =>
      a.activity_name.localeCompare(b.activity_name, 'es', { sensitivity: 'base' })
    );
  };

  const getSelectedLabel = (item: SignificantActivityDraftItem) => {
    if (!item.significant_activity_id) return '';
    const selected = catalogMap.get(item.significant_activity_id);
    return selected ? selected.activity_name : '';
  };

  const syncNormalized = () => {
    const left = JSON.stringify(items);
    const right = JSON.stringify(normalizedItems);
    if (left !== right) {
      onChange(normalizedItems);
    }
  };

  const setField = <K extends keyof SignificantActivityDraftItem>(tempId: string, field: K, value: SignificantActivityDraftItem[K]) => {
    onChange(normalizedItems.map((item) => {
      if (item.tempId !== tempId) return item;
      const next = { ...item, [field]: value };
      if (field === 'inherent_probability' || field === 'inherent_impact') {
        const probability = field === 'inherent_probability' ? (value as number | null) : next.inherent_probability;
        const impact = field === 'inherent_impact' ? (value as number | null) : next.inherent_impact;
        const score = computeInherentRisk(probability, impact);
        next.inherent_risk_score = score;
        next.materiality_level = deriveMaterialityLevel(score);
      }
      return next;
    }));
  };

  const setSelectedActivity = (tempId: string, significantActivityId: string) => {
    onChange(normalizedItems.map((item) => {
      if (item.tempId !== tempId) return item;
      const selected = catalogMap.get(significantActivityId);
      if (!selected) {
        return {
          ...item,
          significant_activity_id: null,
          inherent_risk_catalog_id: null,
          activity_code: '',
          activity_name: '',
          activity_description: '',
        };
      }
      return {
        ...item,
        significant_activity_id: selected.id,
        inherent_risk_catalog_id: null,
        activity_code: selected.activity_code,
        activity_name: selected.activity_name,
        activity_description: selected.activity_description || '',
      };
    }));
    setComboSearchByRow((prev) => {
      const copy = { ...prev };
      delete copy[tempId];
      return copy;
    });
    setComboOpenByRow((prev) => ({ ...prev, [tempId]: false }));
    setError(null);
  };

  const addItem = () => {
    onChange([...normalizedItems, buildEmpty(normalizedItems.length)]);
  };

  const removeItem = (tempId: string) => {
    onChange(normalizedItems.filter((item) => item.tempId !== tempId));
  };

  const validate = () => {
    if (normalizedItems.length === 0) {
      setError('Debes registrar al menos una actividad significativa.');
      return false;
    }

    const seenActivities = new Map<string, number>();
    for (let idx = 0; idx < normalizedItems.length; idx += 1) {
      const id = normalizedItems[idx].significant_activity_id;
      if (!id) continue;
      if (seenActivities.has(id)) {
        const first = seenActivities.get(id) as number;
        setError(`Actividad duplicada: filas ${first} y ${idx + 1}.`);
        return false;
      }
      seenActivities.set(id, idx + 1);
    }

    const invalidIndex = normalizedItems.findIndex((item) => {
      const missingRiskText = !item.inherent_risk_description.trim() && !item.inherent_risk_catalog_id;
      const missingProb = item.inherent_probability === null || Number.isNaN(Number(item.inherent_probability));
      const missingImpact = item.inherent_impact === null || Number.isNaN(Number(item.inherent_impact));
      return !item.significant_activity_id || missingRiskText || missingProb || missingImpact;
    });

    if (invalidIndex >= 0) {
      const item = normalizedItems[invalidIndex];
      const missing: string[] = [];
      if (!item.significant_activity_id) missing.push('actividad');
      if (!item.inherent_risk_description.trim() && !item.inherent_risk_catalog_id) missing.push('riesgo inherente');
      if (item.inherent_probability === null || Number.isNaN(Number(item.inherent_probability))) missing.push('probabilidad');
      if (item.inherent_impact === null || Number.isNaN(Number(item.inherent_impact))) missing.push('impacto');
      const detail = missing.length > 0 ? missing.join(', ') : 'datos requeridos';
      setError(`Fila ${invalidIndex + 1}: completa ${detail}.`);
      return false;
    }

    setError(null);
    return true;
  };

  const handleNext = async () => {
    syncNormalized();
    if (!validate()) return;
    try {
      await onNext();
    } catch (err: any) {
      setError(err?.message || 'No se pudo guardar las actividades.');
    }
  };

  const handleSave = async () => {
    syncNormalized();
    if (!validate()) return;
    try {
      await onSave();
    } catch (err: any) {
      setError(err?.message || 'No se pudo guardar las actividades. Verifica la empresa seleccionada.');
    }
  };

  const handleAI = async (tempId: string, field: 'inherent_risk_description' | 'materiality_justification', promptCode: string) => {
    const item = normalizedItems.find((row) => row.tempId === tempId);
    if (!item) return;
    const currentText = String(item[field] ?? '');
    const refined = await onAIRefine({ text: currentText, field, promptCode, loadingKey: `${tempId}.${field}` });
    if (refined && refined.trim()) {
      setField(tempId, field, refined.trim());
    }
    setError(null);
  };

  const ensureRisksForActivity = async (significantActivityId: string) => {
    if (!significantActivityId) return;
    if (riskOptionsByActivity[significantActivityId]) return;
    setRiskOptionsLoadingByActivity((prev) => ({ ...prev, [significantActivityId]: true }));
    try {
      const res = await fetch(
        `/api/linear-risk/catalog/risks-by-activity?significantActivityId=${encodeURIComponent(significantActivityId)}`,
        { cache: 'no-store' }
      );
      const data = await res.json().catch(() => ({}));
      const rows = Array.isArray(data?.items) ? data.items : [];
      setRiskOptionsByActivity((prev) => ({ ...prev, [significantActivityId]: rows }));
    } finally {
      setRiskOptionsLoadingByActivity((prev) => ({ ...prev, [significantActivityId]: false }));
    }
  };

  const openRiskList = async (item: SignificantActivityDraftItem) => {
    if (!item.significant_activity_id) return;
    setRiskListOpenByRow((prev) => ({ ...prev, [item.tempId]: true }));
    try {
      await ensureRisksForActivity(item.significant_activity_id);
    } catch {
      setError('No se pudieron cargar los riesgos asociados a la actividad seleccionada.');
    }
  };

  const selectRiskForRow = (tempId: string, risk: ActivityRiskOption) => {
    onChange(
      normalizedItems.map((item) =>
        item.tempId === tempId
          ? {
              ...item,
              inherent_risk_catalog_id: risk.id,
              inherent_risk_description: risk.risk_description || risk.risk_name || '',
            }
          : item
      )
    );
    setRiskListOpenByRow((prev) => ({ ...prev, [tempId]: false }));
    setError(null);
  };

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <p className={styles.subtitle}>
          Define las actividades objeto de evaluación, delimita su función, contexto operativo, relevancia y exposición.
          Con base en ello, identifica y registra riesgos inherentes considerando probabilidad e impacto, asegurando que
          cada valoración sea estructurada, justificable y trazable hasta la determinación del riesgo neto, hallazgos y
          acciones de remediación.
        </p>
      </div>

      <div className={styles.list}>
        {normalizedItems.map((item, idx) => (
          <div key={item.tempId} className={styles.card}>
            <div className={styles.cardTop}>
              <div className={styles.cardTitle}>
                <span className={styles.cardTitleIndex}>Actividad {idx + 1}</span>
                {item.activity_name ? (
                  <>
                    <span className={styles.cardTitleDivider}> ─ </span>
                    <span className={styles.cardTitleName}>{item.activity_name}</span>
                  </>
                ) : null}
              </div>
              <button type="button" className={styles.removeButton} onClick={() => removeItem(item.tempId)}>
                <Trash2 size={14} />
                Eliminar
              </button>
            </div>

            <div className={styles.grid}>
              <label className={styles.field}>
                <span
                  className={styles.labelAction}
                  onClick={() => onOpenCreateActivity(item.tempId)}
                  title="Clic para crear una nueva actividad"
                >
                  Actividad significativa
                </span>
                <div
                  className={styles.comboBox}
                  onFocus={() => setComboOpenByRow((prev) => ({ ...prev, [item.tempId]: true }))}
                  onBlur={() => {
                    window.setTimeout(() => {
                      setComboOpenByRow((prev) => ({ ...prev, [item.tempId]: false }));
                      setComboSearchByRow((prev) => {
                        const copy = { ...prev };
                        delete copy[item.tempId];
                        return copy;
                      });
                    }, 120);
                  }}
                >
                  <input
                    className={styles.comboInput}
                    value={comboSearchByRow[item.tempId] ?? getSelectedLabel(item)}
                    onChange={(e) => {
                      setComboSearchByRow((prev) => ({ ...prev, [item.tempId]: e.target.value }));
                      setComboOpenByRow((prev) => ({ ...prev, [item.tempId]: true }));
                    }}
                    onClick={() => setComboOpenByRow((prev) => ({ ...prev, [item.tempId]: true }))}
                    placeholder={loadingCatalog ? 'Cargando actividades...' : 'Seleccione actividad...'}
                    disabled={loadingCatalog}
                  />
                  <button
                    type="button"
                    className={styles.comboToggle}
                    onClick={() =>
                      setComboOpenByRow((prev) => ({ ...prev, [item.tempId]: !prev[item.tempId] }))
                    }
                    disabled={loadingCatalog}
                    aria-label="Abrir opciones de actividad"
                  >
                    <ChevronDown size={16} />
                  </button>

                  {comboOpenByRow[item.tempId] && !loadingCatalog && (
                    <div className={styles.comboList}>
                      {getFilteredCatalog(item.tempId).length === 0 ? (
                        <div className={styles.comboEmpty}>Sin resultados</div>
                      ) : (
                        getFilteredCatalog(item.tempId).map((opt) => (
                          <button
                            type="button"
                            key={opt.id}
                            className={styles.comboOption}
                            onMouseDown={(event) => {
                              event.preventDefault();
                              setSelectedActivity(item.tempId, opt.id);
                            }}
                          >
                            {opt.activity_name}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </label>

              <label className={styles.field}>
                <span>Código</span>
                <input className={styles.input} value={item.activity_code} readOnly placeholder="Se completa al seleccionar" />
              </label>

              <label className={styles.field}>
                <span>Nombre de actividad</span>
                <input className={styles.input} value={item.activity_name} readOnly placeholder="Se completa al seleccionar" />
              </label>
            </div>

            <label className={styles.field}>
              <div className={styles.fieldHeader}>
                <span>Descripción de actividad</span>
              </div>
              <textarea
                className={`${styles.textarea} ${styles.descriptionTextarea}`}
                rows={3}
                value={item.activity_description}
                readOnly
                placeholder="Se completa al seleccionar actividad"
              />
            </label>

            <div className={styles.gridTwo}>
              <label className={styles.field}>
                <div className={styles.fieldHeader}>
                  <button
                    type="button"
                    className={styles.labelButton}
                    onClick={() => {
                      if (!item.significant_activity_id) {
                        setError('Selecciona primero una actividad significativa para crear un riesgo.');
                        return;
                      }
                      onOpenCreateRisk(item.tempId, item.significant_activity_id);
                    }}
                    title="Clic para crear nuevo riesgo de la actividad seleccionada"
                  >
                    Riesgo inherente narrativo
                  </button>
                  <button
                    type="button"
                    className={styles.aiButton}
                    onClick={() => handleAI(item.tempId, 'inherent_risk_description', 'LINEAR_INHERENT_RISK')}
                    disabled={!!aiLoadingFields[`${item.tempId}.inherent_risk_description`]}
                  >
                    <Sparkles size={14} />
                    IA
                  </button>
                </div>
                <textarea
                  className={styles.textarea}
                  rows={4}
                  value={item.inherent_risk_description}
                  onChange={(e) => setField(item.tempId, 'inherent_risk_description', e.target.value)}
                  onFocus={() => openRiskList(item)}
                  onClick={() => openRiskList(item)}
                  placeholder="Describe el riesgo inherente asociado a la actividad"
                />
                {item.significant_activity_id && riskListOpenByRow[item.tempId] && (
                  <div className={styles.riskListBox}>
                    <div className={styles.riskListHeader}>
                      <span>Nombre</span>
                      <span>Descripción</span>
                      <span>Categoría</span>
                    </div>
                    {riskOptionsLoadingByActivity[item.significant_activity_id] ? (
                      <div className={styles.riskListEmpty}>Cargando riesgos...</div>
                    ) : (riskOptionsByActivity[item.significant_activity_id] || []).length === 0 ? (
                      <div className={styles.riskListEmpty}>No hay riesgos asociados a esta actividad.</div>
                    ) : (
                      (riskOptionsByActivity[item.significant_activity_id] || []).map((risk) => (
                        <button
                          key={risk.id}
                          type="button"
                          className={styles.riskListRow}
                          onMouseDown={(event) => {
                            event.preventDefault();
                            selectRiskForRow(item.tempId, risk);
                          }}
                        >
                          <span>{risk.risk_name}</span>
                          <span>{risk.risk_description}</span>
                          <span>{risk.risk_category || '—'}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </label>

              <label className={styles.field}>
                <div className={styles.fieldHeader}>
                  <span>Justificación de materialidad</span>
                  <button
                    type="button"
                    className={styles.aiButton}
                    onClick={() => handleAI(item.tempId, 'materiality_justification', 'LINEAR_MATERIALITY_JUSTIFICATION')}
                    disabled={!!aiLoadingFields[`${item.tempId}.materiality_justification`]}
                  >
                    <Sparkles size={14} />
                    IA
                  </button>
                </div>
                <textarea
                  className={styles.textarea}
                  rows={4}
                  value={item.materiality_justification}
                  onChange={(e) => setField(item.tempId, 'materiality_justification', e.target.value)}
                  placeholder="Justifica por qué esta actividad tiene este nivel de materialidad"
                />
              </label>
            </div>

            <div className={styles.gridRisk}>
              <label className={styles.field}>
                <span>Impacto</span>
                <select
                  className={styles.select}
                  value={item.inherent_impact ?? ''}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    setField(item.tempId, 'inherent_impact', Number.isFinite(n) ? n : null);
                  }}
                >
                  <option value="">Seleccione...</option>
                  {impactCatalog.map((option) => (
                    <option key={option.id} value={option.baseValue}>
                      {option.name} ({option.baseValue})
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.field}>
                <span>Probabilidad</span>
                <select
                  className={styles.select}
                  value={item.inherent_probability ?? ''}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    setField(item.tempId, 'inherent_probability', Number.isFinite(n) ? n : null);
                  }}
                >
                  <option value="">Seleccione...</option>
                  {probabilityCatalog.map((option) => (
                    <option key={option.id} value={option.baseValue}>
                      {option.name} ({option.baseValue})
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.field}>
                <span>Nivel de materialidad</span>
                <input
                  className={styles.input}
                  value={item.materiality_level.toUpperCase()}
                  readOnly
                />
              </label>
              <label className={styles.field}>
                <span>Riesgo inherente calculado</span>
                <input
                  className={styles.input}
                  value={item.inherent_risk_score == null ? '' : item.inherent_risk_score.toFixed(4)}
                  readOnly
                  placeholder="f(probabilidad, impacto)"
                />
              </label>
            </div>
          </div>
        ))}
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.footer}>
        <div className={styles.footerLeft}>
          <button type="button" className={styles.addButton} onClick={addItem}>
            <Plus size={16} />
            Agregar actividad
          </button>
        </div>
        <div className={styles.footerRight}>
          <button className={styles.backButton} onClick={onBack}>Volver</button>
          <button className={styles.ghostButton} onClick={handleSave}>Guardar</button>
          <button className={styles.primaryButton} onClick={handleNext}>Continuar</button>
        </div>
      </div>
    </div>
  );
}
