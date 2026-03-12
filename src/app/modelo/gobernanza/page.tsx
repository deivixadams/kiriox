import React from 'react';
import styles from './page.module.css';
import { 
  Shield, 
  Users, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Gavel
} from 'lucide-react';

export default function GobernanzaPage() {
  const committeeMembers = [
    { name: "Carlos Rodriguez", role: "Director de Riesgos", initial: "CR" },
    { name: "Ana Martinez", role: "Oficial de Cumplimiento", initial: "AM" },
    { name: "Roberto Gomez", role: "Auditor Interno", initial: "RG" },
    { name: "Elena Sanchis", role: "Socio de Negocio", initial: "ES" }
  ];

  const recentDecisions = [
    { 
      id: "ACT-2024-001", 
      title: "Actualización de pesos AML D05", 
      date: "2024-03-10", 
      status: "Aprobado", 
       type: "Ajuste de Pesos"
    },
    { 
      id: "ACT-2024-002", 
      title: "Inclusión de nueva fuente Transaccional", 
      date: "2024-03-05", 
      status: "Pendiente", 
      type: "Nueva Versión"
    },
    { 
      id: "ACT-2024-003", 
      title: "Recalibración de umbrales criticos", 
      date: "2024-02-28", 
      status: "Aprobado", 
      type: "Optimización"
    }
  ];

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.eyebrow}>Governance & Oversight</div>
          <h1 className={styles.title}>Comité y Decisiones</h1>
          <p style={{ color: '#94a3b8', marginTop: '8px', maxWidth: '600px' }}>
            Registro centralizado de la gobernanza del modelo, supervisión de versiones y actas institucionales del motor de riesgo.
          </p>
        </header>

        <section className={styles.heroGrid}>
          <div className={styles.heroCard}>
            <div className={styles.cardLabel}>Estado del Modelo</div>
            <div className={styles.cardValue}>v2.4.1 Stable</div>
            <div className={`${styles.cardStatus} ${styles.statusSuccess}`}>
              <CheckCircle2 size={14} /> Certificado
            </div>
          </div>
          <div className={styles.heroCard}>
            <div className={styles.cardLabel}>Próxima Revisión</div>
            <div className={styles.cardValue}>15 Abr 2024</div>
            <div style={{ marginTop: '12px', fontSize: '13px', color: '#94a3b8' }}>
              Revisión trimestral de parámetros
            </div>
          </div>
          <div className={styles.heroCard}>
            <div className={styles.cardLabel}>Fragilidad Global</div>
            <div className={styles.cardValue}>74.2 / 100</div>
            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontSize: '13px' }}>
              <TrendingUp size={14} /> +2.1 mejoría
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <Users size={20} color="#3b82f6" /> 
            Miembros del Comité
          </h2>
          <div className={styles.memberGrid}>
            {committeeMembers.map((member, i) => (
              <div key={i} className={styles.memberCard}>
                <div className={styles.avatar}>{member.initial}</div>
                <div>
                  <div className={styles.memberName}>{member.name}</div>
                  <div className={styles.memberRole}>{member.role}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <Gavel size={20} color="#3b82f6" />
            Bitácora de Decisiones
          </h2>
          <table className={styles.decisionTable}>
            <thead>
              <tr>
                <th className={styles.th}>ID Acta</th>
                <th className={styles.th}>Asunto</th>
                <th className={styles.th}>Tipo</th>
                <th className={styles.th}>Fecha</th>
                <th className={styles.th}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {recentDecisions.map((decision, i) => (
                <tr key={i} className={styles.tr}>
                  <td className={styles.td} style={{ fontWeight: '600', color: '#3b82f6' }}>{decision.id}</td>
                  <td className={styles.td}>{decision.title}</td>
                  <td className={styles.td}>
                    <span className={styles.badgeBlue}>{decision.type}</span>
                  </td>
                  <td className={styles.td} style={{ color: '#94a3b8' }}>{decision.date}</td>
                  <td className={styles.td}>
                    <span className={decision.status === 'Aprobado' ? styles.badgeGreen : styles.badgeYellow}>
                      {decision.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
