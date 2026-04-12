"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Building, CheckCircle2, X } from 'lucide-react';
import Link from 'next/link';
import { getCsrfTokenFromDocument } from '@/lib/client-csrf';

export default function EmpresaNuevoClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const returnTo = searchParams.get('return_to') || '/admin/empresa';
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [description, setDescription] = useState('');
    const [legalName, setLegalName] = useState('');
    const [statusId, setStatusId] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const ensureCsrf = async () => {
            const existing = getCsrfTokenFromDocument();
            if (existing) return;
            try {
                await fetch('/api/auth/csrf');
            } catch (err) {
                console.error('Error fetching CSRF token:', err);
            }
        };
        ensureCsrf();
    }, []);

    const handleSubmit = async () => {
        setError(null);
        setLoading(true);
        const isProd = process.env.NODE_ENV === 'production';
        let csrf = getCsrfTokenFromDocument();
        if (!csrf && !isProd) {
            csrf = null;
        }
        if (!csrf && isProd) {
            try {
                await fetch('/api/auth/csrf');
                csrf = getCsrfTokenFromDocument();
            } catch {
                // ignore
            }
        }
        if (!csrf && isProd) {
            setError('CSRF token invalido.');
            setLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/admin/companies', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(csrf ? { 'x-csrf-token': csrf } : {})
                },
                body: JSON.stringify({ 
                    name, 
                    description, 
                    isActive: statusId === 1 
                })
            });

            if (res.status === 409) {
                const data = await res.json();
                setError('El codigo de empresa ya existe.');
                if (data.companyId) {
                    setTimeout(() => {
                        const url = new URL(returnTo, window.location.origin);
                        url.searchParams.set('company_id', data.companyId);
                        router.push(url.pathname + url.search);
                    }, 800);
                }
                setLoading(false);
                return;
            }

            if (!res.ok) {
                const data = await res.json();
                setError(data.error || 'Error al crear empresa.');
                setLoading(false);
                return;
            }

            const data = await res.json();
            setSuccess(true);
            setTimeout(() => {
                const url = new URL(returnTo, window.location.origin);
                url.searchParams.set('company_id', data.companyId);
                router.push(url.pathname + url.search);
            }, 900);
        } catch (err) {
            console.error('Error creating company:', err);
            setError('Error al crear empresa.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Building className="text-primary" />
                    <h1 className="gradient-text" style={{ fontSize: '2rem', margin: 0 }}>Crear Empresa</h1>
                </div>
                <Link
                    href={returnTo}
                    style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        textDecoration: 'none', 
                        background: 'rgba(255,255,255,0.05)', 
                        border: '1px solid var(--glass-border)',
                        borderRadius: '50%',
                        width: '36px',
                        height: '36px',
                        color: 'var(--muted)',
                        transition: 'all 0.2s ease'
                    }}
                    title="Cerrar"
                >
                    <X size={18} />
                </Link>
            </div>

            <div className="glass-card" style={{ maxWidth: '720px', margin: '0 auto' }}>
                <div style={{ display: 'grid', gap: '1rem' }}>
                    <div>
                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Nombre comercial</label>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Corporativo Principal"
                            style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white' }}
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Descripción</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={5}
                            placeholder="Descripción de la empresa..."
                            style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white', resize: 'vertical', minHeight: '120px' }}
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Estado</label>
                        <select
                            value={statusId}
                            onChange={(e) => setStatusId(Number(e.target.value))}
                            style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white' }}
                        >
                            <option value={1}>Activo</option>
                            <option value={0}>Inactivo</option>
                        </select>
                    </div>
                </div>

                {error && <div style={{ color: '#f87171', fontSize: '0.85rem', marginTop: '1rem' }}>{error}</div>}
                {success && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', marginTop: '1rem' }}>
                        <CheckCircle2 size={18} /> Empresa creada
                    </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                    <Link 
                        href={returnTo} 
                        style={{ 
                            background: 'transparent', 
                            border: '1px solid var(--glass-border)', 
                            color: 'white',
                            textDecoration: 'none',
                            padding: '0.75rem 1.25rem',
                            borderRadius: '10px',
                            fontWeight: 'bold',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                        }}
                    >
                        Cerrar
                    </Link>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        style={{
                            background: 'var(--primary)',
                            color: 'white',
                            border: 'none',
                            padding: '0.75rem 1.25rem',
                            borderRadius: '10px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        {loading ? 'Guardando...' : 'Crear empresa'}
                    </button>
                </div>
            </div>
        </div>
    );
}
