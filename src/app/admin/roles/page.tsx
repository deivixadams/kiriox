"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Lock, Check, Loader2, UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';

interface User {
    id: string;
    name: string;
    lastName: string | null;
    email: string;
    role?: {
        roleCode: string;
        roleName: string;
    };
}

interface Role {
    id: string;
    roleCode: string;
    roleName: string;
    description: string | null;
}

export default function RolesPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [dbRoles, setDbRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [assigning, setAssigning] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [selectedRoleCodes, setSelectedRoleCodes] = useState<string[]>([]);
    const [roleMenuOpen, setRoleMenuOpen] = useState(false);
    const [roleQuery, setRoleQuery] = useState('');

    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => setMessage(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    // Predefined roles for the matrix (consistent with original design)
    const displayRoles = [
        { code: 'ADMIN', label: 'Administrador' },
        { code: 'LEAD_AUDITOR', label: 'Auditor Líder' },
        { code: 'AUDITOR', label: 'Auditor' },
        { code: 'AML_SENIOR', label: 'AML Senior' },
        { code: 'AML_JUNIOR', label: 'AML Junior' },
        { code: 'READER', label: 'Lector' }
    ];

    const permissions = [
        { label: 'Administración (usuarios, roles, facturación)', values: ['ADMIN'] },
        { label: 'Corpus y versiones (configurar / seleccionar)', values: ['ADMIN', 'LEAD_AUDITOR'] },
        { label: 'Dashboards y métricas (crear / editar / mover)', values: ['ADMIN'] },
        { label: 'Datos y conexiones (configurar / exportar)', values: ['ADMIN'] },
        { label: 'Auditorías (crear / editar / asignar equipo)', values: ['ADMIN', 'LEAD_AUDITOR', 'AUDITOR', 'AML_SENIOR', 'AML_JUNIOR'] },
        { label: 'Hallazgos y evidencia (registrar / subir)', values: ['ADMIN', 'LEAD_AUDITOR', 'AUDITOR', 'AML_SENIOR', 'AML_JUNIOR'] },
        { label: 'Informes (borrador / final / cierre)', values: ['ADMIN', 'LEAD_AUDITOR', 'AML_SENIOR'] },
        { label: 'Lectura operativa (ver dashboards / informes)', values: ['ADMIN', 'LEAD_AUDITOR', 'AUDITOR', 'AML_SENIOR', 'AML_JUNIOR', 'READER'] }
    ];

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [usersRes, rolesRes] = await Promise.all([
                    fetch('/api/admin/users'),
                    fetch('/api/admin/rbac')
                ]);

                const usersData = await usersRes.json();
                const rolesData = await rolesRes.json();

                // Ensure rolesData is an array
                const rolesArray = Array.isArray(rolesData) ? rolesData : [];

                setUsers(Array.isArray(usersData) ? usersData : []);
                setDbRoles(rolesArray);
            } catch (error) {
                console.error('Error loading roles data:', error);
                setMessage({ text: 'Error al cargar datos reales', type: 'error' });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleAssign = async () => {
        if (!selectedUserId || selectedRoleCodes.length === 0) return;

        setAssigning(true);
        try {
            const res = await fetch(`/api/admin/users/${selectedUserId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roleCodes: selectedRoleCodes })
            });

            if (res.ok) {
                setMessage({ text: 'Roles asignados correctamente', type: 'success' });
                // Refresh users data
                const usersRes = await fetch('/api/admin/users');
                const usersData = await usersRes.json();
                setUsers(Array.isArray(usersData) ? usersData : []);
            } else {
                setMessage({ text: 'Error al asignar los roles', type: 'error' });
            }
        } catch (error) {
            setMessage({ text: 'Error de red', type: 'error' });
        } finally {
            setAssigning(false);
        }
    };

    const toggleRole = (code: string) => {
        setSelectedRoleCodes(prev =>
            prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
        );
    };

    const filteredDbRoles = useMemo(() => {
        const q = roleQuery.toLowerCase().trim();
        if (!q) return dbRoles;
        return dbRoles.filter(r => r.roleName.toLowerCase().includes(q) || r.roleCode.toLowerCase().includes(q));
    }, [dbRoles, roleQuery]);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20">
                <Loader2 className="animate-spin text-blue-500" size={40} />
            </div>
        );
    }

    return (
        <div className="animate-fade-in" onClick={() => setRoleMenuOpen(false)}>
            {/* Notification Toast */}
            {message && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl animate-in slide-in-from-right-10 duration-300 ${message.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-red-500/10 border-red-500/20 text-red-400'
                    }`}>
                    {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    <span className="text-sm font-medium">{message.text}</span>
                </div>
            )}

            <div className="section-header" style={{ alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className="roles-icon">
                        <Lock size={20} />
                    </div>
                    <div>
                        <h1 className="gradient-text" style={{ fontSize: '1.9rem', margin: 0 }}>Permisos de Usuario</h1>
                        <p style={{ color: 'var(--muted)', margin: '0.35rem 0 0 0' }}>
                            Gestiona la asignación de roles y visualiza la matriz de permisos.
                        </p>
                    </div>
                </div>
            </div>

            {/* Assignment Bar */}
            <div className="glass-card assignment-card" style={{ marginBottom: '1.5rem', padding: '1.5rem', display: 'flex', gap: '1.5rem', alignItems: 'flex-end', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.6rem', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>Usuario</label>
                    <select
                        className="form-control"
                        value={selectedUserId}
                        onChange={(e) => {
                            const userId = e.target.value;
                            setSelectedUserId(userId);
                            const user = users.find(u => u.id === userId);
                            if (user) {
                                // Assume multi-roles are handled in User interface now
                                const userRoles = (user as any).roles?.map((r: any) => r.roleCode) || [];
                                setSelectedRoleCodes(userRoles);
                            } else {
                                setSelectedRoleCodes([]);
                            }
                        }}
                        style={{ width: '100%', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', padding: '0.75rem', borderRadius: '12px', fontSize: '0.9rem' }}
                    >
                        <option value="">Seleccionar Usuario...</option>
                        {users.map(u => (
                            <option key={u.id} value={u.id}>
                                {u.name} {u.lastName} — {(u as any).roles?.map((r: any) => r.roleName).join(', ') || 'Sin Rol'}
                            </option>
                        ))}
                    </select>
                </div>
                <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.6rem', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>Roles Asignados</label>
                    <div style={{ position: 'relative' }}>
                        <div
                            className="form-control"
                            onClick={(e) => {
                                e.stopPropagation();
                                setRoleMenuOpen(!roleMenuOpen);
                            }}
                            style={{
                                minHeight: '48px',
                                background: 'rgba(15, 23, 42, 0.6)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                color: '#fff',
                                padding: '0.5rem 0.75rem',
                                borderRadius: '12px',
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '0.5rem',
                                alignItems: 'center'
                            }}
                        >
                            {selectedRoleCodes.length === 0 && <span style={{ color: '#64748b' }}>Seleccionar Roles...</span>}
                            {selectedRoleCodes.map(code => {
                                const role = dbRoles.find(r => r.roleCode === code);
                                return (
                                    <span key={code} style={{
                                        background: 'rgba(59, 130, 246, 0.2)',
                                        border: '1px solid rgba(59, 130, 246, 0.3)',
                                        color: '#3b82f6',
                                        padding: '0.2rem 0.6rem',
                                        borderRadius: '6px',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.35rem'
                                    }}>
                                        {role?.roleName || code}
                                        <span
                                            onClick={(e) => { e.stopPropagation(); toggleRole(code); }}
                                            style={{ cursor: 'pointer', opacity: 0.7, fontSize: '0.9rem' }}
                                        >×</span>
                                    </span>
                                );
                            })}
                            <span style={{ marginLeft: 'auto', color: '#64748b' }}>▾</span>
                        </div>
                        {roleMenuOpen && (
                            <div
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                    position: 'absolute',
                                    top: '110%',
                                    left: 0,
                                    right: 0,
                                    background: '#131c31',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '12px',
                                    zIndex: 100,
                                    boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                                    maxHeight: '250px',
                                    overflowY: 'auto'
                                }}
                            >
                                <input
                                    type="text"
                                    placeholder="Buscar rol..."
                                    value={roleQuery}
                                    onChange={(e) => setRoleQuery(e.target.value)}
                                    style={{ width: '100%', padding: '0.75rem', background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.85rem' }}
                                    autoFocus
                                />
                                <div style={{ padding: '0.5rem' }}>
                                    {filteredDbRoles.map(r => (
                                        <div
                                            key={r.id}
                                            onClick={() => toggleRole(r.roleCode)}
                                            style={{
                                                padding: '0.6rem 0.75rem',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                fontSize: '0.85rem',
                                                background: selectedRoleCodes.includes(r.roleCode) ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                                                color: selectedRoleCodes.includes(r.roleCode) ? '#3b82f6' : '#94a3b8',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                marginBottom: '2px'
                                            }}
                                        >
                                            {r.roleName}
                                            {selectedRoleCodes.includes(r.roleCode) && <Check size={14} />}
                                        </div>
                                    ))}
                                    {filteredDbRoles.length === 0 && <div style={{ padding: '1rem', textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>Sin resultados</div>}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <button
                    className={`btn-primary ${(!selectedUserId || selectedRoleCodes.length === 0 || assigning) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={handleAssign}
                    disabled={!selectedUserId || selectedRoleCodes.length === 0 || assigning}
                    style={{
                        height: '48px',
                        padding: '0 2rem',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontWeight: 600,
                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                    }}
                >
                    {assigning ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
                    {assigning ? 'Asignando...' : 'Aplicar Cambios'}
                </button>
            </div>

            <div className="glass-card roles-card">
                <div className="roles-table">
                    <div className="roles-header">
                        <div className="roles-header-label">Matriz de Permisos</div>
                        {displayRoles.map((role) => (
                            <div
                                key={role.code}
                                className={`roles-header-role ${selectedRoleCodes.includes(role.code) ? 'role-active' : ''}`}
                            >
                                {role.label}
                                {selectedRoleCodes.includes(role.code) && (
                                    <div className="active-badge">Activo</div>
                                )}
                            </div>
                        ))}
                    </div>

                    {permissions.map((perm, idx) => (
                        <div key={perm.label} className={`roles-row ${idx % 2 === 0 ? 'row-alt' : ''}`}>
                            <div className="roles-permission">{perm.label}</div>
                            {displayRoles.map((role) => {
                                const isUserRole = selectedRoleCodes.includes(role.code);
                                return (
                                    <div
                                        key={`${perm.label}-${role.code}`}
                                        className={`roles-cell ${isUserRole ? 'role-active-column' : ''}`}
                                    >
                                        {perm.values.includes(role.code) && (
                                            <span className={`roles-check ${isUserRole ? 'check-active' : ''}`}>
                                                <Check size={16} />
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            <style jsx>{`
                .roles-card {
                    padding: 1.5rem;
                    border-radius: 16px;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                }
                .roles-icon {
                    height: 48px;
                    width: 48px;
                    border-radius: 14px;
                    background: rgba(59, 130, 246, 0.15);
                    border: 1px solid rgba(59, 130, 246, 0.25);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #3b82f6;
                    box-shadow: 0 0 20px rgba(59, 130, 246, 0.1);
                }
                .roles-table {
                    display: grid;
                    gap: 0.35rem;
                    overflow-x: auto;
                }
                .roles-header,
                .roles-row {
                    display: grid;
                    grid-template-columns: 320px repeat(6, minmax(130px, 1fr));
                    align-items: center;
                }
                .roles-header {
                    padding: 1rem 0.5rem;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
                    margin-bottom: 0.75rem;
                }
                .roles-header-label {
                    color: #94a3b8;
                    font-size: 0.8rem;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    font-weight: 700;
                    padding-left: 0.5rem;
                }
                .roles-header-role {
                    text-align: center;
                    font-size: 0.9rem;
                    color: #94a3b8;
                    font-weight: 600;
                    padding: 0.5rem;
                    border-radius: 8px;
                    transition: all 0.2s ease;
                }
                .role-active {
                    color: #3b82f6;
                    background: rgba(59, 130, 246, 0.1);
                }
                .active-badge {
                    font-size: 0.65rem;
                    text-transform: uppercase;
                    margin-top: 0.25rem;
                    font-weight: 800;
                    letter-spacing: 0.05em;
                }
                .roles-row {
                    padding: 0.85rem 0.5rem;
                    border-radius: 12px;
                    background: rgba(255, 255, 255, 0.015);
                    transition: background 0.2s ease;
                }
                .roles-row:hover {
                    background: rgba(255, 255, 255, 0.03);
                }
                .roles-row.row-alt {
                    background: rgba(255, 255, 255, 0.025);
                }
                .roles-permission {
                    color: #e2e8f0;
                    font-size: 0.85rem;
                    font-weight: 500;
                    padding-left: 0.5rem;
                }
                .roles-cell {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100%;
                    border-radius: 8px;
                    transition: all 0.2s ease;
                }
                .role-active-column {
                    background: rgba(59, 130, 246, 0.04);
                }
                .roles-check {
                    height: 28px;
                    width: 28px;
                    border-radius: 9px;
                    background: rgba(255, 255, 255, 0.05);
                    color: #64748b;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }
                .check-active {
                    background: rgba(59, 130, 246, 0.2);
                    color: #3b82f6;
                    border: 1px solid rgba(59, 130, 246, 0.3);
                }
            `}</style>
        </div>
    );
}
