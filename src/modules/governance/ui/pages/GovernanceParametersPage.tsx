import React from 'react';
import {
    Calculator,
    ChevronRight,
    Clock,
    ArrowLeft,
    Database,
    Hash,
    ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import { Prisma } from '@prisma/client';
import styles from './ParametrosPage.module.css';
import { GovernanceCloseButton } from '@/shared/ui/GovernanceCloseButton';

type ActiveProfile = {
    id: string;
    code: string;
    name: string | null;
    activated_at: string | null;
    version_no: number | null;
    info: any | null;
};

type ParameterRow = {
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

type SnapshotRow = {
    profile_code: string | null;
    release_version: string | null;
    parameters_hash: string | null;
    created_at: string | null;
};

function formatValue(param: ParameterRow): string {
    if (param.data_type_code === 'BOOLEAN') {
        return param.boolean_value === null ? '—' : param.boolean_value ? 'Sí' : 'No';
    }
    if (param.data_type_code === 'TEXT') {
        return param.text_value ?? '—';
    }
    if (param.data_type_code === 'JSONB') {
        return param.jsonb_value ? JSON.stringify(param.jsonb_value) : '—';
    }
    if (param.numeric_value !== null && param.numeric_value !== undefined) {
        return Number(param.numeric_value).toFixed(4);
    }
    return param.default_numeric !== null && param.default_numeric !== undefined
        ? `${Number(param.default_numeric).toFixed(4)} (seed)`
        : '—';
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
            interactions: asText(info.interactions),
            usage: asText(info.usage),
            audit: asText(info.audit),
        };
    }
    return null;
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

export default async function ParametrosPage() {
    const prisma = (await import('@/lib/prisma')).default;

    const activeProfiles = await (prisma as any).$queryRaw(Prisma.sql`
        SELECT id, code, name, activated_at, version_no, info
        FROM governance.profile
        WHERE is_active = true
        LIMIT 1
    `) as ActiveProfile[];
    const activeProfile = activeProfiles[0] ?? null;

    const parameters = activeProfile
        ? await (prisma as any).$queryRaw(Prisma.sql`
              SELECT
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
              FROM governance.profile_parameter_value ppv
              JOIN governance.parameter_definition pd
                ON pd.id = ppv.parameter_definition_id
              WHERE ppv.profile_id = ${activeProfile.id}::uuid
              ORDER BY pd.group_code NULLS LAST, pd.sort_order NULLS LAST, pd.code
          `) as ParameterRow[]
        : [];

    const snapshots = await (prisma as any).$queryRaw(Prisma.sql`
        SELECT profile_code, release_version, parameters_hash, created_at
        FROM governance.profile_snapshot
        ORDER BY created_at DESC
        LIMIT 20
    `) as SnapshotRow[];

    const grouped = parameters.reduce<Record<string, ParameterRow[]>>((acc, row) => {
        const key = row.group_code || 'GENERAL';
        acc[key] = acc[key] || [];
        acc[key].push(row);
        return acc;
    }, {});

    return (
            <div className="animate-fade-in">
                <GovernanceCloseButton />
                <div className="section-header">
                    <Link href="/admin" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--muted)', textDecoration: 'none', fontSize: '0.9rem', marginRight: '1rem' }}>
                        <ArrowLeft size={16} /> Volver
                    </Link>
                    <Calculator className="text-primary" size={24} />
                    <h1 className="gradient-text" style={{ fontSize: '2rem', margin: 0 }}>Sistema estructural de parámetros</h1>
                </div>

                <div className="glass-card" style={{
                    padding: '2.5rem',
                    marginBottom: '2.5rem',
                    width: '100%',
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(15, 23, 42, 0.2))',
                    border: '1px solid rgba(16, 185, 129, 0.35)'
                }}>
                    <p style={{ color: 'var(--foreground)', margin: 0, fontSize: '1.25rem', lineHeight: '1.8' }}>
                        Defina la lógica matemática inmutable del motor. Configure pesos Wi, constantes de calibración y gatillos
                        que se congelan al ejecutar cada ModelRun para garantizar la defensa institucional.
                    </p>
                </div>

                <div className={styles.topGrid}>

                    {/* Left Column: Parameter Sets List */}
                    <div className="glass-card" style={{ padding: '1.75rem', height: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
                            <h2 style={{ fontSize: '1.3rem', margin: 0, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Clock className="text-primary" size={22} /> Historial de Versiones
                            </h2>
                            <Link href="/modelo/parametros/nueva-version" className="btn-primary" style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem', fontWeight: 600 }}>
                                + Nueva Versión
                            </Link>
                        </div>

                        <div style={{ display: 'grid', gap: '1.25rem' }}>
                            {snapshots.map((snapshot, index) => (
                                <div key={`${snapshot.profile_code ?? 'snapshot'}-${snapshot.created_at ?? index}`} className="sidebar-link" style={{
                                    padding: '1.25rem',
                                    borderRadius: '12px',
                                    background: 'rgba(0,0,0,0.2)',
                                    border: '1px solid var(--glass-border)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    transition: 'all 0.2s ease',
                                    cursor: 'pointer',
                                    margin: 0
                                }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.4rem' }}>
                                            <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--foreground)' }}>
                                                {snapshot.release_version || snapshot.profile_code || 'Snapshot'}
                                            </span>
                                            <div style={{
                                                fontSize: '0.65rem',
                                                padding: '0.2rem 0.6rem',
                                                borderRadius: '6px',
                                                background: snapshot.profile_code === activeProfile?.code ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                                                color: snapshot.profile_code === activeProfile?.code ? 'var(--accent)' : 'var(--muted)',
                                                border: '1px solid currentColor',
                                                fontWeight: 700,
                                                textTransform: 'uppercase'
                                            }}>
                                                {snapshot.profile_code === activeProfile?.code ? 'Activo' : 'Histórico'}
                                            </div>
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>
                                            {snapshot.profile_code || 'Perfil sin código'} · {snapshot.created_at ? new Date(snapshot.created_at).toLocaleDateString() : '—'}
                                        </div>
                                        {snapshot.parameters_hash && (
                                            <div style={{ fontSize: '0.65rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'monospace', opacity: 0.8 }}>
                                                <Hash size={10} /> {snapshot.parameters_hash.substring(0, 24)}...
                                            </div>
                                        )}
                                    </div>
                                    <ChevronRight size={18} className="text-muted" style={{ opacity: 0.5 }} />
                                </div>
                            ))}
                            {snapshots.length === 0 && (
                                <div className="glass-card" style={{ padding: '1rem', fontSize: '0.9rem', color: 'var(--muted)' }}>
                                    Aún no hay snapshots registrados.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Engine Parameters (Current Active Summary) */}
                    <div className="glass-card" style={{ padding: '1.75rem', height: '100%' }}>
                        <h3 style={{ fontSize: '1.15rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600 }}>
                            <Database className="text-secondary" size={20} /> Perfil Activo del Motor
                        </h3>
                        {!activeProfile && (
                            <div className="glass-card" style={{ padding: '1rem', border: '1px solid rgba(244, 63, 94, 0.35)', background: 'rgba(244,63,94,0.08)' }}>
                                <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>No hay perfil activo</div>
                                <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                                    Activa un perfil en `governance.profile` para visualizar parámetros.
                                </div>
                            </div>
                        )}
                        {activeProfile && (
                            <div style={{ display: 'grid', gap: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                    <div>
                                        <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent)', marginBottom: '0.25rem' }}>{activeProfile.code}</div>
                                        <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{activeProfile.name || 'Perfil oficial de calibración'}</div>
                                        <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Clock size={14} /> Activado: {activeProfile.activated_at ? new Date(activeProfile.activated_at).toLocaleDateString() : '—'}
                                        </div>
                                        {activeProfile.info && (() => {
                                            const info = extractInfo(activeProfile.info);
                                            if (!info) return null;
                                            return (
                                                <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--muted)', borderLeft: '3px solid var(--accent)' }}>
                                                    {info.summary && <div>{info.summary}</div>}
                                                    {info.audit && <div style={{ marginTop: '0.5rem' }}>{info.audit}</div>}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                    <div style={{ padding: '0.5rem', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent)' }}>
                                        <ShieldCheck size={24} />
                                    </div>
                                </div>

                                <div className="glass-card" style={{ padding: '1.25rem', background: 'rgba(59, 130, 246, 0.03)', border: '1px solid rgba(59, 130, 246, 0.15)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.25rem' }}>Snapshot del Sistema</div>
                                            <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>Congele los parámetros actuales para auditoría.</div>
                                        </div>
                                        <form action="/api/params/snapshot" method="POST">
                                            <button className="btn-primary" style={{ padding: '0.55rem 1rem', fontSize: '0.85rem' }} disabled={!activeProfile}>
                                                Crear Snapshot
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom Section: Full Width Parameters Table */}
                <div className={styles.bottomSection}>
                    {activeProfile && Object.entries(grouped).map(([group, rows]) => (
                        <div key={group} className="glass-card" style={{ padding: '2rem' }}>
                            <div className={styles.groupTitle}>
                                {group.replace(/_/g, ' ')}
                            </div>

                            <div style={{ overflow: 'hidden', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.1)' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                                            <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.8rem', letterSpacing: '0.06em', color: 'var(--muted)', textTransform: 'uppercase' }}>Parámetro</th>
                                            <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.8rem', letterSpacing: '0.06em', color: 'var(--muted)', textTransform: 'uppercase' }}>Definición y Rango</th>
                                            <th style={{ textAlign: 'right', padding: '1rem 1.5rem', fontSize: '0.8rem', letterSpacing: '0.06em', color: 'var(--muted)', textTransform: 'uppercase' }}>Valor Actual</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map((param) => (
                                            <tr key={param.code} style={{ borderTop: '1px solid var(--glass-border)' }}>
                                                <td style={{ padding: '1.25rem 1.5rem', verticalAlign: 'top' }}>
                                                    <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--foreground)' }}>
                                                        {param.code}
                                                    </div>
                                                    {formatUnit(param) && (
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--primary)', marginTop: '0.25rem', fontWeight: 600 }}>
                                                            Unidad: {formatUnit(param)}
                                                        </div>
                                                    )}
                                                </td>
                                                <td style={{ padding: '1.25rem 1.5rem' }}>
                                                    <div style={{ color: 'var(--foreground)', fontSize: '0.95rem', marginBottom: '0.6rem', lineHeight: '1.5', opacity: 0.9 }}>
                                                        {param.description || param.name || 'Sin descripción registrada.'}
                                                    </div>
                                                    {param.info && (() => {
                                                        const info = extractInfo(param.info);
                                                        if (!info) return null;
                                                        return (
                                                            <div style={{ color: 'var(--muted)', fontSize: '0.82rem', lineHeight: '1.6', marginBottom: '0.75rem' }}>
                                                                {info.summary && <div>{info.summary}</div>}
                                                                {info.impact && <div><strong>Impacto:</strong> {info.impact}</div>}
                                                                {info.formula && <div><strong>Fórmula:</strong> {info.formula}</div>}
                                                                {info.constraints && <div><strong>Reglas:</strong> {info.constraints}</div>}
                                                                {info.interactions && <div><strong>Interacciones:</strong> {info.interactions}</div>}
                                                            </div>
                                                        );
                                                    })()}
                                                    <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.75rem', color: 'var(--muted)' }}>
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                            <span style={{ fontWeight: 700 }}>MIN:</span> {param.min_numeric !== null ? Number(param.min_numeric).toString() : '—'}
                                                        </span>
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                            <span style={{ fontWeight: 700 }}>MAX:</span> {param.max_numeric !== null ? Number(param.max_numeric).toString() : '—'}
                                                        </span>
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                            <span style={{ fontWeight: 700 }}>TIPO:</span> {param.data_type_code || 'NUMERIC'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right', verticalAlign: 'middle' }}>
                                                    <div className={styles.paramValueBadge}>{formatValue(param)}</div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
    );
}


