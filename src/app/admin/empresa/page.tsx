"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Building, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

type CompanyRow = {
    id: string;
    name: string;
    code: string;
    statusId: number;
    createdAt: string;
    updatedAt: string;
};

export default function EmpresaPage() {
    const router = useRouter();
    const [companies, setCompanies] = useState<CompanyRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch('/api/admin/companies');
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
        load();
    }, []);

    const formatDate = (value: string) => {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return value;
        return date.toLocaleDateString('es-CO', {
            year: 'numeric',
            month: 'short',
            day: '2-digit'
        });
    };

    return (
        <div className="animate-fade-in">
            <div className="section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Building className="text-primary" />
                    <h1 className="gradient-text" style={{ fontSize: '2rem', margin: 0 }}>Gestion de Empresas</h1>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Link
                        href="/admin/empresa/nuevo"
                        className="btn-primary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}
                    >
                        <Plus size={16} /> Crear empresa
                    </Link>
                    <Link
                        href="/admin"
                        className="btn-primary"
                        style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none', background: 'transparent', border: '1px solid var(--glass-border)' }}
                    >
                        [X]
                    </Link>
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
                <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)' }}>
                                <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.7rem', letterSpacing: '0.08rem', textTransform: 'uppercase', color: 'var(--muted)' }}>Nombre</th>
                                <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.7rem', letterSpacing: '0.08rem', textTransform: 'uppercase', color: 'var(--muted)' }}>Codigo</th>
                                <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.7rem', letterSpacing: '0.08rem', textTransform: 'uppercase', color: 'var(--muted)' }}>Estado</th>
                                <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.7rem', letterSpacing: '0.08rem', textTransform: 'uppercase', color: 'var(--muted)' }}>Creado / Actualizado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {companies.length === 0 ? (
                                <tr>
                                    <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
                                        No hay empresas registradas.
                                    </td>
                                </tr>
                            ) : (
                                companies.map((company) => (
                                    <tr key={company.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                        <td style={{ padding: '1rem', fontWeight: 600 }}>{company.name}</td>
                                        <td style={{ padding: '1rem', color: 'var(--muted)' }}>{company.code}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '999px',
                                                fontSize: '0.7rem',
                                                fontWeight: 700,
                                                color: company.statusId === 1 ? '#34d399' : '#f87171',
                                                background: company.statusId === 1 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(248, 113, 113, 0.15)'
                                            }}>
                                                {company.statusId === 1 ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', color: 'var(--muted)', fontSize: '0.85rem' }}>
                                            {formatDate(company.createdAt)} / {formatDate(company.updatedAt)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
