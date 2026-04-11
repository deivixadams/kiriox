"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react';
import { getCsrfTokenFromDocument } from '@/lib/client-csrf';

interface UserWizardProps {
    mode: 'create' | 'edit';
    userId?: string;
}

interface Jurisdiction {
    id: string;
    code: string;
    name: string;
}

interface Framework {
    id: string;
    code: string;
    name: string;
}

interface FrameworkVersion {
    id: string;
    version: string;
    status: string;
    isActive: boolean;
}

interface ScopeItem {
    jurisdictionId: string;
    frameworkVersionId: string | null;
    domainId?: string | null;
    isAllowed: boolean;
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
    const [step, setStep] = useState(1);
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
    const [roleCode, setRoleCode] = useState('');
    const [roles, setRoles] = useState<{ id: string; code: string; name: string }[]>([]);

    const [rolePermissions, setRolePermissions] = useState<string[]>([]);

    const [jurisdictions, setJurisdictions] = useState<Jurisdiction[]>([]);
    const [frameworks, setFrameworks] = useState<Framework[]>([]);
    const [frameworkVersions, setFrameworkVersions] = useState<FrameworkVersion[]>([]);
    const [scopes, setScopes] = useState<ScopeItem[]>([]);

    const [scopeDraft, setScopeDraft] = useState({
        jurisdictionId: '',
        frameworkId: '',
        frameworkVersionId: '',
        allowAllVersions: false
    });

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
        const loadJurisdictions = async () => {
            try {
                const res = await fetch('/api/admin/scopes/jurisdictions');
                if (!res.ok) return;
                const data = await res.json();
                setJurisdictions(data);
            } catch (err) {
                console.error('Error loading jurisdictions:', err);
            }
        };
        loadJurisdictions();
    }, []);

    useEffect(() => {
        if (!roleCode) return;
        const loadPermissions = async () => {
            try {
                const res = await fetch(`/api/admin/rbac?role_code=${encodeURIComponent(roleCode)}`);
                if (!res.ok) return;
                const data = await res.json();
                setRolePermissions(data.permissions || []);
            } catch (err) {
                console.error('Error loading permissions:', err);
            }
        };
        loadPermissions();
    }, [roleCode]);

    useEffect(() => {
        if (mode !== 'edit' || !userId) return;
        const loadUser = async () => {
            try {
                const res = await fetch(`/api/admin/users/${userId}`);
                if (!res.ok) return;
                const data = await res.json();
                setEmail(data.user.email);
                setName(data.user.name || '');
                setLastName(data.user.lastName || '');
                setWhatsapp(data.user.whatsapp || '');
                setRoleCode(data.user.role?.roleCode || 'OPERATOR');
                if (typeof data.user.mustChangePassword === 'boolean') {
                    setMustChangePassword(data.user.mustChangePassword);
                }
                if (data.user.tenantId) {
                    setTenantId(data.user.tenantId);
                }
                setScopes(data.scopes || []);
            } catch (err) {
                console.error('Error loading user:', err);
            }
        };
        loadUser();
    }, [mode, userId]);

    useEffect(() => {
        if (!scopeDraft.jurisdictionId) {
            setFrameworks([]);
            setFrameworkVersions([]);
            return;
        }
        const loadFrameworks = async () => {
            try {
                const res = await fetch(`/api/admin/scopes/frameworks?jurisdiction_id=${scopeDraft.jurisdictionId}`);
                if (!res.ok) return;
                const data = await res.json();
                setFrameworks(data);
            } catch (err) {
                console.error('Error loading frameworks:', err);
            }
        };
        loadFrameworks();
    }, [scopeDraft.jurisdictionId]);

    useEffect(() => {
        if (!scopeDraft.frameworkId) {
            setFrameworkVersions([]);
            return;
        }
        const loadFrameworkVersions = async () => {
            try {
                const res = await fetch(`/api/admin/scopes/framework-versions?framework_id=${scopeDraft.frameworkId}`);
                if (!res.ok) return;
                const data = await res.json();
                setFrameworkVersions(data);
            } catch (err) {
                console.error('Error loading framework versions:', err);
            }
        };
        loadFrameworkVersions();
    }, [scopeDraft.frameworkId]);

    const scopeLabels = useMemo(() => {
        const jurisdictionMap = new Map(jurisdictions.map((j) => [j.id, j.name]));
        const frameworkVersionMap = new Map(frameworkVersions.map((fv) => [fv.id, fv.version]));
        return { jurisdictionMap, frameworkVersionMap };
    }, [jurisdictions, frameworkVersions]);

    const addScope = () => {
        setError(null);
        setDuplicateUserId(null);
        if (!scopeDraft.jurisdictionId) {
            setError('Seleccione una jurisdiccion.');
            return;
        }
        if (!scopeDraft.allowAllVersions && !scopeDraft.frameworkVersionId) {
            setError('Seleccione una version de framework o permita todas las versiones.');
            return;
        }

        setScopes((prev) => [
            ...prev,
            {
                jurisdictionId: scopeDraft.jurisdictionId,
                frameworkVersionId: scopeDraft.allowAllVersions ? null : scopeDraft.frameworkVersionId,
                isAllowed: true
            }
        ]);

        setScopeDraft({
            jurisdictionId: scopeDraft.jurisdictionId,
            frameworkId: '',
            frameworkVersionId: '',
            allowAllVersions: false
        });
    };

    const removeScope = (index: number) => {
        setScopes((prev) => prev.filter((_, i) => i !== index));
    };

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
                roleCode,
                scopes,
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

    return (
        <div className="glass-card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                <button
                    onClick={() => setStep(1)}
                    style={{
                        flex: 1,
                        padding: '0.75rem',
                        borderRadius: '10px',
                        border: step === 1 ? '1px solid var(--primary)' : '1px solid var(--glass-border)',
                        background: step === 1 ? 'rgba(59,130,246,0.1)' : 'transparent',
                        color: 'white',
                        fontWeight: 700,
                        cursor: 'pointer'
                    }}
                >
                    1. Identidad y Rol
                </button>
                <button
                    onClick={() => setStep(2)}
                    style={{
                        flex: 1,
                        padding: '0.75rem',
                        borderRadius: '10px',
                        border: step === 2 ? '1px solid var(--primary)' : '1px solid var(--glass-border)',
                        background: step === 2 ? 'rgba(59,130,246,0.1)' : 'transparent',
                        color: 'white',
                        fontWeight: 700,
                        cursor: 'pointer'
                    }}
                >
                    2. Alcance y Seguridad
                </button>
            </div>

            {step === 1 && (
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
                        <div>
                            <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Rol</label>
                            <select
                                value={roleCode}
                                onChange={(e) => setRoleCode(e.target.value)}
                                style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white' }}
                            >
                                <option value="">Seleccione...</option>
                                {roles.map((r) => (
                                    <option key={r.id} value={r.code}>{r.name}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                            <button
                                onClick={() => setStep(2)}
                                style={{
                                    background: 'var(--primary)',
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.75rem 1.25rem',
                                    borderRadius: '10px',
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    cursor: 'pointer'
                                }}
                            >
                                Siguiente <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                    <div className="glass-card" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>
                            <ShieldCheck size={18} />
                            <h3 style={{ margin: 0, fontSize: '1rem' }}>Permisos incluidos</h3>
                        </div>
                        {rolePermissions.length === 0 ? (
                            <p style={{ color: 'var(--muted)' }}>No hay permisos asignados para este rol.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {rolePermissions.map((perm) => (
                                    <div key={perm} style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--glass-border)', borderRadius: '8px' }}>
                                        {perm}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {step === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                        <div>
                            <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Jurisdiccion</label>
                            <select
                                value={scopeDraft.jurisdictionId}
                                onChange={(e) => setScopeDraft({ ...scopeDraft, jurisdictionId: e.target.value, frameworkId: '', frameworkVersionId: '' })}
                                style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white' }}
                            >
                                <option value="">Seleccione...</option>
                                {jurisdictions.map((j) => (
                                    <option key={j.id} value={j.id}>{j.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Framework</label>
                            <select
                                value={scopeDraft.frameworkId}
                                onChange={(e) => setScopeDraft({ ...scopeDraft, frameworkId: e.target.value, frameworkVersionId: '' })}
                                style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white' }}
                                disabled={!scopeDraft.jurisdictionId}
                            >
                                <option value="">Seleccione...</option>
                                {frameworks.map((f) => (
                                    <option key={f.id} value={f.id}>{f.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Framework version</label>
                            <select
                                value={scopeDraft.frameworkVersionId}
                                onChange={(e) => setScopeDraft({ ...scopeDraft, frameworkVersionId: e.target.value })}
                                style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white' }}
                                disabled={!scopeDraft.frameworkId || scopeDraft.allowAllVersions}
                            >
                                <option value="">Seleccione...</option>
                                {frameworkVersions.map((fv) => (
                                    <option key={fv.id} value={fv.id}>{fv.version}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.75rem' }}>
                            <input
                                type="checkbox"
                                checked={scopeDraft.allowAllVersions}
                                onChange={(e) => setScopeDraft({ ...scopeDraft, allowAllVersions: e.target.checked, frameworkVersionId: '' })}
                            />
                            <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Permitir todas las versiones</span>
                        </div>
                    </div>
                    <button
                        onClick={addScope}
                        style={{
                            alignSelf: 'flex-start',
                            background: 'rgba(59,130,246,0.2)',
                            color: 'white',
                            border: '1px solid var(--glass-border)',
                            padding: '0.6rem 1rem',
                            borderRadius: '8px',
                            cursor: 'pointer'
                        }}
                    >
                        + Agregar alcance
                    </button>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {scopes.length === 0 ? (
                            <p style={{ color: 'var(--muted)' }}>No hay alcances definidos. (deny-by-default)</p>
                        ) : scopes.map((scope, index) => (
                            <div key={`${scope.jurisdictionId}-${index}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', border: '1px solid var(--glass-border)', borderRadius: '8px' }}>
                                <div>
                                    <div style={{ fontWeight: 'bold' }}>{scopeLabels.jurisdictionMap.get(scope.jurisdictionId) || scope.jurisdictionId}</div>
                                    <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>
                                        {scope.frameworkVersionId ? scopeLabels.frameworkVersionMap.get(scope.frameworkVersionId) || scope.frameworkVersionId : 'Todas las versiones'}
                                    </div>
                                </div>
                                <button
                                    onClick={() => removeScope(index)}
                                    style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}
                                >
                                    Quitar
                                </button>
                            </div>
                        ))}
                    </div>

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



                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <button
                            onClick={() => setStep(1)}
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
                            <ChevronLeft size={16} /> Volver
                        </button>
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
                            {loading ? 'Guardando...' : mode === 'create' ? 'Crear usuario' : 'Guardar cambios'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
