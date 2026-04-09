"use client";

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { buildNavigation, type ResolvedNavigationItem } from '@/shared/navigation';
import type { AccessContext } from '@/modules/security';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === '/login';
  const isImmersiveSimulation = pathname.startsWith('/score/simulacion') || pathname.startsWith('/app-simulation');
  const showTopbarScopeSelectors = pathname === '/score/dashboard' || pathname.startsWith('/score/dashboard/');
  const isPortfolioDashboard = pathname === '/';
  const isModuleDashboard = pathname.startsWith('/dashboard/');

  const [access, setAccess] = useState<AccessContext | null>(null);
  const [navigation, setNavigation] = useState<ResolvedNavigationItem[]>([]);
  const [loadingAccess, setLoadingAccess] = useState(true);

  useEffect(() => {
    let alive = true;

    const loadAccessContext = async () => {
      if (isLogin || isImmersiveSimulation) {
        if (alive) setLoadingAccess(false);
        return;
      }

      try {
        const response = await fetch('/api/auth/access-context', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        });

        if (!alive) return;
        if (!response.ok) {
          setAccess(null);
          setNavigation([]);
          return;
        }

        const data = (await response.json()) as AccessContext;
        setAccess(data);
        setNavigation(buildNavigation(data));
      } catch {
        if (!alive) return;
        setAccess(null);
        setNavigation([]);
      } finally {
        if (alive) setLoadingAccess(false);
      }
    };

    loadAccessContext();
    return () => {
      alive = false;
    };
  }, [isImmersiveSimulation, isLogin]);

  if (isLogin || isImmersiveSimulation || isModuleDashboard) {
    return <>{children}</>;
  }

  const filteredNavigation = (() => {
    if (!isPortfolioDashboard) return navigation;
    const allowedOrder = ['risk', 'audit', 'simulation', 'alerts', 'governance'];
    const byKey = new Map(navigation.map((item) => [item.key, item]));
    return allowedOrder.map((key) => byKey.get(key)).filter((item): item is ResolvedNavigationItem => Boolean(item));
  })();

  return (
    <div className="layout-wrapper">
      <Sidebar items={filteredNavigation} loading={loadingAccess} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <Topbar access={access} showScopeSelectors={showTopbarScopeSelectors} />
        <main className="main-content">
          <div className="content-inner">{children}</div>
        </main>
      </div>
    </div>
  );
}
