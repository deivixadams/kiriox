import React from 'react';
import styles from '../SimulationSystem.module.css';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  alert?: boolean;
  suffix?: string;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, alert, suffix, className }) => (
  <div className={`${styles.metricCard} ${alert ? styles.metricCardAlert : ''} ${className || ''}`}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
      <h3 className={styles.metricTitle}>{title}</h3>
      <div style={{ color: alert ? '#f87171' : 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center' }}>
        {icon}
      </div>
    </div>
    <div className={styles.metricValue}>
      <span>{value}</span>
      {suffix && <span className={styles.metricSuffix}>{suffix}</span>}
    </div>
  </div>
);
