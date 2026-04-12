"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Building, Plus, Edit3, Trash2, X, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getCsrfTokenFromDocument } from '@/lib/client-csrf';

type CompanyRow = {
    id: string;
    name: string;
    code: string;
    description: string | null;
    legalName: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
};

export default function EmpresaPage() {
    const router = useRouter();
    const [companies, setCompanies] = useState<CompanyRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Modal states
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingCompany, setEditingCompany] = useState<CompanyRow | null>(null);
    const [editForm, setEditForm] = useState({ name: '', code: '', description: '', legalName: '' });
    const [isSaving, setIsSaving] = useState(false);

    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/admin/companies?status=ALL');
            if (res.status === 401 || res.status === 403) {
                router.replace('/login');
                return;
            }
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'No se pudo cargar empresas.');
            }
            const data = await res.json();
            setCompanies(Array.isArray(data) ? data : []);
        } catch (err: any) {
            setError(err.message || 'Error al cargar empresas.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const formatDate = (value: string) => {
        if (!value) return '-';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return value;
        return date.toLocaleDateString('es-CO', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleDelete = async (company: CompanyRow) => {
        if (!window.confirm(`¿Desea inactivar la empresa "${company.name}"?`)) return;
        
        try {
            const csrf = getCsrfTokenFromDocument();
            const res = await fetch('/api/admin/companies', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(csrf ? { 'x-csrf-token': csrf } : {})
                },
                body: JSON.stringify({
                    id: company.id,
                    name: company.name,
                    code: company.code,
                    description: company.description,
                    legalName: company.legalName,
                    isActive: false
                })
            });
            if (!res.ok) throw new Error('Error al inactivar la empresa');
            load();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleReactivate = async (company: CompanyRow) => {
        if (!window.confirm(`¿Desea reactivar la empresa "${company.name}"?`)) return;
        
        try {
            const csrf = getCsrfTokenFromDocument();
            const res = await fetch('/api/admin/companies', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(csrf ? { 'x-csrf-token': csrf } : {})
                },
                body: JSON.stringify({
                    id: company.id,
                    name: company.name,
                    code: company.code,
                    description: company.description,
                    legalName: company.legalName,
                    isActive: true
                })
            });
            if (!res.ok) throw new Error('Error al reactivar la empresa');
            load();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleOpenEdit = (company: CompanyRow) => {
        setEditingCompany(company);
        setEditForm({
            name: company.name,
            code: company.code,
            description: company.description || '',
            legalName: company.legalName || ''
        });
        setIsEditModalOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!editingCompany) return;
        setIsSaving(true);
        try {
            const csrf = getCsrfTokenFromDocument();
            const res = await fetch('/api/admin/companies', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(csrf ? { 'x-csrf-token': csrf } : {})
                },
                body: JSON.stringify({
                    id: editingCompany.id,
                    ...editForm
                })
            });
            if (!res.ok) throw new Error('Error al actualizar');
            setIsEditModalOpen(false);
            load();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="animate-fade-in" style={{ position: 'relative', minHeight: '100%' }}>
            <div className="section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Building className="text-primary" />
                    <h1 className="gradient-text" style={{ fontSize: '2rem', margin: 0 }}>Gestion de Empresas</h1>
                </div>
            </div>

            {loading && (
                <div className="glass-card" style={{ textAlign: 'center' }}>
                    Cargando empresas...
                </div>
            )}

            {error && (
                <div className="glass-card" style={{ border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5' }}>
                    {error}
                </div>
            )}

            {!loading && !error && (
                <>
                <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.03)' }}>
                        <h2 style={{ fontSize: '1rem', margin: 0 }}>Empresas Activas</h2>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)' }}>
                                <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.7rem', letterSpacing: '0.08rem', textTransform: 'uppercase', color: 'var(--muted)' }}>Nombre</th>
                                <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.7rem', letterSpacing: '0.08rem', textTransform: 'uppercase', color: 'var(--muted)' }}>Codigo</th>
                                <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.7rem', letterSpacing: '0.08rem', textTransform: 'uppercase', color: 'var(--muted)' }}>Descripción</th>
                                <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.7rem', letterSpacing: '0.08rem', textTransform: 'uppercase', color: 'var(--muted)' }}>Creado / Actualizado</th>
                                <th style={{ textAlign: 'right', padding: '1rem', fontSize: '0.7rem', letterSpacing: '0.08rem', textTransform: 'uppercase', color: 'var(--muted)' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {companies.filter(c => c.isActive).length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
                                        No hay empresas activas registradas.
                                    </td>
                                </tr>
                            ) : (
                                companies.filter(c => c.isActive).map((company) => (
                                    <tr key={company.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                        <td style={{ padding: '1rem', fontWeight: 600 }}>
                                            <div>{company.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 400 }}>{company.legalName}</div>
                                        </td>
                                        <td style={{ padding: '1rem', color: 'var(--muted)' }}>{company.code}</td>
                                        <td style={{ padding: '1rem', color: 'var(--muted)', fontSize: '0.8rem', maxWidth: '300px', whiteSpace: 'pre-wrap' }}>
                                            {company.description || '---'}
                                        </td>
                                        <td style={{ padding: '1rem', color: 'var(--muted)', fontSize: '0.85rem' }}>
                                            <div><span style={{ fontSize: '0.7rem', opacity: 0.6 }}>C:</span> {formatDate(company.createdAt)}</div>
                                            <div><span style={{ fontSize: '0.7rem', opacity: 0.6 }}>A:</span> {formatDate(company.updatedAt)}</div>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                <button 
                                                    onClick={() => handleOpenEdit(company)}
                                                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '6px', padding: '0.4rem', cursor: 'pointer', color: 'var(--primary)' }}
                                                    title="Editar"
                                                >
                                                    <Edit3 size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(company)}
                                                    style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', padding: '0.4rem', cursor: 'pointer', color: '#f87171' }}
                                                    title="Inactivar"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="glass-card" id="empresa-inactivo" style={{ padding: 0, overflow: 'hidden', marginTop: '2rem' }}>
                    <div style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.03)' }}>
                        <h2 style={{ fontSize: '1rem', margin: 0, color: '#fca5a5' }}>Empresas Inactivas</h2>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)' }}>
                                <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.7rem', letterSpacing: '0.08rem', textTransform: 'uppercase', color: 'var(--muted)' }}>Nombre</th>
                                <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.7rem', letterSpacing: '0.08rem', textTransform: 'uppercase', color: 'var(--muted)' }}>Codigo</th>
                                <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.7rem', letterSpacing: '0.08rem', textTransform: 'uppercase', color: 'var(--muted)' }}>Descripción</th>
                                <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.7rem', letterSpacing: '0.08rem', textTransform: 'uppercase', color: 'var(--muted)' }}>Creado / Actualizado</th>
                                <th style={{ textAlign: 'right', padding: '1rem', fontSize: '0.7rem', letterSpacing: '0.08rem', textTransform: 'uppercase', color: 'var(--muted)' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {companies.filter(c => !c.isActive).length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
                                        No hay empresas inactivas.
                                    </td>
                                </tr>
                            ) : (
                                companies.filter(c => !c.isActive).map((company) => (
                                    <tr key={company.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                        <td style={{ padding: '1rem', fontWeight: 600, opacity: 0.7 }}>
                                            <div>{company.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 400 }}>{company.legalName}</div>
                                        </td>
                                        <td style={{ padding: '1rem', color: 'var(--muted)', opacity: 0.7 }}>{company.code}</td>
                                        <td style={{ padding: '1rem', color: 'var(--muted)', fontSize: '0.8rem', opacity: 0.7, maxWidth: '300px', whiteSpace: 'pre-wrap' }}>
                                            {company.description || '---'}
                                        </td>
                                        <td style={{ padding: '1rem', color: 'var(--muted)', fontSize: '0.85rem', opacity: 0.7 }}>
                                            <div><span style={{ fontSize: '0.7rem', opacity: 0.6 }}>C:</span> {formatDate(company.createdAt)}</div>
                                            <div><span style={{ fontSize: '0.7rem', opacity: 0.6 }}>A:</span> {formatDate(company.updatedAt)}</div>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                <button 
                                                    onClick={() => handleReactivate(company)}
                                                    style={{ background: 'rgba(52, 211, 153, 0.1)', border: '1px solid rgba(52, 211, 153, 0.2)', borderRadius: '6px', padding: '0.4rem', cursor: 'pointer', color: '#34d399' }}
                                                    title="Reactivar"
                                                >
                                                    <CheckCircle2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                </>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                <Link
                    href="/admin/empresa/nuevo"
                    style={{
                        border: '1px solid rgba(59, 130, 246, 0.45)',
                        background: 'rgba(59, 130, 246, 0.18)',
                        color: '#dbeafe',
                        borderRadius: '10px',
                        padding: '0.75rem 1.25rem',
                        fontWeight: 600,
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                    }}
                >
                    <Plus size={16} /> Crear empresa
                </Link>
                <Link
                    href="/score/dashboard"
                    style={{
                        border: '1px solid rgba(148, 163, 184, 0.45)',
                        background: 'rgba(30, 41, 59, 0.55)',
                        color: '#e2e8f0',
                        borderRadius: '10px',
                        padding: '0.75rem 1.25rem',
                        fontWeight: 600,
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                    }}
                >
                    Cerrar
                </Link>
            </div>

            {/* Modal de edición */}
            {isEditModalOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.7)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '1rem'
                }}>
                    <div className="glass-card animate-scale-in" style={{ width: '100%', maxWidth: '500px', margin: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 className="gradient-text" style={{ margin: 0 }}>Editar Empresa</h2>
                            <button onClick={() => setIsEditModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            <div>
                                <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>Nombre comercial</label>
                                <input 
                                    value={editForm.name} 
                                    onChange={e => setEditForm({...editForm, name: e.target.value})}
                                    style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white' }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>Codigo</label>
                                <input 
                                    value={editForm.code} 
                                    onChange={e => setEditForm({...editForm, code: e.target.value.toUpperCase()})}
                                    style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white' }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>Descripción</label>
                                <textarea 
                                    value={editForm.description} 
                                    onChange={e => setEditForm({...editForm, description: e.target.value})}
                                    rows={2}
                                    style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white', resize: 'vertical' }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>Razon social</label>
                                <input 
                                    value={editForm.legalName} 
                                    onChange={e => setEditForm({...editForm, legalName: e.target.value})}
                                    style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white' }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                            <button 
                                onClick={() => setIsEditModalOpen(false)}
                                style={{ background: 'transparent', border: '1px solid var(--glass-border)', color: 'white', padding: '0.6rem 1rem', borderRadius: '8px', cursor: 'pointer' }}
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleSaveEdit}
                                disabled={isSaving}
                                style={{ background: 'var(--primary)', border: 'none', color: 'white', padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, opacity: isSaving ? 0.7 : 1 }}
                            >
                                {isSaving ? 'Guardando...' : 'Guardar cambios'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
