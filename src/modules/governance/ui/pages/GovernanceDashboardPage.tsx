"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GitBranch, Scale, SlidersHorizontal, Cpu, Users, Shield, BriefcaseBusiness, X } from 'lucide-react';
import styles from './GovernanceDashboardPage.module.css';

const governanceLinks = [
  { label: 'Parámetros', href: '/modelo/parametros', icon: SlidersHorizontal },
  { label: 'Versionado', href: '/modelo/versionado', icon: GitBranch },
  { label: 'Motor', href: '/score/motor', icon: Cpu },
  { label: 'License Management', href: '/modelo/gobernanza', icon: Scale },
  { label: 'Usuarios', href: '/admin/usuarios', icon: Users },
  { label: 'Roles', href: '/admin/roles', icon: Shield },
  { label: 'Empresa', href: '/admin/empresa', icon: BriefcaseBusiness },
  { label: 'Seguridad', href: '/seguridad', icon: Shield },
];

export default function GovernanceDashboardPage() {
  const pathname = usePathname();

  return (
    <div className={styles.dashboard}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarGroup}>
          <span className={styles.sidebarTitle}>Gobierno</span>
          {governanceLinks.map(({ label, href, icon: Icon }) => (
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
            <h1 className={styles.heroTitle}>Dashboard de Gobierno</h1>
            <p className={styles.heroSub}>Control de parámetros, licencias y gobierno del motor de riesgo.</p>
          </div>
          <div className={styles.heroActions}>
            <Link href="/" className={styles.closeButton} aria-label="Cerrar dashboard de gobierno">
              <X size={18} />
            </Link>
          </div>
        </div>

        <div className={styles.cardGrid}>
          <div className={styles.card}>
            <div className={styles.cardTitle}>Perfiles activos</div>
            <div className={styles.cardValue}>4</div>
          </div>
          <div className={styles.card}>
            <div className={styles.cardTitle}>Licencias vigentes</div>
            <div className={styles.cardValue}>2</div>
          </div>
          <div className={styles.card}>
            <div className={styles.cardTitle}>Cambios pendientes</div>
            <div className={styles.cardValue}>5</div>
          </div>
          <div className={styles.card}>
            <div className={styles.cardTitle}>Alertas regulatorias</div>
            <div className={styles.cardValue}>1</div>
          </div>
        </div>

        <div className={styles.canvasCard}>
          <div className={styles.canvasHeader}>
            <strong>Panel de gobierno</strong>
            <span className={styles.sidebarTitle}>Últimos eventos</span>
          </div>
          <div className={styles.canvasPlaceholder}>Eventos de gobierno pendientes de conexión</div>
        </div>
      </section>
    </div>
  );
}
