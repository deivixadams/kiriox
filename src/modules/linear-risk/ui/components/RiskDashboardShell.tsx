"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, ClipboardCheck, Network, ShieldAlert, X } from 'lucide-react';
import styles from './RiskDashboardShell.module.css';

const primaryLinks = [
  { label: 'Riesgo lineal', href: '/dashboard/riesgo/lineal', icon: ShieldAlert },
  { label: 'Riesgo estructural', href: '/dashboard/riesgo/estructural', icon: Network },
];

const operationalLinks = [
  { label: 'Seguimiento', href: '/dashboard/riesgo/seguimiento', icon: ClipboardCheck },
  { label: 'Actividad significativa', href: '/dashboard/riesgo/actividad-significativa', icon: Activity },
  { label: 'Nuevo riesgo', href: '/dashboard/riesgo/nuevo-riesgo', icon: ShieldAlert },
];

const registryLinks = [
  { label: 'Objetivos', href: '/dashboard/riesgo/registro/objetivos', icon: ClipboardCheck },
  { label: 'Macroprocesos', href: '/dashboard/riesgo/registro/macroprocesos', icon: ClipboardCheck },
  { label: 'Procesos', href: '/dashboard/riesgo/registro/procesos', icon: ClipboardCheck },
];

type RiskDashboardShellProps = {
  children: React.ReactNode;
};

export default function RiskDashboardShell({ children }: RiskDashboardShellProps) {
  const pathname = usePathname();

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarGroup}>
          <span className={styles.sidebarTitle}>Riesgo</span>
          {primaryLinks.map(({ label, href, icon: Icon }) => (
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

        <div className={styles.sidebarGroup}>
          <span className={styles.sidebarTitle}>Operación</span>
          {operationalLinks.map(({ label, href, icon: Icon }) => (
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

        <div className={styles.sidebarGroup}>
          <span className={styles.sidebarTitle}>Registro</span>
          {registryLinks.map(({ label, href, icon: Icon }) => (
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
        <div className={styles.headerActions}>
          <Link href="/" className={styles.closeButton} aria-label="Cerrar dashboard de riesgo">
            <X size={18} />
          </Link>
        </div>
        {children}
      </section>
    </div>
  );
}
