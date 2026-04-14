'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronDown, Flame, Plus, Trash2 } from 'lucide-react';
import styles from './SignificantActivitiesStep.module.css';
import RiskHeatmapModal from './RiskHeatmapModal';

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
  catalog_impact_id?: string | null;
  catalog_probability_id?: string | null;
  probability_name?: string | null;
  probability_value?: number | null;
  impact_name?: string | null;
  impact_value?: number | null;
};

type ControlItem = {
  id: string;
  name: string;
  description?: string | null;
};

type Props = {
  items: SignificantActivityDraftItem[];
  mitigationByRiskKey: Record<string, { controlId: string; coveragePct: number }>;
  probabilityCatalog: ScaleOption[];
  impactCatalog: ScaleOption[];
  catalogActivities: SignificantActivityCatalogOption[];
  loadingCatalog: boolean;
  onChange: (next: SignificantActivityDraftItem[]) => void;
  onChangeMitigationByRiskKey: (next: Record<string, { controlId: string; coveragePct: number }>) => void;
  onOpenCreateActivity: (tempId: string) => void;
  onBack: () => void;
  onNext: () => void | Promise<void>;
  onSave: () => void | Promise<void>;
};

const round6 = (value: number) => Math.round(value * 1_000_000) / 1_000_000;

function computeInherentRisk(probability: number | null, impact: number | null) {
  if (probability == null || impact == null) return null;
  return round6(probability * impact);
}

function computeRiskValue(probability: number | null | undefined, impact: number | null | undefined) {
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
  mitigationByRiskKey = {},
  probabilityCatalog,
  impactCatalog,
  catalogActivities,
  loadingCatalog,
  onChange,
  onChangeMitigationByRiskKey,
  onOpenCreateActivity,
  onBack,
  onNext,
  onSave,
}: Props) {
  const [error, setError] = useState<string | null>(null);
  const [comboSearchByRow, setComboSearchByRow] = useState<Record<string, string>>({});
  const [comboOpenByRow, setComboOpenByRow] = useState<Record<string, boolean>>({});
  const [riskOptionsByActivity, setRiskOptionsByActivity] = useState<Record<string, ActivityRiskOption[]>>({});
  const [riskOptionsLoadingByActivity, setRiskOptionsLoadingByActivity] = useState<Record<string, boolean>>({});
  const [riskOptionsLoadedByActivity, setRiskOptionsLoadedByActivity] = useState<Record<string, boolean>>({});
  const [controlsByRisk, setControlsByRisk] = useState<Record<string, ControlItem[]>>({});
  const [isHeatmapOpen, setIsHeatmapOpen] = useState(false);

  const normalizedItems = useMemo(() => buildCanonicalItems(items), [items]);

  const catalogMap = useMemo(() => {
    const map = new Map<string, SignificantActivityCatalogOption>();
    catalogActivities.forEach((item) => map.set(item.id, item));
    return map;
  }, [catalogActivities]);

  const probabilityById = useMemo(() => {
    const map = new Map<string, number>();
    probabilityCatalog.forEach((item) => map.set(String(item.id), Number(item.baseValue)));
    return map;
  }, [probabilityCatalog]);

  const impactById = useMemo(() => {
    const map = new Map<string, number>();
    impactCatalog.forEach((item) => map.set(String(item.id), Number(item.baseValue)));
    return map;
  }, [impactCatalog]);

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

    const invalidIndex = normalizedItems.findIndex((item) => !item.significant_activity_id);

    if (invalidIndex >= 0) {
      setError(`Fila ${invalidIndex + 1}: completa actividad.`);
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

  const ensureRisksForActivity = useCallback(async (significantActivityId: string, force = false) => {
    if (!significantActivityId) return;
    if (!force && riskOptionsLoadedByActivity[significantActivityId]) return;
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
      setRiskOptionsLoadedByActivity((prev) => ({ ...prev, [significantActivityId]: true }));
    }
  }, [riskOptionsLoadedByActivity]);

  useEffect(() => {
    const ids = Array.from(
      new Set(
        normalizedItems
          .map((item) => item.significant_activity_id || '')
          .filter((id): id is string => Boolean(id))
      )
    );

    ids.forEach((id) => {
      if (riskOptionsLoadedByActivity[id] || riskOptionsLoadingByActivity[id]) return;
      void ensureRisksForActivity(id);
    });
  }, [normalizedItems, riskOptionsLoadedByActivity, riskOptionsLoadingByActivity, ensureRisksForActivity]);

  useEffect(() => {
    const handleFocusRefresh = () => {
      const ids = Array.from(
        new Set(
          normalizedItems
            .map((item) => item.significant_activity_id || '')
            .filter((id): id is string => Boolean(id))
        )
      );

      ids.forEach((id) => {
        void ensureRisksForActivity(id, true);
      });
    };

    window.addEventListener('focus', handleFocusRefresh);
    return () => window.removeEventListener('focus', handleFocusRefresh);
  }, [normalizedItems, ensureRisksForActivity]);

  useEffect(() => {
    const riskIds = Array.from(
      new Set(
        Object.values(riskOptionsByActivity)
          .flat()
          .map((risk) => risk.id)
          .filter(Boolean)
      )
    );

    if (riskIds.length === 0) {
      setControlsByRisk({});
      return;
    }

    const loadControls = async () => {
      const res = await fetch('/api/linear-risk/catalog/controls-by-risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ riskIds }),
      });
      if (!res.ok) {
        setControlsByRisk({});
        return;
      }
      const data = await res.json().catch(() => ({}));
      setControlsByRisk(data?.byRisk || {});
    };

    void loadControls();
  }, [riskOptionsByActivity]);

  const riskKey = (activityId: string, riskId: string) => `${activityId}::${riskId}`;

  const getMitigation = (activityId: string, riskId: string) =>
    (mitigationByRiskKey || {})[riskKey(activityId, riskId)] || { controlId: '', coveragePct: 0 };

  const setMitigation = (activityId: string, riskId: string, patch: Partial<{ controlId: string; coveragePct: number }>) => {
    const key = riskKey(activityId, riskId);
    onChangeMitigationByRiskKey?.((() => {
      const prev = mitigationByRiskKey || {};
      const current = prev[key] || { controlId: '', coveragePct: 0 };
      const nextCoverage = Number.isFinite(Number(patch.coveragePct))
        ? Math.min(100, Math.max(0, Math.round(Number(patch.coveragePct))))
        : current.coveragePct;
      return {
        ...prev,
        [key]: {
          controlId: patch.controlId !== undefined ? patch.controlId : current.controlId,
          coveragePct: nextCoverage,
        },
      };
    })());
  };

  const heatmapRows = useMemo(() => {
    const rows: Array<{
      rowId: string;
      elementName: string | null;
      customElementName: string | null;
      riskName: string | null;
      probability: number | null;
      impact: number | null;
      baseScore: number | null;
      riskScore: number | null;
      mitigatingControlName: string | null;
      mitigationLevel: string | null;
      inherentScale: null;
      residualScale: null;
    }> = [];

    normalizedItems.forEach((item) => {
      const activityId = item.significant_activity_id;
      if (!activityId) return;
      const risks = riskOptionsByActivity[activityId] || [];
      risks.forEach((risk) => {
        const probabilityValue =
          risk.probability_value != null
            ? Number(risk.probability_value)
            : (risk.catalog_probability_id ? probabilityById.get(String(risk.catalog_probability_id)) ?? null : null);
        const impactValue =
          risk.impact_value != null
            ? Number(risk.impact_value)
            : (risk.catalog_impact_id ? impactById.get(String(risk.catalog_impact_id)) ?? null : null);
        const value = computeRiskValue(probabilityValue, impactValue);
        const mitigation = getMitigation(activityId, risk.id);
        const residualValue = value == null ? null : Number((value * (1 - mitigation.coveragePct / 100)).toFixed(6));
        const selectedControl = (controlsByRisk[risk.id] || []).find((c) => c.id === mitigation.controlId) || null;

        rows.push({
          rowId: `${activityId}::${risk.id}`,
          elementName: item.activity_name || null,
          customElementName: null,
          riskName: risk.risk_name || null,
          probability: probabilityValue,
          impact: impactValue,
          baseScore: value,
          riskScore: residualValue,
          mitigatingControlName: selectedControl?.name || null,
          mitigationLevel: mitigation.coveragePct > 0 ? 'PARCIAL' : null,
          inherentScale: null,
          residualScale: null,
        });
      });
    });

    return rows;
  }, [normalizedItems, riskOptionsByActivity, probabilityById, impactById, mitigationByRiskKey, controlsByRisk]);

  const handleHeatmapClick = () => {
    if (heatmapRows.length === 0) {
      setError('No hay filas para mostrar en el mapa de calor.');
      return;
    }
    setError(null);
    setIsHeatmapOpen(true);
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

            <div className={styles.associatedRiskCard}>
              <div className={styles.associatedRiskTitle}>Riesgos asociados a esta actividad</div>
              {!item.significant_activity_id ? (
                <div className={styles.associatedRiskEmpty}>Selecciona una actividad para visualizar sus riesgos asociados.</div>
              ) : riskOptionsLoadingByActivity[item.significant_activity_id] ? (
                <div className={styles.associatedRiskEmpty}>Cargando riesgos asociados...</div>
              ) : (riskOptionsByActivity[item.significant_activity_id] || []).length === 0 ? (
                <div className={styles.associatedRiskEmpty}>No hay riesgos asociados a esta actividad.</div>
              ) : (
                <div className={styles.associatedRiskTableWrap}>
                  <table className={styles.associatedRiskTable}>
                    <thead>
                      <tr>
                        <th>Título</th>
                        <th>Descripción</th>
                        <th>Impacto</th>
                        <th>Probabilidad</th>
                        <th>Valor</th>
                        <th>Control mitigante</th>
                        <th>% Cobertura</th>
                        <th>Riesgo residual</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const activityId = item.significant_activity_id as string;
                        return (riskOptionsByActivity[activityId] || []).map((risk) => {
                        const probabilityValue =
                          risk.probability_value != null
                            ? Number(risk.probability_value)
                            : (risk.catalog_probability_id ? probabilityById.get(String(risk.catalog_probability_id)) ?? null : null);
                        const impactValue =
                          risk.impact_value != null
                            ? Number(risk.impact_value)
                            : (risk.catalog_impact_id ? impactById.get(String(risk.catalog_impact_id)) ?? null : null);
                        const value = computeRiskValue(probabilityValue, impactValue);
                        const mitigation = getMitigation(activityId, risk.id);
                        const residualValue = value == null ? null : Number((value * (1 - mitigation.coveragePct / 100)).toFixed(6));
                        const controlOptions = controlsByRisk[risk.id] || [];
                        return (
                          <tr key={risk.id}>
                            <td>{risk.risk_name || '—'}</td>
                            <td className={styles.associatedRiskDescription}>{risk.risk_description || '—'}</td>
                            <td>{impactValue == null ? '—' : impactValue.toFixed(2)}</td>
                            <td>{probabilityValue == null ? '—' : probabilityValue.toFixed(2)}</td>
                            <td>{value == null ? '—' : value.toFixed(4)}</td>
                            <td>
                              <select
                                className={styles.associatedRiskSelect}
                                value={mitigation.controlId}
                                onChange={(event) =>
                                  setMitigation(activityId, risk.id, { controlId: event.target.value })
                                }
                              >
                                <option value="">Seleccione...</option>
                                {controlOptions.map((control) => (
                                  <option key={`${risk.id}-${control.id}`} value={control.id}>
                                    {control.name}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <input
                                type="number"
                                min={0}
                                max={100}
                                className={styles.associatedRiskCoverage}
                                value={mitigation.coveragePct}
                                onChange={(event) =>
                                  setMitigation(activityId, risk.id, {
                                    coveragePct: Number(event.target.value),
                                  })
                                }
                              />
                            </td>
                            <td>{residualValue == null ? '—' : residualValue.toFixed(4)}</td>
                          </tr>
                        );
                      });
                      })()}
                    </tbody>
                  </table>
                </div>
              )}
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
          <button className={styles.heatmapButton} onClick={handleHeatmapClick} type="button">
            <Flame size={16} /> Mapa de calor
          </button>
          <button className={styles.primaryButton} onClick={handleNext}>Continuar</button>
        </div>
      </div>

      <RiskHeatmapModal
        open={isHeatmapOpen}
        rows={heatmapRows}
        onClose={() => setIsHeatmapOpen(false)}
      />
    </div>
  );
}
