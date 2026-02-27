"use client";

import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isLogin = pathname === '/login';

    if (isLogin) {
        return <>{children}</>;
    }

    return (
        <div className="layout-wrapper">
            <Sidebar />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
                <Topbar />
                <main className="main-content">
                    <div className="content-inner">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
