"use client";

import React, { useState } from 'react';
import {
    ClipboardCheck,
    Search,
    Plus,
    Info,
    ArrowUpRight
} from 'lucide-react';
import styles from './Checklists.module.css';

// Dummy data for Checklists
const DUMMY_CHECKLISTS = [
    {
        id: "CHK-001",
        title: "Manual de Prevención AML",
        subtitle: "Estándares de Control Interno",
        version: "v2.4",
        items: 45,
        category: "Cumplimiento",
        lastUpdated: "2026-02-10",
        author: "Comité de Riesgos",
        description: "Protocolos base para la identificación y reporte de operaciones sospechosas."
    },
    {
        id: "CHK-002",
        title: "Guía de Debida Diligencia",
        subtitle: "Segmento de Alto Riesgo",
        version: "v1.8",
        items: 32,
        category: "KYC/CDD",
        lastUpdated: "2026-01-25",
        author: "Unidad de Inteligencia",
        description: "Requisitos exhaustivos para clientes PEP y perfiles de alto patrimonio."
    },
    {
        id: "CHK-003",
        title: "Monitoreo Transaccional",
        subtitle: "Reglas de Alerta Temprana",
        version: "v3.1",
        items: 28,
        category: "Operaciones",
        lastUpdated: "2026-03-01",
        author: "Sistemas de Control",
        description: "Validación de parámetros de segmentación y umbrales de alerta."
    },
    {
        id: "CHK-004",
        title: "Control de Corresponsalía",
        subtitle: "Banca Internacional",
        version: "v1.2",
        items: 50,
        category: "Internacional",
        lastUpdated: "2025-12-15",
        author: "Compliance Hub",
        description: "Estándares FATF para relaciones con bancos corresponsales extranjeros."
    },
    {
        id: "CHK-005",
        title: "Auditoría de Criptoactivos",
        subtitle: "Marco VASP / Fintech",
        version: "v2.0",
        items: 38,
        category: "Inteligencia",
        lastUpdated: "2026-02-28",
        author: "Tecnología Regulatoria",
        description: "Protocolos de trazabilidad y riesgos asociados a activos virtuales."
    },
    {
        id: "CHK-006",
        title: "Riesgos de Canales Digitales",
        subtitle: "App & Web Banking",
        version: "v1.5",
        items: 22,
        category: "Canales",
        lastUpdated: "2026-01-12",
        author: "Ciberseguridad",
        description: "Validación de factores de autenticación y límites transaccionales."
    },
    {
        id: "CHK-007",
        title: "Gobierno Corporativo",
        subtitle: "Responsabilidad de la Junta",
        version: "v2.2",
        items: 15,
        category: "Gobierno",
        lastUpdated: "2026-03-05",
        author: "Legal & Compliance",
        description: "Estructura de toma de decisiones y supervisión del programa de cumplimiento."
    },
    {
        id: "CHK-008",
        title: "Capacitación y Cultura",
        subtitle: "Plan de Formación Anual",
        version: "v1.0",
        items: 20,
        category: "Recursos Humanos",
        lastUpdated: "2026-02-14",
        author: "Talento Humano",
        description: "Indicadores de participación y efectividad en programas de entrenamiento AML."
    }
];

export default function ChecklistsPage() {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredChecklists = DUMMY_CHECKLISTS.filter(chk => 
        chk.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        chk.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div style={{ padding: '2rem' }} className="animate-in fade-in duration-500">
            {/* Header Area */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(124, 58, 237, 0.2) 100%)',
                        padding: '1rem',
                        borderRadius: '1.25rem',
                        border: '1px solid rgba(139, 92, 246, 0.3)'
                    }}>
                        <ClipboardCheck size={32} className="text-purple-500" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.02em', margin: 0 }}>Repositorio de Checklists</h1>
                        <p style={{ color: '#71717a', fontSize: '1rem', marginTop: '0.25rem' }}>Biblioteca centralizada de guías normativas y listas de verificación técnica.</p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ position: 'relative', width: '300px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#71717a' }} />
                        <input
                            type="text"
                            placeholder="Buscar en el catálogo..."
                            className="glass-input"
                            style={{ paddingLeft: '3rem', width: '100%', borderRadius: '0.75rem' }}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button
                        className="btn-primary"
                        style={{
                            padding: '0.85rem 1.5rem',
                            borderRadius: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                            boxShadow: '0 8px 16px -4px rgba(139, 92, 246, 0.4)',
                            fontWeight: 800,
                            fontSize: '0.9rem',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer'
                        }}
                    >
                        <Plus size={18} /> Nuevo Template
                    </button>
                </div>
            </div>

            {/* Book Grid */}
            <div className={styles.checklistGrid}>
                {filteredChecklists.map((book) => (
                    <div 
                        key={book.id} 
                        className={styles.checklistBook}
                    >
                        {/* Book Spine Shadow */}
                        <div className={styles.bookSpine} />
                        
                        <div className={styles.bookContent}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '1.25rem' }}>
                                <span style={{ 
                                    fontSize: '0.6rem', 
                                    fontWeight: 800, 
                                    color: '#8b5cf6', 
                                    background: 'rgba(139, 92, 246, 0.1)',
                                    padding: '0.15rem 0.4rem',
                                    borderRadius: '0.3rem',
                                    border: '1px solid rgba(139, 92, 246, 0.2)'
                                }}>
                                    {book.id}
                                </span>
                                <span style={{ fontSize: '0.6rem', color: '#71717a', fontWeight: 600 }}>{book.version}</span>
                            </div>

                            <div style={{ marginBottom: 'auto' }}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: 'white', lineHeight: 1.2, marginBottom: '0.4rem' }}>
                                    {book.title}
                                </h3>
                                <p style={{ fontSize: '0.75rem', color: '#a1a1aa', fontWeight: 500 }}>
                                    {book.subtitle}
                                </p>
                            </div>

                            <div className={styles.bookFooter}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontSize: '0.55rem', color: '#71717a', textTransform: 'uppercase', fontWeight: 800 }}>Items</span>
                                        <span style={{ fontSize: '0.8rem', color: 'white', fontWeight: 800 }}>{book.items}</span>
                                    </div>
                                    <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.05)' }} />
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontSize: '0.55rem', color: '#71717a', textTransform: 'uppercase', fontWeight: 800 }}>Categoría</span>
                                        <span style={{ fontSize: '0.8rem', color: '#8b5cf6', fontWeight: 800 }}>{book.category}</span>
                                    </div>
                                </div>
                                <div className={styles.openIcon}>
                                    <ArrowUpRight size={16} />
                                </div>
                            </div>
                        </div>

                        {/* Tooltip Hover Overlay */}
                        <div className={styles.bookTooltip}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#8b5cf6' }}>
                                <Info size={14} />
                                <span style={{ fontWeight: 800, fontSize: '0.75rem' }}>DETALLES</span>
                            </div>
                            <p style={{ fontSize: '0.75rem', color: '#e4e4e7', lineHeight: 1.4, margin: 0 }}>
                                {book.description}
                            </p>
                            <div style={{ marginTop: '0.75rem', fontSize: '0.65rem', color: '#71717a' }}>
                                Actualizado: {book.lastUpdated}<br/>
                                Por: {book.author}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
