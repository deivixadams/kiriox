"use client";

import React, { useMemo, useState } from 'react';
import {
    Users,
    Plus,
    Search,
    Mail,
    Phone,
    Award,
    Shield,
    ChevronRight,
    SearchCode,
    Activity,
    UserCheck,
    Briefcase,
    Clock
} from 'lucide-react';

// Dummy data for Auditors
const DUMMY_AUDITORS = [
    {
        id: "AUD-001",
        name: "Carlos Rodríguez",
        role: "Auditor Líder",
        specialty: "Prevención de Lavado de Activos",
        email: "c.rodriguez@cre.com",
        experience: "12 años",
        status: "Disponible",
        color: "#3b82f6"
    },
    {
        id: "AUD-002",
        name: "Ana Martínez",
        role: "Auditor Senior",
        specialty: "Cumplimiento Regulatorio FATF",
        email: "a.martinez@cre.com",
        experience: "8 años",
        status: "En Auditoría",
        color: "#10b981"
    },
    {
        id: "AUD-003",
        name: "Roberto Sánchez",
        role: "Auditor Especialista",
        specialty: "Criptoactivos y Fintech",
        email: "r.sanchez@cre.com",
        experience: "5 años",
        status: "Disponible",
        color: "#f59e0b"
    },
    {
        id: "AUD-004",
        name: "Elena Gómez",
        role: "Auditor Junior",
        specialty: "Debida Diligencia (KYC)",
        email: "e.gomez@cre.com",
        experience: "3 años",
        status: "En Capacitación",
        color: "#8b5cf6"
    },
    {
        id: "AUD-005",
        name: "Miguel Herrera",
        role: "Auditor Senior",
        specialty: "Riesgo Operativo",
        email: "m.herrera@cre.com",
        experience: "10 años",
        status: "En Auditoría",
        color: "#10b981"
    }
];

export default function AuditorsPage() {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredAuditors = useMemo(() => {
        const term = searchQuery.trim().toLowerCase();
        if (!term) return DUMMY_AUDITORS;
        return DUMMY_AUDITORS.filter((auditor) => {
            return auditor.name.toLowerCase().includes(term) || 
                   auditor.specialty.toLowerCase().includes(term) ||
                   auditor.role.toLowerCase().includes(term);
        });
    }, [searchQuery]);

    return (
        <div style={{ padding: '2rem' }} className="animate-in fade-in duration-500">
            {/* Header Area */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.2) 100%)',
                        padding: '1rem',
                        borderRadius: '1.25rem',
                        border: '1px solid rgba(59, 130, 246, 0.3)'
                    }}>
                        <Users size={32} className="text-blue-500" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.02em', margin: 0 }}>Gestión de Auditores</h1>
                        <p style={{ color: '#71717a', fontSize: '1rem', marginTop: '0.25rem' }}>Directorio del equipo especializado y asignación de roles de validación.</p>
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
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        boxShadow: '0 8px 16px -4px rgba(59, 130, 246, 0.4)',
                        fontWeight: 800,
                        fontSize: '0.95rem',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer'
                    }}
                >
                    <Plus size={20} /> Crear Nuevo Auditor
                </button>
            </div>

            {/* Stats Overview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
                {[
                    { label: 'Total Auditores', value: '18', icon: Users, color: '#3b82f6' },
                    { label: 'En Terreno', value: '7', icon: Activity, color: '#10b981' },
                    { label: 'Certificados', value: '15', icon: Award, color: '#f59e0b' },
                    { label: 'Disponibles', value: '5', icon: UserCheck, color: '#8b5cf6' }
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

            {/* Auditors Inventory */}
            <div className="glass-card" style={{ padding: '2rem', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <Briefcase size={20} className="text-muted" />
                        <h3 style={{ fontWeight: 800, fontSize: '1.25rem', margin: 0 }}>Directorio del Equipo</h3>
                    </div>
                    <div style={{ position: 'relative', width: '350px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#71717a' }} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, especialidad o cargo..."
                            className="glass-input"
                            style={{ paddingLeft: '3rem', width: '100%', borderRadius: '0.75rem' }}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                    {filteredAuditors.map((auditor) => (
                        <div
                            key={auditor.id}
                            className="auditor-card"
                            style={{
                                padding: '1.5rem',
                                borderRadius: '1.25rem',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.05)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1rem',
                                transition: 'all 0.3s ease',
                                cursor: 'pointer',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            <div style={{ 
                                position: 'absolute', 
                                top: 0, 
                                right: 0, 
                                width: '4px', 
                                height: '100%', 
                                background: auditor.color 
                            }} />
                            
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <div style={{ 
                                    width: '48px', 
                                    height: '48px', 
                                    borderRadius: '50%', 
                                    background: `linear-gradient(135deg, ${auditor.color}33 0%, ${auditor.color}11 100%)`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: `1px solid ${auditor.color}33`,
                                    fontSize: '1.25rem',
                                    fontWeight: 800,
                                    color: auditor.color
                                }}>
                                    {auditor.name.charAt(0)}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 800, color: 'white', fontSize: '1.1rem' }}>{auditor.name}</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                                        <Shield size={12} style={{ color: auditor.color }} />
                                        <span style={{ fontSize: '0.85rem', color: '#a1a1aa', fontWeight: 600 }}>{auditor.role}</span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.03)' }}>
                                <div style={{ fontSize: '0.75rem', color: '#71717a', textTransform: 'uppercase', fontWeight: 800, marginBottom: '0.4rem' }}>Especialidad</div>
                                <div style={{ fontSize: '0.9rem', color: '#e4e4e7', fontWeight: 600 }}>{auditor.specialty}</div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#71717a' }}>
                                    <Mail size={14} />
                                    <span style={{ fontSize: '0.85rem' }}>{auditor.email}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#71717a' }}>
                                    <Clock size={14} />
                                    <span style={{ fontSize: '0.85rem' }}>Exp: {auditor.experience}</span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                <span className={`status-pill ${
                                    auditor.status === 'Disponible' ? 'status-success' : 
                                    auditor.status === 'En Auditoría' ? 'status-primary' : 
                                    'status-muted'
                                }`}>
                                    {auditor.status}
                                </span>
                                <ChevronRight size={18} className="text-muted" />
                            </div>
                        </div>
                    ))}
                </div>

                {filteredAuditors.length === 0 && (
                    <div style={{ padding: '6rem 0', textAlign: 'center', opacity: 0.5 }}>
                        <Users size={64} style={{ margin: '0 auto 1.5rem auto', display: 'block' }} />
                        <p style={{ fontSize: '1.1rem' }}>No se encontraron auditores registrados con este criterio.</p>
                    </div>
                )}
            </div>

            <style jsx>{`
                .auditor-card:hover {
                    background: rgba(255,255,255,0.07) !important;
                    border-color: rgba(59, 130, 246, 0.2) !important;
                    transform: translateY(-4px);
                    box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.4);
                }
                .status-pill {
                    padding: 0.35rem 0.75rem;
                    border-radius: 2rem;
                    font-size: 0.7rem;
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
