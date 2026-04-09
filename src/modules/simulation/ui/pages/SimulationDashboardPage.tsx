"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ActivitySquare, Binary, FlaskConical, ShieldX, X } from 'lucide-react';
import styles from './SimulationDashboardPage.module.css';

const simulationLinks = [
  { label: 'Fallas de controles', href: '/score/simulacion/fallas-controles', icon: ShieldX },
  { label: 'Monte Carlo', href: '/score/simulacion/monte-carlo', icon: Binary },
  { label: 'Simulación inmersiva', href: '/app-simulation', icon: ActivitySquare },
];

export default function SimulationDashboardPage() {
  const pathname = usePathname();

  return (
    <div className={styles.dashboard}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarGroup}>
          <span className={styles.sidebarTitle}>Simulación</span>
          {simulationLinks.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`${styles.sidebarLink} ${pathname === href ? styles.sidebarLinkActive : ''}`}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </div>
      </aside>

      <section className={styles.content}>
        <div className={styles.hero}>
          <div>
            <h1 className={styles.heroTitle}>Dashboard de Simulación</h1>
            <p className={styles.heroSub}>Herramientas de pruebas de resiliencia y escenarios estructurales.</p>
          </div>
          <div className={styles.heroActions}>
            <Link href="/" className={styles.closeButton} aria-label="Cerrar dashboard de simulación">
              <X size={18} />
            </Link>
          </div>
        </div>

        <div className={styles.cardGrid}>
          <div className={styles.card}>
            <div className={styles.cardTitle}>Escenarios activos</div>
            <div className={styles.cardValue}>6</div>
          </div>
          <div className={styles.card}>
            <div className={styles.cardTitle}>Simulaciones en cola</div>
            <div className={styles.cardValue}>3</div>
          </div>
          <div className={styles.card}>
            <div className={styles.cardTitle}>Último run</div>
            <div className={styles.cardValue}>hace 45m</div>
          </div>
          <div className={styles.card}>
            <div className={styles.cardTitle}>Cobertura de grafo</div>
            <div className={styles.cardValue}>78%</div>
          </div>
        </div>

        <div className={styles.canvasCard}>
          <div className={styles.canvasHeader}>
            <strong>Resumen de simulaciones</strong>
            <span className={styles.sidebarTitle}>Top impactos</span>
          </div>
          <div className={styles.canvasPlaceholder}>Panel de resultados pendiente de conexión</div>
        </div>
      </section>
    </div>
  );
}
