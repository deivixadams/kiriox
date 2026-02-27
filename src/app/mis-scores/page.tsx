import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function Page() {
    return (
        <div className="animate-fade-in">
            <div className="section-header" style={{ marginBottom: '2rem' }}>
                <Link href="/admin" style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', marginRight: '1rem' }}>
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="gradient-text" style={{ fontSize: '2rem', margin: 0 }}>Mis scores</h1>
            </div>
            <div className="glass-card" style={{ padding: '2rem' }}>
                <p style={{ color: 'var(--muted)', margin: 0 }}>Pagina en construccion.</p>
            </div>
        </div>
    );
}
