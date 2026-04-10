"use client";

import { useEffect, useMemo, useState } from 'react';
import {
    Users,
    Search,
    MoreVertical,
    ArrowLeft,
    ShieldCheck,
    UserCog,
    Lock,
    UserX,
    UserCheck,
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
    role?: {
        roleCode: string;
        roleName?: string | null;
    };
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
    const [resetPasswordResult, setResetPasswordResult] = useState<{ email: string; tempPassword: string } | null>(null);

    useEffect(() => {
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
        if (!user.isActive) return { label: 'Suspendido', color: '#64748b' };
        if (user.activationStatus !== 'active') return { label: 'Pendiente', color: '#f59e0b' };
        return { label: 'Activo', color: '#10b981' };
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
            }
        } catch (err) {
            console.error('Error toggling user status:', err);
        }
    };

    const handleResetPassword = async (user: UserRow) => {
        const csrf = getCsrfTokenFromDocument();
        if (!csrf) return;
        try {
            const res = await fetch(`/api/admin/users/${user.id}/reset-password`, {
                method: 'POST',
                headers: {
                    'x-csrf-token': csrf
                }
            });
            if (!res.ok) return;
            const data = await res.json();
            setResetPasswordResult({ email: user.email, tempPassword: data.tempPassword });
        } catch (err) {
            console.error('Error resetting password:', err);
        }
    };

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
                    <p style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--primary)', margin: 0 }}>{users.filter(u => u.role?.roleCode === 'ADMIN').length}</p>
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

            <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)' }}>
                            <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase' }}>Nombre</th>
                            <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase' }}>Email</th>
                            <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase' }}>Rol</th>
                            <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase' }}>Estado</th>
                            <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase' }}>Creado / Actualizado</th>
                            <th style={{ padding: '1rem 1.5rem', textAlign: 'right', fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            Array(3).fill(0).map((_, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                    <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)', fontSize: '0.8rem' }}>Cargando datos...</td>
                                </tr>
                            ))
                        ) : filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted)' }}>No se encontraron usuarios registrados.</td>
                            </tr>
                        ) : filteredUsers.map((user) => {
                            const status = getStatusLabel(user);
                            return (
                                <tr key={user.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{
                                                width: '36px',
                                                height: '36px',
                                                borderRadius: '10px',
                                                background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1))',
                                                border: '1px solid var(--glass-border)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'var(--primary)',
                                                fontWeight: 'bold',
                                                fontSize: '0.9rem'
                                            }}>
                                                {user.name?.[0] || user.email[0]}
                                            </div>
                                            <div>
                                                <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 'bold' }}>
                                                    {`${user.name ?? ''} ${user.lastName ?? ''}`.trim() || 'Sin nombre'}
                                                </p>
                                                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted)' }}>{user.role?.roleCode || 'Sin Rol'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem' }}>{user.email}</td>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <span style={{
                                            fontSize: '0.65rem',
                                            fontWeight: 900,
                                            padding: '0.2rem 0.5rem',
                                            borderRadius: '6px',
                                            border: '1px solid var(--glass-border)',
                                            color: user.role?.roleCode === 'ADMIN' ? 'var(--primary)' : 'var(--muted)',
                                            background: 'rgba(255,255,255,0.02)'
                                        }}>
                                            {user.role?.roleCode || 'Sin Rol'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <span style={{
                                            fontSize: '0.65rem',
                                            fontWeight: 900,
                                            padding: '0.2rem 0.5rem',
                                            borderRadius: '6px',
                                            color: status.color,
                                            border: `1px solid ${status.color}33`,
                                            background: `${status.color}11`
                                        }}>
                                            {status.label}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', color: 'var(--muted)' }}>
                                        <div>{new Date(user.createdAt).toLocaleDateString()}</div>
                                        <div>{new Date(user.updatedAt).toLocaleDateString()}</div>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                                        <details style={{ position: 'relative', display: 'inline-block' }}>
                                            <summary style={{ listStyle: 'none', cursor: 'pointer', color: 'var(--muted)' }}>
                                                <MoreVertical size={16} />
                                            </summary>
                                            <div style={{
                                                position: 'absolute',
                                                right: 0,
                                                marginTop: '0.5rem',
                                                background: 'rgba(15,23,42,0.95)',
                                                border: '1px solid var(--glass-border)',
                                                borderRadius: '10px',
                                                minWidth: '200px',
                                                padding: '0.5rem',
                                                zIndex: 10
                                            }}>
                                                <Link
                                                    href={`/admin/usuarios/${user.id}`}
                                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', color: 'white', textDecoration: 'none' }}
                                                >
                                                    <UserCog size={14} /> Editar
                                                </Link>
                                                <button
                                                    onClick={() => handleToggleActive(user)}
                                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', color: 'white', background: 'none', border: 'none', cursor: 'pointer', width: '100%' }}
                                                >
                                                    {user.isActive ? <UserX size={14} /> : <UserCheck size={14} />}
                                                    {user.isActive ? 'Suspender' : 'Activar'}
                                                </button>
                                                <button
                                                    onClick={() => handleResetPassword(user)}
                                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', color: 'white', background: 'none', border: 'none', cursor: 'pointer', width: '100%' }}
                                                >
                                                    <Lock size={14} /> Reset password
                                                </button>
                                                <button
                                                    onClick={() => openRolePermissions(user.role?.roleCode || '')}
                                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', color: 'white', background: 'none', border: 'none', cursor: 'pointer', width: '100%' }}
                                                >
                                                    <ShieldCheck size={14} /> Ver permisos del rol
                                                </button>
                                            </div>
                                        </details>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

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

            {resetPasswordResult && (
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
                            onClick={() => setResetPasswordResult(null)}
                            style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}
                        >
                            <X size={18} />
                        </button>
                        <h3 style={{ marginTop: 0 }}>Password temporal generado</h3>
                        <p style={{ color: 'var(--muted)' }}>Usuario: {resetPasswordResult.email}</p>
                        <div style={{
                            padding: '0.75rem 1rem',
                            borderRadius: '8px',
                            border: '1px solid var(--glass-border)',
                            fontWeight: 'bold',
                            fontSize: '1.1rem'
                        }}>
                            {resetPasswordResult.tempPassword}
                        </div>
                        <p style={{ color: 'var(--muted)', marginTop: '0.75rem' }}>
                            Este password se debe cambiar en el primer inicio de sesion.
                        </p>
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
