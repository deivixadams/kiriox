"use client";

import React from 'react';
import { 
    TrendingUp, 
    AlertTriangle, 
    ShieldOff, 
    Layers, 
    FileWarning, 
    ArrowUpRight, 
    TrendingDown,
    Activity,
    ChevronRight,
    Search
} from 'lucide-react';
import styles from './Tendencias.module.css';

const DUMMY_DATA = {
    dominios: [
        { id: "DOM-01", name: "Prevención de Lavado de Activos", risk: "Crítico", mitigation: 45, trend: "up", reason: "Falta de actualización en manuales operativos" },
        { id: "DOM-02", name: "Ciberseguridad y Datos", risk: "Alto", mitigation: 58, trend: "up", reason: "Vulnerabilidades no parcheadas en core bancario" },
        { id: "DOM-03", name: "Protección al Consumidor", risk: "Medio", mitigation: 62, trend: "down", reason: "Retrasos en respuesta a reclamaciones" }
    ],
    obligaciones: [
        { id: "OBL-42", name: "Reporte de Operaciones Sospechosas (ROS)", risk: "Crítico", mitigation: 30, trend: "up", reason: "Inconsistencia en los algoritmos de detección" },
        { id: "OBL-15", name: "Debida Diligencia Simplificada", risk: "Alto", mitigation: 48, trend: "up", reason: "Expedientes incompletos en banca retail" },
        { id: "OBL-88", name: "Conservación de Documentos", risk: "Medio", mitigation: 65, trend: "down", reason: "Falta de respaldo en sucursales remotas" }
    ],
    riesgos: [
        { id: "RSK-09", name: "Riesgo de Reputación por Fraude Interno", risk: "Crítico", mitigation: 25, trend: "up", reason: "Baja rotación de personal en áreas sensibles" },
        { id: "RSK-21", name: "Riesgo Legal por Incumplimiento Normativo", risk: "Alto", mitigation: 52, trend: "up", reason: "Cambios regulatorios no implementados" },
        { id: "RSK-05", name: "Riesgo Operativo en Canales Digitales", risk: "Alto", mitigation: 55, trend: "down", reason: "Interrupciones frecuentes en API gateway" }
    ]
};

export default function TendenciasPage() {
    return (
        <div className={styles.container}>
            {/* Header Area */}
            <div className={styles.header}>
                <div className={styles.headerTitle}>
                    <div className={styles.iconWrapper}>
                        <TrendingUp size={32} className="text-red-500" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.02em', margin: 0 }}>Tendencias de Riesgo</h1>
                        <p style={{ color: '#71717a', fontSize: '1rem', marginTop: '0.25rem' }}>Análisis de dominios, obligaciones y riesgos con mitigación deficiente.</p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ position: 'relative', width: '300px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#71717a' }} />
                        <input
                            type="text"
                            placeholder="Filtrar por nombre o ID..."
                            className="glass-input"
                            style={{ paddingLeft: '3rem', width: '100%', borderRadius: '0.75rem' }}
                        />
                    </div>
                    <button className="btn-primary" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #b91d1d 100%)', border: 'none', color: 'white', padding: '0.85rem 1.5rem', borderRadius: '1rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Activity size={18} /> Generar Reporte
                    </button>
                </div>
            </div>

            {/* Dashboard Grid */}
            <div className={styles.grid}>
                {/* Dominios Deficientes */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Layers className="text-red-500" size={24} />
                            <h2 className={styles.cardTitle}>Dominios</h2>
                        </div>
                        <span style={{ fontSize: '0.7rem', color: '#71717a', fontWeight: 800 }}>MÁS CRÍTICOS</span>
                    </div>

                    <div className={styles.itemList}>
                        {DUMMY_DATA.dominios.map((item) => (
                            <div key={item.id} className={styles.itemRow}>
                                <div className={styles.itemHeader}>
                                    <span className={styles.itemName}>{item.name}</span>
                                    <span className={`${styles.riskBadge} ${item.risk === 'Crítico' ? styles.riskHigh : styles.riskMedium}`}>
                                        {item.risk}
                                    </span>
                                </div>
                                <p style={{ fontSize: '0.7rem', color: '#71717a', margin: '0.25rem 0' }}>{item.reason}</p>
                                <div className={styles.itemMeta}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <span className={styles.mitigationLabel}>Mitigación</span>
                                        <div className={styles.mitigationBar}>
                                            <div className={styles.mitigationProgress} style={{ width: `${item.mitigation}%` }} />
                                        </div>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#ef4444' }}>{item.mitigation}%</span>
                                    </div>
                                    <div className={`${styles.trendIcon} ${item.trend === 'up' ? styles.trendUp : styles.trendDown}`}>
                                        {item.trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                        {item.trend === 'up' ? '+12%' : '-5%'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className={styles.viewAll}>
                        Ver todos los Dominios <ChevronRight size={16} />
                    </div>
                </div>

                {/* Obligaciones Deficientes */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <FileWarning className="text-orange-500" size={24} />
                            <h2 className={styles.cardTitle}>Obligaciones</h2>
                        </div>
                        <span style={{ fontSize: '0.7rem', color: '#71717a', fontWeight: 800 }}>MÁS CRÍTICAS</span>
                    </div>

                    <div className={styles.itemList}>
                        {DUMMY_DATA.obligaciones.map((item) => (
                            <div key={item.id} className={styles.itemRow}>
                                <div className={styles.itemHeader}>
                                    <span className={styles.itemName}>{item.name}</span>
                                    <span className={`${styles.riskBadge} ${item.risk === 'Crítico' ? styles.riskHigh : styles.riskMedium}`}>
                                        {item.risk}
                                    </span>
                                </div>
                                <p style={{ fontSize: '0.7rem', color: '#71717a', margin: '0.25rem 0' }}>{item.reason}</p>
                                <div className={styles.itemMeta}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <span className={styles.mitigationLabel}>Mitigación</span>
                                        <div className={styles.mitigationBar}>
                                            <div className={styles.mitigationProgress} style={{ width: `${item.mitigation}%`, background: '#f97316' }} />
                                        </div>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#f97316' }}>{item.mitigation}%</span>
                                    </div>
                                    <div className={`${styles.trendIcon} ${item.trend === 'up' ? styles.trendUp : styles.trendDown}`} style={{ color: item.trend === 'up' ? '#f97316' : '#10b981' }}>
                                        {item.trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                        {item.trend === 'up' ? '+8%' : '-2%'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className={styles.viewAll}>
                        Ver Obligaciones <ChevronRight size={16} />
                    </div>
                </div>

                {/* Riesgos Deficientes */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <ShieldOff className="text-red-500" size={24} />
                            <h2 className={styles.cardTitle}>Riesgos</h2>
                        </div>
                        <span style={{ fontSize: '0.7rem', color: '#71717a', fontWeight: 800 }}>SIN MITIGAR</span>
                    </div>

                    <div className={styles.itemList}>
                        {DUMMY_DATA.riesgos.map((item) => (
                            <div key={item.id} className={styles.itemRow}>
                                <div className={styles.itemHeader}>
                                    <span className={styles.itemName}>{item.name}</span>
                                    <span className={`${styles.riskBadge} ${item.risk === 'Crítico' ? styles.riskHigh : styles.riskMedium}`}>
                                        {item.risk}
                                    </span>
                                </div>
                                <p style={{ fontSize: '0.7rem', color: '#71717a', margin: '0.25rem 0' }}>{item.reason}</p>
                                <div className={styles.itemMeta}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <span className={styles.mitigationLabel}>Mitigación</span>
                                        <div className={styles.mitigationBar}>
                                            <div className={styles.mitigationProgress} style={{ width: `${item.mitigation}%` }} />
                                        </div>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#ef4444' }}>{item.mitigation}%</span>
                                    </div>
                                    <div className={`${styles.trendIcon} ${item.trend === 'up' ? styles.trendUp : styles.trendDown}`}>
                                        {item.trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                        {item.trend === 'up' ? '+15%' : '-3%'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className={styles.viewAll}>
                        Mapa de Riesgos <ChevronRight size={16} />
                    </div>
                </div>
            </div>

            {/* Bottom Alert Section */}
            <div className="glass-card" style={{ padding: '1.5rem 2rem', borderLeft: '4px solid #ef4444', background: 'rgba(239, 68, 68, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <AlertTriangle className="text-red-500" size={28} />
                    <div>
                        <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900 }}>Alerta de Mitigación Crítica</h4>
                        <p style={{ margin: '0.25rem 0 0 0', color: '#71717a', fontSize: '0.85rem' }}>Se han detectado 3 dominios con una mitigación inferior al 50% en el último trimestre.</p>
                    </div>
                </div>
                <button className="btn-secondary" style={{ padding: '0.75rem 1.25rem', borderRadius: '0.75rem', fontWeight: 800, fontSize: '0.85rem' }}>
                    Explorar Detalle de Alertas
                </button>
            </div>
        </div>
    );
}
