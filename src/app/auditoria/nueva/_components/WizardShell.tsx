import React from 'react';
import { X } from 'lucide-react';
import styles from './WizardShell.module.css';

type HeaderItem = { label: string; value: string };

export default function WizardShell({
  title,
  subtitle,
  step,
  totalSteps,
  headerItems,
  onClose,
  children
}: {
  title: string;
  subtitle: string;
  step: number;
  totalSteps: number;
  headerItems?: HeaderItem[];
  onClose?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{title}</h1>
          <div className={styles.meta}>
            <span className={styles.step}>Paso {step} de {totalSteps}</span>
            <span className={styles.subtitle}>{subtitle}</span>
          </div>
        </div>
        <div className={styles.headerRight}>
          {headerItems && headerItems.length > 0 && (
            <div className={styles.infoBar}>
              {headerItems.map((item) => (
                <div key={item.label} className={styles.infoItem}>
                  <span className={styles.infoLabel}>{item.label}</span>
                  <span className={styles.infoValue}>{item.value}</span>
                </div>
              ))}
            </div>
          )}
          {onClose && (
            <button onClick={onClose} className={styles.closeButton} aria-label="Cerrar">
              <X className={styles.closeIcon} />
            </button>
          )}
        </div>
      </div>
      <div className={styles.content}>
        {children}
      </div>
    </div>
  );
}
