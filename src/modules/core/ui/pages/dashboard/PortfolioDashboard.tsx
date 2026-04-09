import {
    TrendingUp,
    TrendingDown,
    FileText,
    ShieldAlert,
    ClipboardCheck,
    FlaskConical,
    Bell,
    Scale
} from "lucide-react";
import PortfolioGraphCanvas from "../../components/PortfolioGraphCanvas";

export default function PortfolioDashboard() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Header section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h2 style={{ fontSize: '1.25rem', opacity: 0.7 }}>Centro de Control de Red</h2>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>Visión General</h1>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileText size={18} />
                        Exportar Pack Auditoría
                    </button>
                </div>
            </div>

            {/* Main Options */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                <OptionCard
                    title="Riesgo"
                    icon={<ShieldAlert size={20} />}
                    color="var(--primary)"
                    status="Score 74.2"
                />
                <OptionCard
                    title="Auditoría"
                    icon={<ClipboardCheck size={20} />}
                    color="var(--accent)"
                    status="15 Pruebas"
                />
                <OptionCard
                    title="Simulación"
                    icon={<FlaskConical size={20} />}
                    color="var(--warning)"
                    status="3 Scenarios"
                />
                <OptionCard
                    title="Alertas"
                    icon={<Bell size={20} />}
                    color="var(--danger)"
                    status="12 Activas"
                />
                <OptionCard
                    title="Gobierno"
                    icon={<Scale size={20} />}
                    color="var(--secondary)"
                    status="Completo"
                />
            </div>

            {/* Second Row: Graph & Trends */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                <PortfolioGraphCanvas />

                <div className="glass-card">
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: '600' }}>Hotspots de Riesgo</h3>
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <HotspotItem title="D05 - PEP Monitoring" severity="Crítico" delta="+15%" />
                        <HotspotItem title="D02 - Compliance Capacity" severity="Alto" delta="+8%" />
                        <HotspotItem title="D06 - Transaction Reporting" severity="Medio" delta="-2%" />
                    </ul>
                </div>
            </div>

            {/* Third Row: Work Queue */}
            <div className="glass-card">
                <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: '600' }}>Cola de Trabajo Agregada</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)', opacity: 0.6, fontSize: '0.9rem' }}>
                            <th style={{ padding: '0.75rem' }}>Acción</th>
                            <th style={{ padding: '0.75rem' }}>Empresa</th>
                            <th style={{ padding: '0.75rem' }}>Prioridad</th>
                            <th style={{ padding: '0.75rem' }}>Vencimiento</th>
                            <th style={{ padding: '0.75rem' }}>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        <QueueRow action="Renovar Evidencia C-08" company="Bank Alpha" priority="Alta" due="En 2 días" status="Pendiente" />
                        <QueueRow action="Ejecutar Prueba D04" company="Fintech Beta" priority="Crítica" due="HOY" status="Atrasada" />
                        <QueueRow action="Revisar CAPA #441" company="Coop Gamma" priority="Media" due="En 5 días" status="En Proceso" />
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function OptionCard({ title, icon, color, status }: any) {
    return (
        <div className="glass-card" style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '1rem', 
            borderTop: `4px solid ${color}`,
            cursor: 'pointer',
            transition: 'transform 0.2s',
            alignItems: 'center',
            padding: '2rem 1.5rem'
        }}>
            <div style={{ 
                width: 48, 
                height: 48, 
                borderRadius: '50%', 
                background: `rgba(255,255,255,0.05)`, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: color
            }}>
                {icon}
            </div>
            <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 'bold', display: 'block' }}>{title}</span>
                <span style={{ fontSize: '0.85rem', opacity: 0.6 }}>{status}</span>
            </div>
        </div>
    );
}


function HotspotItem({ title, severity, delta }: any) {
    const color = severity === 'Crítico' ? 'var(--danger)' : severity === 'Alto' ? 'var(--warning)' : 'var(--primary)';
    return (
        <li style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>{title}</span>
                <span style={{ fontSize: '0.75rem', color, fontWeight: 'bold' }}>{severity}</span>
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', opacity: 0.8 }}>{delta}</span>
        </li>
    );
}

function QueueRow({ action, company, priority, due, status }: any) {
    return (
        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.95rem' }}>
            <td style={{ padding: '1rem 0.75rem' }}>{action}</td>
            <td style={{ padding: '1rem 0.75rem' }}>{company}</td>
            <td style={{ padding: '1rem 0.75rem' }}>
                <span style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    background: priority === 'Crítica' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                    color: priority === 'Crítica' ? 'var(--danger)' : 'var(--warning)'
                }}>{priority}</span>
            </td>
            <td style={{ padding: '1rem 0.75rem' }}>{due}</td>
            <td style={{ padding: '1rem 0.75rem', opacity: 0.7 }}>{status}</td>
        </tr>
    );
}
