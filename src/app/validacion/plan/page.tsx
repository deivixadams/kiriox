"use client";

import React, { useMemo, useState } from 'react';
import {
    ClipboardList,
    Plus,
    Search,
    Calendar,
    LayoutGrid,
    ChevronRight,
    FileText,
    ShieldCheck,
    Clock,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';

// Dummy data for Audit Plans
const DUMMY_PLANS = [
    {
        id: "PLN-2026-001",
        name: "Plan Anual de Cumplimiento AML 2026",
        entity: "Corporate Banking Division",
        framework: "AML/CFT Standard",
        date: "2026-01-15",
        status: "En Ejecución",
        progress: 65,
        priority: "Alta"
    },
    {
        id: "PLN-2026-002",
        name: "Auditoría de Corresponsalía Transaccional",
        entity: "International Operations",
        framework: "FATF 40 Recommendations",
        date: "2026-02-20",
        status: "Planificado",
        progress: 10,
        priority: "Crítica"
    },
    {
        id: "PLN-2026-003",
        name: "Revisión de Debida Diligencia (KYC/CDD)",
        entity: "Retail Retail Segment",
        framework: "Local Regulation 155-17",
        date: "2026-03-05",
        status: "Finalizado",
        progress: 100,
        priority: "Media"
    },
    {
        id: "PLN-2026-004",
        name: "Validación de Segmentación de Clientes",
        entity: "Risk Management Unit",
        framework: "Internal Risk Policy",
        date: "2026-04-12",
        status: "Pendiente",
        progress: 0,
        priority: "Alta"
    }
];

export default function AuditPlanPage() {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredPlans = useMemo(() => {
        const term = searchQuery.trim().toLowerCase();
        if (!term) return DUMMY_PLANS;
        return DUMMY_PLANS.filter((plan) => {
            return plan.name.toLowerCase().includes(term) || 
                   plan.entity.toLowerCase().includes(term) ||
                   plan.id.toLowerCase().includes(term);
        });
    }, [searchQuery]);

    return (
        <div style={{ padding: '2rem' }} className="animate-in fade-in duration-500">
            {/* Header Area */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.2) 100%)',
                        padding: '1rem',
                        borderRadius: '1.25rem',
                        border: '1px solid rgba(16, 185, 129, 0.3)'
                    }}>
                        <ClipboardList size={32} className="text-emerald-500" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.02em', margin: 0 }}>Planificación de Auditoría</h1>
                        <p style={{ color: '#71717a', fontSize: '1rem', marginTop: '0.25rem' }}>Estrategia y cronograma de actividades de validación regulatoria.</p>
                    </div>
                </div>

                <button
                    className="btn-primary"
                    style={{
                        padding: '0.85rem 1.75rem',
                        borderRadius: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        boxShadow: '0 8px 16px -4px rgba(16, 185, 129, 0.4)',
                        fontWeight: 800,
                        fontSize: '0.95rem',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer'
                    }}
                >
                    <Plus size={20} /> Crear Nuevo Plan
                </button>
            </div>

            {/* Stats Overview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
                {[
                    { label: 'Planes Totales', value: '12', icon: FileText, color: '#3b82f6' },
                    { label: 'En Ejecución', value: '3', icon: Clock, color: '#f59e0b' },
                    { label: 'Finalizados (YTD)', value: '8', icon: CheckCircle2, color: '#10b981' },
                    { label: 'Prioridad Crítica', value: '2', icon: AlertCircle, color: '#ef4444' }
                ].map((stat) => (
                    <div key={stat.label} className="glass-card" style={{ padding: '1.5rem', borderRadius: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</div>
                            <stat.icon size={18} style={{ color: stat.color }} />
                        </div>
                        <div style={{ fontSize: '2.25rem', fontWeight: 900, color: 'white', marginTop: '0.75rem' }}>{stat.value}</div>
                    </div>
                ))}
            </div>

            {/* Assessment Inventory */}
            <div className="glass-card" style={{ padding: '2rem', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <LayoutGrid size={20} className="text-muted" />
                        <h3 style={{ fontWeight: 800, fontSize: '1.25rem', margin: 0 }}>Cronograma de Planes</h3>
                    </div>
                    <div style={{ position: 'relative', width: '350px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#71717a' }} />
                        <input
                            type="text"
                            placeholder="Buscar planes o entidades..."
                            className="glass-input"
                            style={{ paddingLeft: '3rem', width: '100%', borderRadius: '0.75rem' }}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {filteredPlans.map((plan) => (
                        <div
                            key={plan.id}
                            className="audit-row"
                            style={{
                                padding: '1.25rem 1.5rem',
                                borderRadius: '1rem',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.05)',
                                display: 'grid',
                                gridTemplateColumns: '2.5fr 1.5fr 1fr 1fr 1.2fr 40px',
                                alignItems: 'center',
                                transition: 'all 0.2s ease',
                                cursor: 'pointer'
                            }}
                        >
                            <div>
                                <div style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 700, marginBottom: '0.25rem' }}>{plan.id}</div>
                                <div style={{ fontWeight: 800, color: 'white', fontSize: '1.05rem' }}>{plan.name}</div>
                                <div style={{ fontSize: '0.85rem', color: '#71717a', marginTop: '0.2rem' }}>{plan.entity}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.85rem', color: '#a1a1aa' }}>Marco Normativo</div>
                                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'white' }}>{plan.framework}</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '0.85rem', color: '#a1a1aa', marginBottom: '0.25rem' }}>Fecha Inicio</div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: '#e4e4e7', fontSize: '0.9rem' }}>
                                    <Calendar size={14} className="text-muted" />
                                    {plan.date}
                                </div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '0.85rem', color: '#a1a1aa', marginBottom: '0.5rem' }}>Progreso</div>
                                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', position: 'relative' }}>
                                    <div style={{ 
                                        width: `${plan.progress}%`, 
                                        height: '100%', 
                                        background: plan.progress === 100 ? '#10b981' : '#3b82f6', 
                                        borderRadius: '3px',
                                        boxShadow: plan.progress > 0 ? '0 0 10px rgba(59, 130, 246, 0.4)' : 'none'
                                    }} />
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#a1a1aa', marginTop: '0.4rem' }}>{plan.progress}%</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <span className={`status-pill ${
                                    plan.status === 'Finalizado' ? 'status-success' : 
                                    plan.status === 'En Ejecución' ? 'status-primary' : 
                                    'status-muted'
                                }`}>
                                    {plan.status}
                                </span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <ChevronRight size={20} className="text-muted" />
                            </div>
                        </div>
                    ))}
                </div>

                {filteredPlans.length === 0 && (
                    <div style={{ padding: '6rem 0', textAlign: 'center', opacity: 0.5 }}>
                        <ClipboardList size={64} style={{ margin: '0 auto 1.5rem auto', display: 'block' }} />
                        <p style={{ fontSize: '1.1rem' }}>No se encontraron planes que coincidan con la búsqueda.</p>
                    </div>
                )}
            </div>

            <style jsx>{`
                .audit-row:hover {
                    background: rgba(255,255,255,0.07) !important;
                    border-color: rgba(16, 185, 129, 0.3) !important;
                    transform: translateX(4px);
                }
                .status-pill {
                    padding: 0.4rem 0.75rem;
                    border-radius: 2rem;
                    font-size: 0.75rem;
                    font-weight: 800;
                    text-transform: uppercase;
                }
                .status-primary { background: rgba(59, 130, 246, 0.15); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.2); }
                .status-success { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.2); }
                .status-muted { background: rgba(156, 163, 175, 0.15); color: #d1d5db; border: 1px solid rgba(156, 163, 175, 0.2); }
            `}</style>
        </div>
    );
}
