import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ClipboardEdit, ShieldCheck } from 'lucide-react';
import { Prisma } from '@prisma/client';
import ParametrosGate from '../ParametrosGate';
import ParamValueInput from './ParamValueInput';
import styles from './NuevaVersion.module.css';

type ActiveProfile = {
    id: string;
    code: string;
    name: string | null;
    version_no: number | null;
    activated_at: string | null;
};

type ParameterRow = {
    id: string;
    code: string;
    name: string | null;
    description: string | null;
    info: any | null;
    group_code: string | null;
    data_type_code: string | null;
    numeric_value: number | null;
    boolean_value: boolean | null;
    text_value: string | null;
    jsonb_value: any | null;
    default_numeric: number | null;
    min_numeric: number | null;
    max_numeric: number | null;
    unit: string | null;
};

function toNumber(value: unknown): number | null {
    if (value === null || value === undefined) return null;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
}

const UNIT_LABELS: Record<string, string> = {
    alpha: 'Concentración',
    beta: 'Interdependencia',
    gamma: 'Curvatura',
    eta: 'Mezcla Experto/Grafo',
    w_D: 'Diseño',
    w_F: 'Formalización',
    w_O: 'Operación',
    w_P: 'Pruebas',
    w_S: 'Evidencia'
};

function formatUnit(param: ParameterRow): string | null {
    if (param.code in UNIT_LABELS) {
        return UNIT_LABELS[param.code];
    }
    return param.unit ?? null;
}

function asText(value: unknown): string | null {
    if (value === null || value === undefined) return null;
    if (typeof value === 'string') return value;
    return null;
}

function extractInfo(info: any) {
    if (!info) return null;
    if (typeof info === 'string') {
        return { summary: info };
    }
    if (typeof info === 'object') {
        return {
            summary: asText(info.summary),
            impact: asText(info.impact),
            formula: asText(info.formula),
            constraints: asText(info.constraints),
            interactions: asText(info.interactions)
        };
    }
    return null;
}

export default async function NuevaVersionPage() {
    const prisma = (await import('@/lib/prisma')).default;
    const activeProfiles = await (prisma as any).$queryRaw(Prisma.sql`
        SELECT id, code, name, version_no, activated_at
        FROM params.profile
        WHERE is_active = true
        LIMIT 1
    `) as ActiveProfile[];
    const activeProfile = activeProfiles[0] ?? null;

    const parameters = activeProfile
        ? await (prisma as any).$queryRaw(Prisma.sql`
              SELECT
                  pd.id,
                  pd.code,
                  pd.name,
                  pd.description,
                  pd.group_code,
                  pd.data_type_code,
                  pd.default_numeric,
                  pd.min_numeric,
                  pd.max_numeric,
                  pd.unit,
                  ppv.numeric_value,
                  ppv.boolean_value,
                  ppv.text_value,
                  ppv.jsonb_value,
                  pd.info
              FROM params.profile_parameter_value ppv
              JOIN params.parameter_definition pd
                ON pd.id = ppv.parameter_definition_id
              WHERE ppv.profile_id = ${activeProfile.id}::uuid
              ORDER BY pd.group_code NULLS LAST, pd.sort_order NULLS LAST, pd.code
          `) as ParameterRow[]
        : [];

    const grouped = parameters.reduce<Record<string, ParameterRow[]>>((acc, row) => {
        const key = row.group_code || 'GENERAL';
        acc[key] = acc[key] || [];
        acc[key].push(row);
        return acc;
    }, {});

    const nextVersion = (activeProfile?.version_no ?? 0) + 1;
    const defaultCode = activeProfile
        ? `${activeProfile.code}_V${nextVersion}`
        : `CRE_PROFILE_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;

    return (
        <ParametrosGate>
            <div className="animate-fade-in">
                <div className="section-header">
                    <Link href="/modelo/parametros" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--muted)', textDecoration: 'none', fontSize: '0.9rem', marginRight: '1rem' }}>
                        <ArrowLeft size={16} /> Volver
                    </Link>
                    <ClipboardEdit className="text-primary" size={24} />
                    <h1 className="gradient-text" style={{ fontSize: '2rem', margin: 0 }}>Nueva versión de parámetros</h1>
                </div>

                <div className={styles.hero}>
                    <div>
                        <div className={styles.heroTitle}>Control de versión y snapshot</div>
                        <p className={styles.heroText}>
                            Ajusta los valores del motor, congela el snapshot y deja trazabilidad de esta calibración.
                            El histórico quedará disponible para auditoría y selección en futuros ModelRuns.
                        </p>
                    </div>
                    <div className={styles.heroBadge}>
                        <ShieldCheck size={18} /> Snapshot inmutable
                    </div>
                </div>

                {!activeProfile && (
                    <div className="glass-card" style={{ padding: '1rem', border: '1px solid rgba(244, 63, 94, 0.35)', background: 'rgba(244,63,94,0.08)' }}>
                        <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>No hay perfil activo</div>
                        <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                            Activa un perfil antes de crear una nueva versión.
                        </div>
                    </div>
                )}

                {activeProfile && (
                    <form action="/api/params/version" method="POST" className={styles.form}>
                        <div className={styles.profileCard}>
                            <div className={styles.profileHeader}>
                                <div>
                                    <div className={styles.profileLabel}>Perfil base</div>
                                    <div className={styles.profileCode}>{activeProfile.code}</div>
                                    <div className={styles.profileMeta}>
                                        Activado: {activeProfile.activated_at ? new Date(activeProfile.activated_at).toLocaleDateString() : '—'}
                                    </div>
                                </div>
                                <div className={styles.profileBadge}>Versión {nextVersion}</div>
                            </div>

                            <div className={styles.profileFields}>
                                <label className={styles.field}>
                                    <span>Código de versión</span>
                                    <input name="profile_code" defaultValue={defaultCode} required />
                                </label>
                                <label className={styles.field}>
                                    <span>Nombre visible</span>
                                    <input name="profile_name" defaultValue={`Perfil ${nextVersion}`} required />
                                </label>
                                <label className={styles.fieldFull}>
                                    <span>Descripción</span>
                                    <textarea name="profile_description" rows={3} placeholder="Describe el propósito de esta calibración." />
                                </label>
                                <label className={styles.checkbox}>
                                    <input type="checkbox" name="activate_profile" />
                                    Activar esta versión al finalizar
                                </label>
                            </div>
                        </div>

                        {Object.entries(grouped).map(([group, rows]) => (
                            <div key={group} className={styles.groupCard}>
                                <div className={styles.groupTitle}>{group.replace(/_/g, ' ')}</div>
                                <div className={styles.tableWrap}>
                                    <table className={styles.table}>
                                        <thead>
                                            <tr>
                                                <th>Parámetro</th>
                                                <th>Definición</th>
                                                <th>Nuevo valor</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rows.map((param) => {
                                                const info = extractInfo(param.info);
                                                const defaultValue = toNumber(param.numeric_value ?? param.default_numeric);
                                                const minValue = toNumber(param.min_numeric);
                                                const maxValue = toNumber(param.max_numeric);
                                                return (
                                                    <tr key={param.code}>
                                                        <td>
                                                            <div className={styles.paramCode}>{param.code}</div>
                                                            {formatUnit(param) && (
                                                                <div className={styles.paramUnit}>Unidad: {formatUnit(param)}</div>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <div className={styles.paramDesc}>
                                                                {param.description || param.name || 'Sin descripción registrada.'}
                                                            </div>
                                                            {info && (
                                                                <div className={styles.paramInfo}>
                                                                    {info.summary && <div>{info.summary}</div>}
                                                                    {info.impact && <div><strong>Impacto:</strong> {info.impact}</div>}
                                                                    {info.formula && <div><strong>Fórmula:</strong> {info.formula}</div>}
                                                                    {info.constraints && <div><strong>Reglas:</strong> {info.constraints}</div>}
                                                                    {info.interactions && <div><strong>Interacciones:</strong> {info.interactions}</div>}
                                                                </div>
                                                            )}
                                                            <div className={styles.paramMeta}>
                                                                <span><strong>MIN:</strong> {param.min_numeric !== null ? Number(param.min_numeric).toString() : '—'}</span>
                                                                <span><strong>MAX:</strong> {param.max_numeric !== null ? Number(param.max_numeric).toString() : '—'}</span>
                                                                <span><strong>TIPO:</strong> {param.data_type_code || 'NUMERIC'}</span>
                                                            </div>
                                                        </td>
                                                        <td className={styles.valueCell}>
                                                            <ParamValueInput
                                                                name={`param_${param.code}`}
                                                                defaultValue={defaultValue}
                                                                min={minValue ?? undefined}
                                                                max={maxValue ?? undefined}
                                                                required
                                                            />
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}

                        <div className={styles.actions}>
                            <Link href="/modelo/parametros" className="ghost-button">
                                Cancelar
                            </Link>
                            <button className="btn-primary" type="submit">
                                Guardar y crear snapshot
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </ParametrosGate>
    );
}
