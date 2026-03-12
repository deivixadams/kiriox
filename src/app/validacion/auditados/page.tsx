"use client";

import React, { useState } from 'react';
import { 
    Building2, 
    Search, 
    Filter, 
    ChevronRight, 
    AlertTriangle, 
    CheckCircle2, 
    Clock, 
    BarChart3,
    ArrowUpRight,
    ClipboardList
} from 'lucide-react';
import styles from './Auditados.module.css';

// Dummy data for Audited Entities
const DUMMY_AUDITADOS = [
    {
        id: "ENT-001",
        name: "Banco del Progreso S.A.",
        code: "BPR-01",
        lastAudit: "2025-12-15",
        status: "Cumplimiento Alto",
        openFindings: 2,
        respondedFindings: 18,
        totalAudits: 5,
        responseRate: 90
    },
    {
        id: "ENT-002",
        name: "Fiduciaria Nacional",
        code: "FIN-04",
        lastAudit: "2026-01-20",
        status: "En Revisión",
        openFindings: 8,
        respondedFindings: 12,
        totalAudits: 3,
        responseRate: 60
    },
    {
        id: "ENT-003",
        name: "Seguros del Caribe",
        code: "SEC-09",
        lastAudit: "2026-02-05",
        status: "Cumplimiento Óptimo",
        openFindings: 0,
        respondedFindings: 25,
        totalAudits: 8,
        responseRate: 100
    },
    {
        id: "ENT-004",
        name: "Cooperativa de Ahorros El Sol",
        code: "COE-12",
        lastAudit: "2026-03-01",
        status: "Atención Requerida",
        openFindings: 14,
        respondedFindings: 6,
        totalAudits: 4,
        responseRate: 30
    },
    {
        id: "ENT-005",
        name: "Financiera Global Tech",
        code: "FGT-22",
        lastAudit: "2025-11-28",
        status: "Cumplimiento Medio",
        openFindings: 5,
        respondedFindings: 15,
        totalAudits: 6,
        responseRate: 75
    },
    {
        id: "ENT-006",
        name: "Caja de Préstamos San José",
        code: "CPSJ-01",
        lastAudit: "2026-01-10",
        status: "Cumplimiento Alto",
        openFindings: 1,
        respondedFindings: 19,
        totalAudits: 3,
        responseRate: 95
    }
];

export default function AuditadosPage() {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredEntities = DUMMY_AUDITADOS.filter(entity => 
        entity.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        entity.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const stats = [
        { label: 'Total Entidades', value: '24', icon: Building2, color: '#3b82f6' },
        { label: 'Hallazgos Abiertos', value: '42', icon: AlertTriangle, color: '#ef4444' },
        { label: 'Tasa Respuesta', value: '78%', icon: BarChart3, color: '#10b981' },
        { label: 'Auditorías 2026', value: '9', icon: ClipboardList, color: '#8b5cf6' }
    ];

    return (
        <div className={styles.container}>
            {/* Header Area */}
            <div className={styles.header}>
                <div className={styles.headerTitle}>
                    <div className={styles.iconWrapper}>
                        <Building2 size={32} className="text-blue-500" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.02em', margin: 0 }}>Entidades Auditadas</h1>
                        <p style={{ color: '#71717a', fontSize: '1rem', marginTop: '0.25rem' }}>Estatus de cumplimiento, hallazgos y gestión de planes de acción por entidad.</p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div className={styles.searchWrapper}>
                        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#71717a' }} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o código..."
                            className={styles.searchInput}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button className="glass-card" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <Filter size={18} /> Filtros
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className={styles.statsGrid}>
                {stats.map((stat) => (
                    <div key={stat.label} className={styles.statCard}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</div>
                            <stat.icon size={18} style={{ color: stat.color }} />
                        </div>
                        <div style={{ fontSize: '2.25rem', fontWeight: 900, color: 'white', marginTop: '0.75rem' }}>{stat.value}</div>
                    </div>
                ))}
            </div>

            {/* Entities List */}
            <div className={styles.tableCard}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                    <ClipboardList size={20} className="text-muted" />
                    <h3 style={{ fontWeight: 800, fontSize: '1.25rem', margin: 0 }}>Directorio de Auditados</h3>
                </div>

                <div className={styles.tableHeader}>
                    <span>Entidad / Código</span>
                    <span>Última Auditoría</span>
                    <span style={{ textAlign: 'center' }}>Hallazgos</span>
                    <span style={{ textAlign: 'center' }}>Respuesta</span>
                    <span style={{ textAlign: 'center' }}>Estatus</span>
                    <span />
                </div>

                {filteredEntities.map((entity) => (
                    <div key={entity.id} className={styles.auditRow}>
                        <div className={styles.entityInfo}>
                            <span className={styles.entityName}>{entity.name}</span>
                            <span className={styles.entityCode}>{entity.code}</span>
                        </div>
                        <div style={{ color: '#a1a1aa', fontSize: '0.9rem' }}>
                            {entity.lastAudit}
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
                                <span style={{ color: entity.openFindings > 5 ? '#ef4444' : 'white', fontWeight: 800 }}>
                                    {entity.openFindings} Open
                                </span>
                                <span style={{ fontSize: '0.7rem', color: '#71717a' }}>
                                    {entity.respondedFindings} Solucionados
                                </span>
                            </div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ display: 'inline-block', width: '100px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '0.2rem' }}>
                                    <span style={{ color: '#71717a' }}>Progreso</span>
                                    <span style={{ color: 'white', fontWeight: 700 }}>{entity.responseRate}%</span>
                                </div>
                                <div className={styles.progressBarWrapper}>
                                    <div 
                                        className={styles.progressBar} 
                                        style={{ width: `${entity.responseRate}%` }} 
                                    />
                                </div>
                            </div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <span className={`${styles.badge} ${
                                entity.status === 'Cumplimiento Óptimo' || entity.status === 'Cumplimiento Alto' 
                                    ? styles.badgeSuccess 
                                    : entity.status === 'Atención Requerida' 
                                        ? styles.badgeDanger 
                                        : styles.badgeWarning
                            }`}>
                                {entity.status}
                            </span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <ArrowUpRight size={20} className="text-muted" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
