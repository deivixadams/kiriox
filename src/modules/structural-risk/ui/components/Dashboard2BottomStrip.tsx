'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import type { TopRankingsResponse } from '@/modules/structural-risk/domain/types/Dashboard2Types';
import { useDashboard2Store } from '@/modules/structural-risk/ui/store/useDashboard2Store';
import Dashboard2TopCard from './Dashboard2TopCard';
import styles from './Dashboard2BottomStrip.module.css';

async function fetchTop(): Promise<TopRankingsResponse> {
  const res = await fetch('/api/dashboard2/graph/top');
  if (!res.ok) throw new Error('Error cargando rankings');
  return res.json();
}

export default function Dashboard2BottomStrip() {
  const setSelectedNodeId = useDashboard2Store((s) => s.setSelectedNodeId);

  const { data, isLoading } = useQuery<TopRankingsResponse>({
    queryKey: ['dashboard2-top'],
    queryFn:  fetchTop,
    staleTime: 5 * 60 * 1000,
  });

  const handleClick = (id: string) => setSelectedNodeId(id);

  return (
    <div className={styles.strip}>
      <Dashboard2TopCard
        eyebrow="Top Controls"
        title="Controles estructurales"
        items={data?.top_controls ?? []}
        accentColor="#34d399"
        onItemClick={handleClick}
        loading={isLoading}
      />
      <Dashboard2TopCard
        eyebrow="Ultra Críticos"
        title="Controles ultra críticos"
        items={data?.ultra_critical ?? []}
        accentColor="#fb7185"
        onItemClick={handleClick}
        loading={isLoading}
      />
      <Dashboard2TopCard
        eyebrow="Fragilidad"
        title="Nodos sin redundancia"
        items={data?.fragile_nodes ?? []}
        accentColor="#f59e0b"
        onItemClick={handleClick}
        loading={isLoading}
      />
    </div>
  );
}
