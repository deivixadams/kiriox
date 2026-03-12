"use client";

import React from 'react';
import { 
    AlertTriangle, 
    ShieldOff, 
    FileWarning, 
    Activity, 
    ChevronRight, 
    ArrowUpRight,
    Search,
    Bug,
    History,
    ShieldAlert
} from 'lucide-react';
import styles from './Alertas.module.css';

const DUMMY_ALERTS = {
    failedTests: [
        { id: "TST-FALL-01", name: "Conciliación de Saldos Operativos", impact: "Alto", date: "Hace 2 horas", area: "Tesorería" },
        { id: "TST-FALL-02", name: "Validación de Firmas Digitales", impact: "Crítico", date: "Hace 5 horas", area: "Operaciones" },
        { id: "TST-FALL-03", name: "Control de Dualidad de Transacciones", impact: "Medio", date: "Ayer", area: "Pagos" }
    ],
    unansweredFindings: [
        { id: "HLZ-2026-10", name: "Falta de Segregación en Core Bancario", overdue: "15 días", severity: "Crítico", source: "Auditoría Interna" },
        { id: "HLZ-2026-14", name: "Excedentes de Límites de Crédito", overdue: "8 días", severity: "Alto", source: "Cumplimiento" },
        { id: "HLZ-2026-18", name: "Respaldo Incompleto de Bases KYC", overdue: "3 días", severity: "Medio", source: "Riesgos" }
    ],
    poorMitigation: [
        { id: "RSK-MIT-05", name: "Filtración de Datos Sensibles", level: 35, exposure: "Crítico", risk: "Operacional" },
        { id: "RSK-MIT-12", name: "Incumplimiento de Reportes FATCA", level: 42, exposure: "Alto", risk: "Legal" },
        { id: "RSK-MIT-08", name: "Continuidad en Canales de Terceros", level: 55, exposure: "Alto", risk: "Tecnológico" }
    ]
};

export default function AlertasPage() {
    return (
        <div className={styles.container}>
            {/* Header Area */}
            <div className={styles.header}>
                <div className={styles.headerTitle}>
                    <div className={styles.iconWrapper}>
                        <AlertTriangle size={32} className="text-red-500" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.02em', margin: 0 }}>Dashboard de Alertas</h1>
                        <p style={{ color: '#71717a', fontSize: '1rem', marginTop: '0.25rem' }}>Monitoreo crítico de fallos técnicos, pendientes de cumplimiento y brechas de mitigación.</p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ position: 'relative', width: '300px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#71717a' }} />
                        <input
                            type="text"
                            placeholder="Buscar alertas activas..."
                            className="glass-input"
                            style={{ paddingLeft: '3rem', width: '100%', borderRadius: '0.75rem' }}
                        />
                    </div>
                    <button className="btn-primary" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #b91d1d 100%)', border: 'none', color: 'white', padding: '0.85rem 1.5rem', borderRadius: '1rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ShieldAlert size={18} /> Protocolo de Acción
                    </button>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className={styles.grid}>
                {/* Section 1: Failed Tests */}
                <div className={styles.sectionCard}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>
                            <Bug className="text-red-500" size={24} />
                            Pruebas Fallidas
                        </h2>
                        <span className={styles.alertCount}>3 Activas</span>
                    </div>

                    <div className={styles.itemList}>
                        {DUMMY_ALERTS.failedTests.map((item) => (
                            <div key={item.id} className={styles.alertItem}>
                                <div className={styles.itemMain}>
                                    <span className={styles.itemLabel}>{item.name}</span>
                                    <span className={`${styles.badge} ${item.impact === 'Crítico' ? styles.badgeHigh : styles.badgeMed}`}>
                                        {item.impact}
                                    </span>
                                </div>
                                <div className={styles.itemMeta}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <History size={12} /> {item.date}
                                    </div>
                                    <span style={{ fontWeight: 700 }}>{item.area}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className={styles.footerAction}>
                        Revisar Log de Pruebas <ArrowUpRight size={16} />
                    </div>
                </div>

                {/* Section 2: Unanswered Findings */}
                <div className={styles.sectionCard}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>
                            <FileWarning className="text-orange-500" size={24} />
                            Hallazgos Pendientes
                        </h2>
                        <span className={styles.alertCount} style={{ background: 'rgba(249, 115, 22, 0.15)', color: '#fb923c', borderColor: 'rgba(249, 115, 22, 0.2)' }}>
                            12 Totales
                        </span>
                    </div>

                    <div className={styles.itemList}>
                        {DUMMY_ALERTS.unansweredFindings.map((item) => (
                            <div key={item.id} className={styles.alertItem}>
                                <div className={styles.itemMain}>
                                    <span className={styles.itemLabel}>{item.name}</span>
                                    <span style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 900 }}>VENCIDO</span>
                                </div>
                                <div className={styles.itemMeta}>
                                    <span style={{ color: '#ef4444', fontWeight: 800 }}>Vence en: {item.overdue}</span>
                                    <span style={{ 
                                        padding: '0.1rem 0.4rem', 
                                        borderRadius: '0.3rem', 
                                        background: 'rgba(255,255,255,0.05)',
                                        fontSize: '0.65rem'
                                    }}>
                                        {item.severity}
                                    </span>
                                </div>
                                <p style={{ fontSize: '0.7rem', color: '#71717a', margin: '0.5rem 0 0 0' }}>Fuente: {item.source}</p>
                            </div>
                        ))}
                    </div>
                    <div className={styles.footerAction}>
                        Bandeja de Hallazgos <ArrowUpRight size={16} />
                    </div>
                </div>

                {/* Section 3: Poorly Mitigated Risks */}
                <div className={styles.sectionCard}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>
                            <ShieldOff className="text-red-500" size={24} />
                            Riesgos sin Mitigar
                        </h2>
                        <span className={styles.alertCount}>4 Críticos</span>
                    </div>

                    <div className={styles.itemList}>
                        {DUMMY_ALERTS.poorMitigation.map((item) => (
                            <div key={item.id} className={styles.alertItem}>
                                <div className={styles.itemMain}>
                                    <span className={styles.itemLabel}>{item.name}</span>
                                    <span className={`${styles.badge} ${item.exposure === 'Crítico' ? styles.badgeHigh : styles.badgeMed}`}>
                                        {item.exposure}
                                    </span>
                                </div>
                                <div style={{ marginBottom: '0.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '0.2rem' }}>
                                        <span style={{ color: '#71717a' }}>Efectividad Mitigación</span>
                                        <span style={{ color: '#ef4444', fontWeight: 800 }}>{item.level}%</span>
                                    </div>
                                    <div className={styles.progressBar}>
                                        <div className={styles.progressFill} style={{ width: `${item.level}%` }} />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#71717a' }}>
                                    <span>ID: {item.id}</span>
                                    <span style={{ fontWeight: 700 }}>Riesgo {item.risk}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className={styles.footerAction}>
                        Analizar Mapa de Riesgos <ArrowUpRight size={16} />
                    </div>
                </div>
            </div>

            {/* Global Alert Footer */}
            <div className="glass-card" style={{ padding: '1.5rem 2rem', borderLeft: '4px solid #ef4444', background: 'rgba(239, 68, 68, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <Activity className="text-red-500" size={28} />
                    <div>
                        <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900 }}>Estatus General del Sistema</h4>
                        <p style={{ margin: '0.25rem 0 0 0', color: '#71717a', fontSize: '0.85rem' }}>Se ha registrado un incremento del 15% en pruebas fallidas respecto a la semana anterior.</p>
                    </div>
                </div>
                <button className="btn-secondary" style={{ padding: '0.75rem 1.25rem', borderRadius: '0.75rem', fontWeight: 800, fontSize: '0.85rem' }}>
                    Investigar Causas Raíz
                </button>
            </div>
        </div>
    );
}
