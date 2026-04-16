'use client';

import React from 'react';
import type { TopItem } from '@/modules/structural-risk/domain/types/Dashboard2Types';
import styles from './Dashboard2TopCard.module.css';

type Props = {
  title: string;
  eyebrow: string;
  items: TopItem[];
  accentColor: string;
  onItemClick: (id: string) => void;
  loading?: boolean;
};

export default function Dashboard2TopCard({
  title,
  eyebrow,
  items,
  accentColor,
  onItemClick,
  loading,
}: Props) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.eyebrow} style={{ color: accentColor }}>{eyebrow}</div>
        <div className={styles.title}>{title}</div>
      </div>

      {loading && (
        <div className={styles.skeletonList}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={styles.skeletonItem} />
          ))}
        </div>
      )}

      {!loading && !items.length && (
        <div className={styles.empty}>Sin datos</div>
      )}

      {!loading && items.length > 0 && (
        <ol className={styles.list}>
          {items.map((item, idx) => (
            <li key={item.id} className={styles.item}>
              <button
                type="button"
                className={styles.itemBtn}
                onClick={() => onItemClick(item.id)}
              >
                <span className={styles.rank} style={{ color: accentColor }}>
                  {idx + 1}
                </span>
                <span className={styles.itemName}>
                  {item.name || item.code || item.id}
                </span>
                {item.score > 0 && (
                  <span className={styles.itemScore}>
                    {Number(item.score).toFixed(1)}
                  </span>
                )}
              </button>
              <div
                className={styles.itemBar}
                style={{
                  width: `${Math.min(100, (item.score / (items[0]?.score || 1)) * 100)}%`,
                  background: `${accentColor}40`,
                }}
              />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
