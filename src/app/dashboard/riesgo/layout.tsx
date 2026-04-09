import RiskDashboardShell from '@/modules/linear-risk/ui/components/RiskDashboardShell';

export default function RiesgoDashboardLayout({ children }: { children: React.ReactNode }) {
  return <RiskDashboardShell>{children}</RiskDashboardShell>;
}
