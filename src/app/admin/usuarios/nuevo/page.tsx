import Link from 'next/link';
import { ArrowLeft, UserPlus } from 'lucide-react';
import UserWizard from '../_components/UserWizard';

export default function NewUserPage() {
    return (
        <div className="animate-fade-in">
            <div className="section-header" style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Link href="/admin/usuarios" style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center' }}>
                        <ArrowLeft size={20} />
                    </Link>
                    <UserPlus className="text-primary" />
                    <h1 className="gradient-text" style={{ fontSize: '2rem', margin: 0 }}>Crear Usuario</h1>
                </div>
                <Link
                    href="/admin/usuarios"
                    className="btn-primary"
                    style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none', background: 'transparent', border: '1px solid var(--glass-border)' }}
                >
                    [X]
                </Link>
            </div>

            <UserWizard mode="create" />
        </div>
    );
}
