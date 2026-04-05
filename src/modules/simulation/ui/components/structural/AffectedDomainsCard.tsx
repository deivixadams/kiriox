'use client';

import React from 'react';
import styles from './AffectedDomainsCard.module.css';
import { Layers } from 'lucide-react';

interface AffectedDomainsCardProps {
  domains: Array<{
    name: string;
    before: number;
    after: number;
    delta: number;
  }>;
}

export default function AffectedDomainsCard({ domains }: AffectedDomainsCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <Layers size={16} className={styles.icon} />
        <span className={styles.eyebrow}>Impacto por Dominio</span>
      </div>

      <div className={styles.list}>
        {domains.map((domain, idx) => (
          <div key={idx} className={styles.item}>
            <div className={styles.top}>
              <span className={styles.name}>{domain.name}</span>
              <span className={styles.delta}>+{domain.delta.toFixed(1)}</span>
            </div>
            <div className={styles.barContainer}>
              <div 
                className={styles.barBefore} 
                style={{ width: `${(domain.before / 20) * 100}%` }} 
              />
              <div 
                className={styles.barAfter} 
                style={{ width: `${(domain.after / 20) * 100}%` }} 
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
