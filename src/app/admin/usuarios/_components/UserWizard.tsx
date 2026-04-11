"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, ShieldCheck } from 'lucide-react';
import { getCsrfTokenFromDocument } from '@/lib/client-csrf';

interface UserWizardProps {
    mode: 'create' | 'edit';
    userId?: string;
}

interface CompanyOption {
    id: string;
    name: string;
    code: string;
    statusId?: number;
}

export default function UserWizard({ mode, userId }: UserWizardProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [duplicateUserId, setDuplicateUserId] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [tenantId, setTenantId] = useState('');
    const [companies, setCompanies] = useState<CompanyOption[]>([]);

    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [lastName, setLastName] = useState('');
    const [whatsapp, setWhatsapp] = useState('');
    const [password, setPassword] = useState('');
    const [mustChangePassword, setMustChangePassword] = useState(true);
    const [isActive, setIsActive] = useState(true);
    const [selectedRoleCodes, setSelectedRoleCodes] = useState<string[]>([]);
    const [roles, setRoles] = useState<{ id: string; code: string; name: string }[]>([]);

    useEffect(() => {
        const loadContext = async () => {
            try {
                const res = await fetch('/api/auth/me');
                if (!res.ok) return;
                const data = await res.json();
                setTenantId((prev) => prev || data.tenantId);
            } catch (err) {
                console.error('Error loading auth context:', err);
            }
        };
        loadContext();
    }, []);

    useEffect(() => {
        const companyFromQuery = searchParams.get('company_id');
        if (companyFromQuery) {
            setTenantId(companyFromQuery);
        }
    }, [searchParams]);

    useEffect(() => {
        const loadCompanies = async () => {
            try {
                const res = await fetch('/api/admin/companies');
                if (!res.ok) return;
                const data = await res.json();
                setCompanies(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error('Error loading companies:', err);
            }
        };
        loadCompanies();
    }, []);

    useEffect(() => {
        const loadRoles = async () => {
            try {
                const res = await fetch('/api/admin/rbac');
                if (!res.ok) return;
                const data = await res.json();
                setRoles(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error('Error loading roles:', err);
            }
        };
        loadRoles();
    }, []);

    useEffect(() => {
        if (mode !== 'edit' || !userId) return;
        const loadUser = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`/api/admin/users/${userId}`);
                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || 'Failed to load user');
                }
                const data = await res.json();
                
                if (!data.user) throw new Error('Usuario no encontrado');

                setEmail(data.user.email || '');
                setName(data.user.name || '');
                setLastName(data.user.lastName || '');
                setWhatsapp(data.user.whatsapp || '');
                
                const incomingRoleCodes = Array.isArray(data.user.roles)
                    ? data.user.roles.map((role: { roleCode: string }) => role.roleCode).filter(Boolean)
                    : [];
                if (incomingRoleCodes.length > 0) {
                    setSelectedRoleCodes(incomingRoleCodes);
                } else if (data.user.roleCode) {
                    setSelectedRoleCodes([data.user.roleCode]);
                } else {
                    setSelectedRoleCodes([]);
                }

                if (typeof data.user.mustChangePassword === 'boolean') {
                    setMustChangePassword(data.user.mustChangePassword);
                }
                if (typeof data.user.isActive === 'boolean') {
                    setIsActive(data.user.isActive);
                }
                if (data.user.tenantId) {
                    setTenantId(data.user.tenantId);
                }
            } catch (err: any) {
                console.error('Error loading user:', err);
                setError(err.message || 'Error al cargar el usuario');
            } finally {
                setLoading(false);
            }
        };
        loadUser();
    }, [mode, userId]);

    const handleSubmit = async () => {
        setError(null);
        setDuplicateUserId(null);
        if (!tenantId) {
            setError('Seleccione una empresa.');
            return;
        }
        if (!name || !email) {
            setError('Nombre y email son obligatorios.');
            return;
        }
        if (mode === 'create' && !password) {
            setError('El password inicial es obligatorio.');
            return;
        }
        setLoading(true);
        const isProd = process.env.NODE_ENV === 'production';
        const csrf = getCsrfTokenFromDocument();
        if (!csrf && isProd) {
            setError('CSRF token invalido.');
            setLoading(false);
            return;
        }

        try {
            const payload: Record<string, any> = {
                tenantId,
                email,
                name,
                lastName,
                whatsapp,
                roleCodes: selectedRoleCodes,
                isActive,
                mustChangePassword
            };
            if (mode === 'create') {
                payload.password = password;
            }

            const res = await fetch(mode === 'create' ? '/api/admin/users' : `/api/admin/users/${userId}`, {
                method: mode === 'create' ? 'POST' : 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...(csrf ? { 'x-csrf-token': csrf } : {})
                },
                body: JSON.stringify(payload)
            });

            if (res.status === 409) {
                const data = await res.json();
                setError('Email duplicado.');
                setDuplicateUserId(data.userId);
                setLoading(false);
                return;
            }

            if (!res.ok) {
                const data = await res.json();
                setError(data.error || 'Error al guardar.');
                setLoading(false);
                return;
            }

            const data = await res.json();
            setSuccess(true);
            setTimeout(() => {
                router.push('/admin/usuarios');
            }, 1800);
        } catch (err) {
            console.error('Error saving user:', err);
            setError('Error al guardar el usuario.');
        } finally {
            setLoading(false);
        }
    };

    const formError = useMemo(() => {
        if (!tenantId) return 'Seleccione una empresa.';
        if (!name || !email) return 'Nombre y email son obligatorios.';
        if (selectedRoleCodes.length === 0) return 'Seleccione al menos un rol.';
        if (mode === 'create' && !password) return 'El password inicial es obligatorio.';
        return null;
    }, [tenantId, name, email, selectedRoleCodes, mode, password]);

    const selectedRolesSet = useMemo(() => new Set(selectedRoleCodes), [selectedRoleCodes]);

    const toggleRole = (roleCode: string) => {
        setSelectedRoleCodes((prev) => {
            if (prev.includes(roleCode)) {
                return prev.filter((code) => code !== roleCode);
            }
            return [...prev, roleCode];
        });
    };

    return (
        <div className="glass-card" style={{ padding: '2rem' }}>
            <div style={{ marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>
                    {mode === 'create' ? 'Nuevo Usuario' : 'Editar Usuario'}
                </h2>
                <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Configure la identidad, el rol y los alcances del usuario.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                {/* Section 1: Identity and Role */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div>
                            <label
                                onDoubleClick={() => router.push('/admin/empresa/nuevo?return_to=/admin/usuarios/nuevo')}
                                style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem', cursor: 'pointer' }}
                                title="Doble clic para crear empresa"
                            >
                                Empresa
                            </label>
                            <select
                                value={tenantId}
                                onChange={(e) => setTenantId(e.target.value)}
                                style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white' }}
                                disabled={mode === 'edit'}
                            >
                                <option value="">Seleccione...</option>
                                {companies.map((company) => (
                                    <option key={company.id} value={company.id}>
                                        {company.name} ({company.code})
                                    </option>
                                ))}
                            </select>
                            {companies.length === 0 && (
                                <div style={{ marginTop: '0.35rem', fontSize: '0.75rem', color: 'var(--muted)' }}>
                                    No hay empresas. Doble clic en "Empresa" para crear una.
                                </div>
                            )}
                        </div>
                        <div>
                            <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Nombre</label>
                            <input
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                autoComplete="given-name"
                                name="given-name"
                                style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Apellido</label>
                            <input
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                autoComplete="family-name"
                                name="family-name"
                                style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Email corporativo</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                                name="email"
                                style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Username</label>
                            <input
                                value={email}
                                disabled
                                autoComplete="username"
                                name="username"
                                style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--muted)' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>WhatsApp</label>
                            <input
                                value={whatsapp}
                                onChange={(e) => setWhatsapp(e.target.value)}
                                autoComplete="tel"
                                name="tel"
                                placeholder="+57 300 000 0000"
                                style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white' }}
                            />
                        </div>
                        {/* Selector de roles se gestiona en panel derecho */}
                    </div>
                    <div className="glass-card" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>
                            <ShieldCheck size={18} />
                            <h3 style={{ margin: 0, fontSize: '1rem' }}>Permisos incluidos</h3>
                        </div>
                        <p style={{ margin: '0 0 0.75rem', color: 'var(--muted)', fontSize: '0.8rem' }}>
                            Seleccione uno o más roles para este usuario.
                        </p>
                        {roles.length === 0 ? (
                            <p style={{ color: 'var(--muted)' }}>No hay roles activos disponibles.</p>
                        ) : (
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                                    gap: '0.65rem',
                                    maxHeight: '320px',
                                    overflowY: 'auto',
                                }}
                            >
                                {roles.map((role) => {
                                    const selected = selectedRolesSet.has(role.code);
                                    return (
                                        <button
                                            key={role.id}
                                            type="button"
                                            onClick={() => toggleRole(role.code)}
                                            style={{
                                                textAlign: 'left',
                                                padding: '0.7rem 0.75rem',
                                                borderRadius: '8px',
                                                border: selected ? '1px solid rgba(16,185,129,0.55)' : '1px solid var(--glass-border)',
                                                background: selected ? 'rgba(16,185,129,0.14)' : 'rgba(255,255,255,0.02)',
                                                color: selected ? '#d1fae5' : 'var(--foreground)',
                                                cursor: 'pointer',
                                                display: 'grid',
                                                gap: '0.2rem',
                                            }}
                                        >
                                            <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{role.name}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                        <p style={{ margin: '0.85rem 0 0', color: 'var(--muted)', fontSize: '0.75rem' }}>
                            Seleccionados: {selectedRoleCodes.length}
                        </p>
                        {formError === 'Seleccione al menos un rol.' && (
                            <p style={{ margin: '0.45rem 0 0', color: '#f87171', fontSize: '0.8rem' }}>
                                Debe seleccionar al menos un rol.
                            </p>
                        )}
                    </div>
                </div>

                {/* Section 2: Security */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingTop: '2rem', borderTop: '1px solid var(--glass-border)' }}>
                    {mode === 'edit' && (
                        <div className="glass-card" style={{ padding: '1rem' }}>
                            <div style={{ display: 'grid', gap: '0.75rem' }}>
                                <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase' }}>
                                    Estado del usuario
                                </label>
                                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                    <button
                                        type="button"
                                        onClick={() => setIsActive(true)}
                                        style={{
                                            border: isActive ? '1px solid rgba(16,185,129,0.55)' : '1px solid var(--glass-border)',
                                            background: isActive ? 'rgba(16,185,129,0.14)' : 'rgba(255,255,255,0.03)',
                                            color: isActive ? '#d1fae5' : 'var(--foreground)',
                                            borderRadius: '10px',
                                            padding: '0.6rem 1rem',
                                            fontWeight: 700,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Activo
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsActive(false)}
                                        style={{
                                            border: !isActive ? '1px solid rgba(239,68,68,0.55)' : '1px solid var(--glass-border)',
                                            background: !isActive ? 'rgba(239,68,68,0.14)' : 'rgba(255,255,255,0.03)',
                                            color: !isActive ? '#fecaca' : 'var(--foreground)',
                                            borderRadius: '10px',
                                            padding: '0.6rem 1rem',
                                            fontWeight: 700,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Inactivo
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {mode === 'create' && (
                        <div className="glass-card" style={{ padding: '1rem' }}>
                            <div style={{ display: 'grid', gap: '0.75rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Password inicial</label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        autoComplete="new-password"
                                        name="new-password"
                                        style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white' }}
                                    />
                                </div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--muted)', fontSize: '0.85rem' }}>
                                    <input
                                        type="checkbox"
                                        checked={mustChangePassword}
                                        onChange={(e) => setMustChangePassword(e.target.checked)}
                                    />
                                    Forzar cambio de password en el primer login
                                </label>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div style={{ color: '#f87171', fontSize: '0.85rem' }}>
                            {error}
                            {duplicateUserId && (
                                <div>
                                    <a href={`/admin/usuarios/${duplicateUserId}`} style={{ color: '#60a5fa' }}>
                                        Abrir edicion
                                    </a>
                                </div>
                            )}
                        </div>
                    )}

                    {success && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981' }}>
                            <CheckCircle2 size={18} /> Usuario guardado
                        </div>
                    )}



                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <button
                            onClick={() => router.back()}
                            style={{
                                background: 'transparent',
                                color: 'white',
                                border: '1px solid var(--glass-border)',
                                padding: '0.75rem 1.25rem',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading || !!formError}
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
                            {loading ? 'Guardando...' : mode === 'create' ? 'Crear usuario' : 'Guardar cambios'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
