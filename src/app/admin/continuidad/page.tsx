"use client";

import React from 'react';
import { 
    Database, RefreshCw, Calendar, HardDrive, 
    CheckCircle2, Clock, AlertTriangle, Eye, 
    Download, Trash2, ChevronRight, Search
} from 'lucide-react';
import styles from './Continuidad.module.css';

const dummyBackups = [
    {
        id: "BK-2024-001",
        title: "Respaldo Semanal Automático",
        date: "2024-05-15",
        size: "1.2 GB",
        status: "DONE",
        duration: "12m 45s",
        type: "FULL",
        severity: 2
    },
    {
        id: "BK-2024-002",
        title: "Backup Pre-Migración Schema",
        date: "2024-04-30",
        size: "0.85 GB",
        status: "DONE",
        duration: "08m 12s",
        type: "INCREMENTAL",
        severity: 4
    },
    {
        id: "BK-2024-003",
        title: "Manual Snapshot - Post Auditoría",
        date: "2024-04-15",
        size: "1.1 GB",
        status: "DONE",
        duration: "10m 33s",
        type: "FULL",
        severity: 3
    }
];

export default function ContinuidadPage() {
    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.titleArea}>
                    <h1 className={styles.title}>Continuidad de Datos</h1>
                    <p className={styles.subtitle}>Gestión de copias de seguridad y restauración del sistema</p>
                </div>
                <div className={styles.actions}>
                    <button className={`${styles.glassBtn} ${styles.secondaryBtn}`}>
                        <RefreshCw size={18} />
                        Restaurar Backup
                    </button>
                    <button className={`${styles.glassBtn} ${styles.primaryBtn}`}>
                        <Database size={18} />
                        Hacer Backup
                    </button>
                </div>
            </header>

            <div className={styles.listContainer}>
                <div className={styles.tableHeader}>
                    <div className={styles.headerCol}>CÓDIGO / TÍTULO</div>
                    <div className={styles.headerCol}>TIPO</div>
                    <div className={styles.headerCol}>TAMAÑO</div>
                    <div className={styles.headerCol}>DURACIÓN</div>
                    <div className={styles.headerCol}>ESTADO</div>
                    <div className={styles.headerCol}></div>
                </div>

                {dummyBackups.map((bk) => (
                    <div key={bk.id} className={styles.row}>
                        <div className={styles.idTitle}>
                            <span className={styles.mainText}>{bk.id}</span>
                            <span className={styles.subText}>{bk.title}</span>
                        </div>

                        <div className={styles.severityDots}>
                            {[1, 2, 3, 4, 5].map((dot) => (
                                <div 
                                    key={dot} 
                                    className={`${styles.dot} ${dot <= bk.severity ? styles.dotActive : ''}`} 
                                />
                            ))}
                        </div>

                        <div className={styles.valueText}>{bk.size}</div>

                        <div className={styles.dateInfo}>
                            <Clock size={14} />
                            {bk.duration}
                        </div>

                        <div>
                            <span className={`${styles.statusBadge} ${bk.status === 'DONE' ? styles.statusDone : styles.statusOpen}`}>
                                {bk.status}
                            </span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button className={styles.actionBtn}>
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
