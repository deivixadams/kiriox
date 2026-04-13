"use client";

import { useEffect, useMemo, useState } from 'react';
import {
    Users,
    Search,
    ArrowLeft,
    ShieldCheck,
    Edit3,
    Lock,
    Trash2,
    CheckCircle2,
    X
} from 'lucide-react';
import Link from 'next/link';
import { getCsrfTokenFromDocument } from '@/lib/client-csrf';
import { useRouter } from 'next/navigation';

interface UserRow {
    id: string;
    name: string | null;
    lastName?: string | null;
    email: string;
    companyName?: string | null;
    roles?: {
        roleCode: string;
        roleName?: string | null;
    }[];
    isActive: boolean;
    activationStatus: string;
    createdAt: string;
    updatedAt: string;
}

interface RolePermissionsState {
    roleCode: string;
    permissions: string[];
}

export default function UserManagementPage() {
    const router = useRouter();
    const [users, setUsers] = useState<UserRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [rolePermissions, setRolePermissions] = useState<RolePermissionsState | null>(null);
    const [resetPasswordUser, setResetPasswordUser] = useState<UserRow | null>(null);
    const [resetForm, setResetForm] = useState({ newPassword: '', confirmPassword: '' });
    const [resetError, setResetError] = useState<string | null>(null);
    const [isResetting, setIsResetting] = useState(false);
    const [resetSuccess, setResetSuccess] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/admin/users');
            if (res.status === 401 || res.status === 403) {
                router.replace('/login');
                return;
            }
            if (!res.ok) {
                const data = await res.json();
                setError(data.error || 'No se pudo cargar usuarios.');
                return;
            }
            const data = await res.json();
            setUsers(data);
        } catch (err) {
            console.error('Error fetching users:', err);
            setError('Error al cargar usuarios.');
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return users;
        return users.filter((u) => {
            const name = `${u.name ?? ''} ${u.lastName ?? ''}`.trim().toLowerCase();
            const email = u.email.toLowerCase();
            return name.includes(term) || email.includes(term);
        });
    }, [users, search]);

    const getStatusLabel = (user: UserRow) => {
        if (user.isActive) return { label: 'true', color: '#10b981' };
        return { label: 'false', color: '#64748b' };
    };

    const openRolePermissions = async (roleCode: string) => {
        try {
            const res = await fetch(`/api/admin/rbac?role_code=${encodeURIComponent(roleCode)}`);
            if (!res.ok) return;
            const data = await res.json();
            setRolePermissions(data);
        } catch (err) {
            console.error('Error loading permissions:', err);
        }
    };

    const handleToggleActive = async (user: UserRow) => {
        const csrf = getCsrfTokenFromDocument();
        if (!csrf) return;
        try {
            const res = await fetch(`/api/admin/users/${user.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'x-csrf-token': csrf
                },
                body: JSON.stringify({ isActive: !user.isActive })
            });
            if (res.ok) {
                await fetchUsers();
            } else {
                const data = await res.json().catch(() => ({}));
                setError(data.error || 'No se pudo actualizar el estado del usuario.');
            }
        } catch (err) {
            console.error('Error toggling user status:', err);
            setError('Error al actualizar el estado del usuario.');
        }
    };

    const handleOpenResetDialog = (user: UserRow) => {
        setResetPasswordUser(user);
        setResetForm({ newPassword: '', confirmPassword: '' });
        setResetError(null);
        setResetSuccess(false);
    };

    const submitPasswordReset = async () => {
        if (!resetPasswordUser) return;
        if (!resetForm.newPassword) {
            setResetError('La contraseña no puede estar en blanco.');
            return;
        }
        if (resetForm.newPassword !== resetForm.confirmPassword) {
            setResetError('Las contraseñas no coinciden.');
            return;
        }
        
        setIsResetting(true);
        setResetError(null);
        const csrf = getCsrfTokenFromDocument();
        
        try {
            const res = await fetch(`/api/admin/users/${resetPasswordUser.id}/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(csrf ? { 'x-csrf-token': csrf } : {})
                },
                body: JSON.stringify({ password: resetForm.newPassword })
            });
            if (!res.ok) {
                const data = await res.json();
                setResetError(data.error || 'Error al restablecer contraseña.');
                setIsResetting(false);
                return;
            }
            setResetSuccess(true);
            setTimeout(() => {
                setResetPasswordUser(null);
            }, 2000);
        } catch (err) {
            console.error('Error resetting password:', err);
            setResetError('Error del servidor al restablecer contraseña.');
        } finally {
            setIsResetting(false);
        }
    };

    if (!mounted) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-muted animate-pulse">Cargando administración...</div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <div className="section-header" style={{ marginBottom: '2rem' }}>
                <Link href="/admin" style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', marginRight: '1rem' }}>
                    <ArrowLeft size={20} />
                </Link>
                <Users className="text-primary" />
                <h1 className="gradient-text" style={{ fontSize: '2rem', margin: 0 }}>Gestion de Usuarios</h1>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <p style={{ color: 'var(--muted)', margin: 0, maxWidth: '600px' }}>
                    Administre el acceso institucional y la gobernanza de identidades para el cumplimiento regulatorio.
                </p>
                <Link
                    href="/admin/usuarios/nuevo"
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
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                        textDecoration: 'none'
                    }}
                >
                    + Crear usuario
                </Link>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2rem'
            }}>
                <div className="glass-card" style={{ padding: '1.25rem' }}>
                    <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05rem', marginBottom: '0.5rem' }}>Total Usuarios</p>
                    <p style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--foreground)', margin: 0 }}>{users.length}</p>
                </div>
                <div className="glass-card" style={{ padding: '1.25rem' }}>
                    <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05rem', marginBottom: '0.5rem' }}>Administradores</p>
                    <p style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--primary)', margin: 0 }}>{users.filter(u => u.roles?.some(r => r.roleCode === 'ADMIN')).length}</p>
                </div>
                <div className="glass-card" style={{ padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gridColumn: 'span 2' }}>
                    <Search size={18} style={{ color: 'var(--muted)', marginRight: '1rem' }} />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar por nombre o correo..."
                        style={{
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            color: 'var(--foreground)',
                            width: '100%',
                            fontSize: '0.9rem'
                        }}
                    />
                </div>
            </div>

            {error && (
                <div className="glass-card" style={{ border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', marginBottom: '1.5rem' }}>
                    {error}
                </div>
            )}

            {(() => {
                const renderTable = (isActiveList: boolean) => {
                    const title = isActiveList ? "Usuarios Activos" : "Usuarios Inactivos";
                    const titleColor = isActiveList ? "var(--foreground)" : "#fca5a5";
                    const activeOpacity = isActiveList ? 1 : 0.6;
                    const list = filteredUsers.filter(u => u.isActive === isActiveList);

                    return (
                        <div className="glass-card" style={{ padding: 0, overflow: 'hidden', marginTop: isActiveList ? '0' : '2rem' }}>
                            <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.03)' }}>
                                <h2 style={{ fontSize: '1.1rem', margin: 0, color: titleColor }}>{title}</h2>
                            </div>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)' }}>
                                        <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', width: '40px' }}>#</th>
                                        <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase' }}>Nombre</th>
                                        <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase' }}>Email</th>
                                        <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase' }}>Empresa</th>
                                        <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase' }}>Rol</th>
                                        <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase' }}>Fechas</th>
                                        <th style={{ padding: '1rem 1.5rem', textAlign: 'right', fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase' }}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)', fontSize: '0.8rem' }}>Cargando datos...</td>
                                        </tr>
                                    ) : list.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted)' }}>
                                                No se encontraron {title.toLowerCase()}.
                                            </td>
                                        </tr>
                                    ) : list.map((user, index) => {
                                        return (
                                            <tr key={user.id} style={{ borderBottom: '1px solid var(--glass-border)', opacity: activeOpacity }}>
                                                <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem', color: 'var(--muted)', fontWeight: 'bold' }}>
                                                    {index + 1}
                                                </td>
                                                <td style={{ padding: '1rem 1.5rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                        <div style={{
                                                            width: '36px', height: '36px', borderRadius: '10px',
                                                            background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1))',
                                                            border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.9rem'
                                                        }}>
                                                            {user.name?.[0] || user.email[0]}
                                                        </div>
                                                        <div>
                                                            <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 'bold' }}>
                                                                {`${user.name ?? ''} ${user.lastName ?? ''}`.trim() || 'Sin nombre'}
                                                            </p>
                                                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted)' }}>{user.roles?.[0]?.roleName || user.roles?.[0]?.roleCode || 'Sin Rol'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem' }}>{user.email}</td>
                                                <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: 'var(--muted)' }}>
                                                    {user.companyName || 'Sin Empresa'}
                                                </td>
                                                <td style={{ padding: '1rem 1.5rem' }}>
                                                    <span style={{
                                                        fontSize: '0.65rem', fontWeight: 900, padding: '0.2rem 0.5rem', borderRadius: '6px',
                                                        border: '1px solid var(--glass-border)',
                                                        color: user.roles?.some(r => r.roleCode === 'ADMIN') ? 'var(--primary)' : 'var(--muted)',
                                                        background: 'rgba(255,255,255,0.02)'
                                                    }}>
                                                        {user.roles?.[0]?.roleCode || 'Sin Rol'}
                                                    </span>
                                                </td>
                                                 <td style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', color: 'var(--muted)' }}>
                                                    <div suppressHydrationWarning>C: {new Date(user.createdAt).toLocaleDateString()}</div>
                                                    <div suppressHydrationWarning>A: {user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'Pendiente'}</div>
                                                 </td>
                                                <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                        <button
                                                            onClick={() => openRolePermissions(user.roles?.[0]?.roleCode || '')}
                                                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '6px', padding: '0.4rem', cursor: 'pointer', color: 'var(--muted)', display: 'flex', alignItems: 'center' }}
                                                            title="Ver permisos"
                                                        >
                                                            <ShieldCheck size={16} />
                                                        </button>
                                                        {isActiveList && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleOpenResetDialog(user)}
                                                                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '6px', padding: '0.4rem', cursor: 'pointer', color: '#fbbf24', display: 'flex', alignItems: 'center' }}
                                                                    title="Reset password"
                                                                >
                                                                    <Lock size={16} />
                                                                </button>
                                                                <Link
                                                                    href={`/admin/usuarios/${user.id}`}
                                                                    style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '6px', padding: '0.4rem', cursor: 'pointer', color: 'var(--primary)', alignItems: 'center' }}
                                                                    title="Editar"
                                                                >
                                                                    <Edit3 size={16} />
                                                                </Link>
                                                                <button
                                                                    onClick={() => {
                                                                        if (window.confirm(`¿Desea inactivar el usuario "${user.email}"?`)) {
                                                                            handleToggleActive(user);
                                                                        }
                                                                    }}
                                                                    style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', padding: '0.4rem', cursor: 'pointer', color: '#f87171', display: 'flex', alignItems: 'center' }}
                                                                    title="Inactivar"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </>
                                                        )}
                                                        {!isActiveList && (
                                                            <>
                                                                <button
                                                                    onClick={() => {
                                                                        if (window.confirm(`¿Desea reactivar el usuario "${user.email}"?`)) {
                                                                            handleToggleActive(user);
                                                                        }
                                                                    }}
                                                                    style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '6px', padding: '0.4rem', cursor: 'pointer', color: '#10b981', display: 'flex', alignItems: 'center' }}
                                                                    title="Reactivar"
                                                                >
                                                                    <CheckCircle2 size={16} />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    );
                };

                return (
                    <>
                        {renderTable(true)}
                        {renderTable(false)}
                    </>
                );
            })()}

            {rolePermissions && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(0,0,0,0.7)',
                    backdropFilter: 'blur(10px)'
                }}>
                    <div className="glass-card" style={{ width: '100%', maxWidth: '500px', padding: '2rem', position: 'relative' }}>
                        <button
                            onClick={() => setRolePermissions(null)}
                            style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}
                        >
                            <X size={18} />
                        </button>
                        <h3 style={{ marginTop: 0 }}>Permisos del rol {rolePermissions.roleCode}</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {rolePermissions.permissions.length === 0 ? (
                                <p style={{ color: 'var(--muted)' }}>No hay permisos asignados.</p>
                            ) : rolePermissions.permissions.map((perm) => (
                                <div key={perm} style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--glass-border)', borderRadius: '8px' }}>
                                    {perm}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {resetPasswordUser && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(0,0,0,0.7)',
                    backdropFilter: 'blur(10px)',
                    padding: '1rem'
                }}>
                    <div className="glass-card animate-scale-in" style={{ width: '100%', maxWidth: '400px', padding: '2rem', position: 'relative' }}>
                        <button
                            onClick={() => setResetPasswordUser(null)}
                            style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}
                        >
                            <X size={18} />
                        </button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                            <Lock className="text-primary" />
                            <h3 style={{ margin: 0 }}>Restablecer Contraseña</h3>
                        </div>
                        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                            Establecer nueva contraseña para el usuario <strong style={{ color: 'white' }}>{resetPasswordUser.email}</strong>
                        </p>
                        
                        <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div>
                                <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Nueva Contraseña</label>
                                <input
                                    type="password"
                                    value={resetForm.newPassword}
                                    onChange={(e) => setResetForm({ ...resetForm, newPassword: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white' }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Confirmar Contraseña</label>
                                <input
                                    type="password"
                                    value={resetForm.confirmPassword}
                                    onChange={(e) => setResetForm({ ...resetForm, confirmPassword: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white' }}
                                />
                            </div>
                        </div>

                        {resetError && (
                            <div style={{ color: '#f87171', fontSize: '0.85rem', marginBottom: '1rem' }}>
                                {resetError}
                            </div>
                        )}
                        
                        {resetSuccess && (
                            <div style={{ color: '#10b981', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <CheckCircle2 size={16} /> Contraseña actualizada
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                onClick={submitPasswordReset}
                                disabled={isResetting || resetSuccess}
                                style={{
                                    background: 'var(--primary)',
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.75rem 1.25rem',
                                    borderRadius: '10px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    opacity: (isResetting || resetSuccess) ? 0.7 : 1
                                }}
                            >
                                {isResetting ? 'Guardando...' : 'Cambiar Contraseña'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
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
        </div>
    );
}
