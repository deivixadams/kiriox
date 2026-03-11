"use client";

import { Search, Bell, User, LayoutGrid, Sun, Moon, FileText, ShieldCheck, Lock, LogOut } from "lucide-react";
import { useTheme } from "./ThemeContext";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function Topbar() {
    const { theme, toggleTheme } = useTheme();
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement | null>(null);
    const router = useRouter();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include',
                cache: 'no-store'
            });
        } catch {
            // ignore
        } finally {
            if (typeof window !== 'undefined') {
                sessionStorage.clear();
                localStorage.clear();
            }
            router.replace('/login');
            window.location.assign('/login');
        }
    };

    return (
        <header style={{
            padding: '0.75rem 2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            borderBottom: '1px solid var(--glass-border)',
            background: 'var(--background)',
            zIndex: 10
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                <div style={{ position: 'relative', flex: 0.5 }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                    <input
                        type="text"
                        placeholder="Comando (Ctrl+K)..."
                        style={{
                            width: '100%',
                            padding: '0.6rem 1rem 0.6rem 2.5rem',
                            borderRadius: '12px',
                            background: 'rgba(0,0,0,0.2)',
                            border: '1px solid var(--glass-border)',
                            color: 'var(--foreground)',
                            outline: 'none'
                        }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <ScopeSelector label="Jurisdiccion" value="Republica Dominicana" />
                    <ScopeSelector label="Empresa" value="Todas" />
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <button
                    onClick={toggleTheme}
                    style={iconBtnStyle}
                    title={theme === 'dark' ? "Modo Claro" : "Modo Oscuro"}
                >
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                <button style={iconBtnStyle}><Bell size={20} /></button>
                <button style={iconBtnStyle}><LayoutGrid size={20} /></button>
                <div
                    ref={menuRef}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingLeft: '1rem', borderLeft: '1px solid var(--glass-border)', position: 'relative' }}
                >
                    <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '0.85rem', fontWeight: '600' }}>Admin User</p>
                        <p style={{ fontSize: '0.75rem', opacity: 0.6 }}>Auditor Mode</p>
                    </div>
                    <button
                        onClick={() => setMenuOpen((open) => !open)}
                        style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}
                        aria-label="User menu"
                    >
                        <User size={20} color="white" />
                    </button>

                    {menuOpen && (
                        <div style={{
                            position: 'absolute',
                            top: '56px',
                            right: 0,
                            minWidth: '220px',
                            background: 'rgba(15,23,42,0.98)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '12px',
                            padding: '0.5rem',
                            boxShadow: '0 12px 24px rgba(0,0,0,0.4)',
                            zIndex: 100
                        }}>
                            <MenuLink href="/mis-auditorias" icon={<FileText size={16} />}>Mis auditorias</MenuLink>
                            <MenuLink href="/mis-scores" icon={<ShieldCheck size={16} />}>Mis scores</MenuLink>
                            <MenuLink href="/seguridad" icon={<Lock size={16} />}>Seguridad</MenuLink>
                            <div style={{ height: 1, background: 'var(--glass-border)', margin: '0.5rem 0' }} />
                            <button
                                onClick={handleLogout}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.75rem', color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}
                            >
                                <LogOut size={16} /> Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

function ScopeSelector({ label, value }: { label: string, value: string }) {
    return (
        <div className="glass-card" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', display: 'flex', gap: '0.5rem', borderRadius: '10px' }}>
            <span style={{ opacity: 0.6 }}>{label}:</span>
            <span style={{ fontWeight: '600' }}>{value}</span>
        </div>
    );
}

const iconBtnStyle = {
    background: 'none',
    border: 'none',
    color: 'var(--foreground)',
    cursor: 'pointer',
    opacity: 0.7,
    transition: 'opacity 0.2s',
    display: 'flex',
    alignItems: 'center'
}

function MenuLink({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <Link href={href} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.75rem', color: 'white', textDecoration: 'none' }}>
            {icon} {children}
        </Link>
    );
}
